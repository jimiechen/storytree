/**
 * @file real-llm-adapter.ts
 * @description 真实 LLM Adapter 实现 — P3-A
 *
 * 首期使用 DeepSeek 官方 API（OpenAI-compatible）。
 * Adapter 负责：
 * - Gate 校验（双 gate）。
 * - NovelCommand → LLMRequest。
 * - 调用 TargetLLMClient。
 * - 流式结果转换为 NovelForge 统一事件。
 * - 非流式结果转换为 NovelAgentResult。
 * - 安全日志记录（脱敏）。
 *
 * 不负责：
 * - 直接修改章节 Store。
 * - 调用 applyWorkflowEvents。
 * - 在 UI 上展示结果。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { AdapterContext, AdapterExecutionResult, AgentExecutionAdapter } from './adapter-types';
import type { TargetLLMClient } from '../llm/target-llm-client';
import type { LLMStreamEvent } from '../llm/llm-stream-events';
import type { RealLLMFeatureGates } from '../llm/llm-feature-gates';
import {
  assertRealLLMExecutionAllowed,
  assertLLMStreamingAllowed,
} from '../llm/llm-feature-gates';
import { buildLLMRequest, isRealLLMSupportedCommand } from '../llm/target-llm-request-builder';
import { LLMError, toSafeLLMErrorMessage } from '../llm/llm-error-types';
import type { LLMRequest } from '../llm/llm-request-types';
import { createSafeLLMLogEntry } from '../llm/llm-safe-logger';
import {
  collectLLMText,
  createLLMRequestStartedEvent,
  createLLMTokenDeltaEvent,
  createLLMRequestCompletedEvent,
} from '../llm/llm-stream-events';
import { withRetry, type RetryPolicy, DEFAULT_GENERATION_RETRY_POLICY } from '../llm/retry-policy';
import { validateGenerationResult, type GenerationValidationResult } from '../llm/generation-result-validator';

/**
 * Real LLM Adapter 选项。
 */
export interface RealLLMExecutionAdapterOptions {
  client: TargetLLMClient;
  gates: RealLLMFeatureGates;
  /** P3-C：可选重试策略，未指定则使用默认策略 */
  retryPolicy?: RetryPolicy;
}

/**
 * 真实 LLM 执行器。
 *
 * 实现 AgentExecutionAdapter 以注册到 AdapterRouter；
 * 同时提供 executeStream 供 Chat Debug / UI 流式消费。
 */
export class RealLLMExecutionAdapter implements AgentExecutionAdapter {
  readonly name = 'real-llm' as const;

  private readonly client: TargetLLMClient;

  private readonly gates: RealLLMFeatureGates;

  private readonly retryPolicy: RetryPolicy;

  constructor(options: RealLLMExecutionAdapterOptions) {
    this.client = options.client;
    this.gates = options.gates;
    this.retryPolicy = options.retryPolicy ?? DEFAULT_GENERATION_RETRY_POLICY;
  }

  /**
   * P3-A 只支持 chapter.generate 与 chapter.continue。
   */
  canHandle(command: NovelCommand, _context: AdapterContext): boolean {
    return isRealLLMSupportedCommand(command);
  }

  /**
   * 非流式执行，返回终态 NovelAgentResult。
   *
   * 调用前校验双 gate；失败时返回结构化 AdapterExecutionResult。
   * dryRun=true 时只构造请求并返回参数预览，不调用真实 API。
   */
  async execute(command: NovelCommand, context: AdapterContext): Promise<AdapterExecutionResult> {
    const gateCheck = assertRealLLMExecutionAllowed(this.gates);
    if (!gateCheck.allowed) {
      return {
        success: false,
        errorCode: gateCheck.code,
        error: gateCheck.message,
      };
    }

    const requestId = crypto.randomUUID();
    const llmRequest = buildLLMRequest(requestId, command, context, { stream: false });

    if (context.dryRun) {
      const preview = this.buildDryRunPreview(llmRequest);
      this.logSafe(requestId, llmRequest.prompt, preview, undefined);
      return {
        success: true,
        result: {
          taskId: `${command.type}:${command.chapterId}`,
          attemptId: 1,
          status: 'completed',
          text: preview,
          wordCount: preview.length,
          summary: '',
          durationMs: 0,
        },
      };
    }

    try {
      const response = await withRetry(
        () => this.client.complete(llmRequest),
        this.retryPolicy,
      );

      const validation = this.validateResult(response.text, llmRequest);
      this.logSafe(requestId, llmRequest.prompt, validation.text, undefined);

      const result: NovelAgentResult = {
        taskId: `${command.type}:${command.chapterId}`,
        attemptId: 1,
        status: 'completed',
        text: validation.text,
        wordCount: validation.wordCount,
        summary: validation.valid ? '' : this.formatValidationSummary(validation),
        durationMs: 0,
        validationIssues: validation.issues,
        wasTrimmed: Boolean(llmRequest.metadata?.wasTrimmed),
      };
      return { success: true, result };
    } catch (error) {
      const message = toSafeLLMErrorMessage(error);
      const code = error instanceof LLMError ? error.code : 'LLM_REQUEST_FAILED';
      this.logSafe(requestId, llmRequest.prompt, '', message);
      return {
        success: false,
        errorCode: code,
        error: message,
      };
    }
  }

  /**
   * 构造 dryRun 预览文本。
   *
   * 显示请求元数据与参数，不暴露完整 prompt / 密钥。
   */
  private buildDryRunPreview(llmRequest: LLMRequest): string {
    return [
      '[dryRun] 真实 LLM 请求预览',
      `adapter: ${llmRequest.adapter}`,
      `transport: ${this.client.transportName}`,
      `stream: ${llmRequest.stream}`,
      `timeoutMs: ${llmRequest.timeoutMs}`,
      `promptLength: ${llmRequest.prompt.length}`,
      `hasSystemPrompt: ${Boolean(llmRequest.systemPrompt)}`,
      `metadata: ${JSON.stringify(llmRequest.metadata)}`,
    ].join('\n');
  }

  /**
   * P3-C：对生成结果做基础质量校验。
   *
   * chapter.generate 使用 metadata.targetWordCount；其他命令不做字数要求。
   */
  private validateResult(rawText: string, llmRequest: LLMRequest): GenerationValidationResult {
    const targetWordCount = llmRequest.metadata?.targetWordCount as number | undefined;
    if (typeof targetWordCount === 'number' && targetWordCount > 0) {
      return validateGenerationResult(rawText, targetWordCount);
    }
    return validateGenerationResult(rawText, 0, { minWordCount: 0, minRatioOfTarget: 0 });
  }

  /**
   * 将校验问题列表格式化为简短摘要。
   */
  private formatValidationSummary(validation: GenerationValidationResult): string {
    const messages = validation.issues.map((issue) => issue.message);
    return `生成结果存在以下问题，请检查后再采纳：${messages.join('；')}`;
  }

  /**
   * 流式执行，返回 NovelForge 统一事件。
   *
   * 调用前校验双 gate + 流式 gate；失败时第一个事件为 failed。
   */
  async *executeStream(command: NovelCommand, context: AdapterContext): AsyncGenerator<LLMStreamEvent> {
    const gateCheck = assertLLMStreamingAllowed(this.gates);
    if (!gateCheck.allowed) {
      yield {
        type: 'llm.request.failed',
        requestId: 'gate-check',
        errorCode: gateCheck.code,
        error: gateCheck.message,
      };
      return;
    }

    const requestId = crypto.randomUUID();
    const llmRequest = buildLLMRequest(requestId, command, context, { stream: true });

    if (context.dryRun) {
      yield createLLMRequestStartedEvent(requestId, this.client.transportName);
      yield createLLMTokenDeltaEvent(requestId, this.buildDryRunPreview(llmRequest));
      yield createLLMRequestCompletedEvent(requestId);
      return;
    }

    const events: LLMStreamEvent[] = [];
    try {
      for await (const event of this.client.stream(llmRequest)) {
        events.push(event);
        yield event;
      }

      const text = collectLLMText(events);
      this.logSafe(requestId, llmRequest.prompt, text, undefined);
    } catch (error) {
      const message = toSafeLLMErrorMessage(error);
      const code = error instanceof LLMError ? error.code : 'LLM_REQUEST_FAILED';
      const text = collectLLMText(events);
      this.logSafe(requestId, llmRequest.prompt, text, message);
      yield {
        type: 'llm.request.failed',
        requestId,
        errorCode: code,
        error: message,
      };
    }
  }

  /**
   * 记录脱敏后的安全日志。
   *
   * 实际落盘逻辑由调用方决定；adapter 只生成安全条目。
   */
  private logSafe(
    requestId: string,
    prompt: string,
    responseText: string,
    error: string | undefined,
  ): void {
    if (!this.gates.llmRequestLogEnabled) return;
    const entry = createSafeLLMLogEntry({
      requestId,
      adapter: this.client.transportName,
      prompt,
      responseText,
      error,
    });
    // eslint-disable-next-line no-console
    console.log('[RealLLM] safe log', entry);
  }
}
