/**
 * @file real-llm-adapter.ts
 * @description 真实 LLM Adapter 实现 — P3-A / P3-D
 *
 * 首期使用 DeepSeek 官方 API（OpenAI-compatible）。
 * P3-D 增强：
 * - 按 ModelProfile 选择模型配置与 client。
 * - 记录 LLMUsage 与估算成本。
 * - 真实调用失败时可选回退到 mock adapter。
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
import type { ModelProfile } from '../llm/model-profile';
import type { ModelProfileRegistry } from '../llm/model-profile-registry';
import { createDefaultModelProfileRegistry } from '../llm/model-profile-registry';
import type { ModelRouter } from '../llm/model-router';
import { createModelRouter } from '../llm/model-router';
import type { UsageTracker } from '../llm/usage-tracker';
import { buildUsageRecord } from '../llm/usage-tracker';
import { estimateCost, type CostEstimate } from '../llm/cost-estimator';
import { executeWithFallback } from '../llm/fallback-handler';

/**
 * Real LLM Adapter 选项。
 */
export interface RealLLMExecutionAdapterOptions {
  /** 固定 client；未启用模型路由或 factory 未提供时使用 */
  client?: TargetLLMClient;
  gates: RealLLMFeatureGates;
  /** P3-C：可选重试策略，未指定则使用默认策略 */
  retryPolicy?: RetryPolicy;
  /** P3-D：模型配置注册表 */
  registry?: ModelProfileRegistry;
  /** P3-D：用量记录器 */
  tracker?: UsageTracker;
  /** P3-D：按 profile 创建 client 的工厂 */
  clientFactory?: (profile: ModelProfile) => TargetLLMClient;
  /** P3-D：fallback 时使用的 mock adapter */
  fallbackAdapter?: AgentExecutionAdapter;
}

/**
 * 真实 LLM 执行器。
 */
export class RealLLMExecutionAdapter implements AgentExecutionAdapter {
  readonly name = 'real-llm' as const;

  private readonly client: TargetLLMClient;

  private readonly gates: RealLLMFeatureGates;

  private readonly retryPolicy: RetryPolicy;

  private readonly registry: ModelProfileRegistry;

  private readonly router: ModelRouter;

  private readonly tracker?: UsageTracker;

  private readonly clientFactory?: (profile: ModelProfile) => TargetLLMClient;

  private readonly fallbackAdapter?: AgentExecutionAdapter;

  constructor(options: RealLLMExecutionAdapterOptions) {
    this.client = options.client ?? createTargetLLMClientWithDisabled();
    this.gates = options.gates;
    this.retryPolicy = options.retryPolicy ?? DEFAULT_GENERATION_RETRY_POLICY;
    this.registry = options.registry ?? createDefaultModelProfileRegistry();
    this.router = createModelRouter(this.registry);
    this.tracker = options.tracker;
    this.clientFactory = options.clientFactory;
    this.fallbackAdapter = options.fallbackAdapter;
  }

  canHandle(command: NovelCommand, _context: AdapterContext): boolean {
    return isRealLLMSupportedCommand(command);
  }

  async execute(command: NovelCommand, context: AdapterContext): Promise<AdapterExecutionResult> {
    const gateCheck = assertRealLLMExecutionAllowed(this.gates);
    if (!gateCheck.allowed) {
      return { success: false, errorCode: gateCheck.code, error: gateCheck.message };
    }

    const profile = this.router.resolveProfile(command, context);
    const client = this.resolveClient(profile);
    const requestId = crypto.randomUUID();
    const llmRequest = buildLLMRequest(requestId, command, context, { stream: false });

    if (context.dryRun) {
      const preview = this.buildDryRunPreview(llmRequest, profile);
      this.logSafe(requestId, client.transportName, llmRequest.prompt, preview, undefined);
      return { success: true, result: this.buildResult(command, context, preview, profile) };
    }

    return executeWithFallback(
      () => this.doExecute(client, llmRequest, command, context, profile),
      (errorCode) => this.runFallback(command, context, profile, errorCode),
      {
        enabled: this.gates.llmFallbackToMockEnabled,
        retryableCodes: ['LLM_REQUEST_TIMEOUT', 'LLM_NETWORK_ERROR', 'LLM_PROVIDER_ERROR', 'LLM_EMPTY_RESPONSE', 'LLM_REQUEST_FAILED', 'CLIENT_STUB_ONLY'],
      },
    );
  }

  private async doExecute(
    client: TargetLLMClient,
    llmRequest: LLMRequest,
    command: NovelCommand,
    context: AdapterContext,
    profile: ModelProfile,
  ): Promise<AdapterExecutionResult> {
    try {
      const response = await withRetry(() => client.complete(llmRequest), this.retryPolicy);
      const validation = this.validateResult(response.text, llmRequest);
      this.logSafe(llmRequest.requestId, client.transportName, llmRequest.prompt, validation.text, undefined);
      this.recordUsage(llmRequest.requestId, profile, response.usage);

      const result = this.buildResult(command, context, validation.text, profile, validation, response.usage);
      return { success: true, result };
    } catch (error) {
      const message = toSafeLLMErrorMessage(error);
      const code = error instanceof LLMError ? error.code : 'LLM_REQUEST_FAILED';
      this.logSafe(llmRequest.requestId, client.transportName, llmRequest.prompt, '', message);
      return { success: false, errorCode: code, error: message };
    }
  }

  async *executeStream(command: NovelCommand, context: AdapterContext): AsyncGenerator<LLMStreamEvent> {
    const gateCheck = assertLLMStreamingAllowed(this.gates);
    if (!gateCheck.allowed) {
      yield { type: 'llm.request.failed', requestId: 'gate-check', errorCode: gateCheck.code, error: gateCheck.message };
      return;
    }

    const profile = this.router.resolveProfile(command, context);
    const client = this.resolveClient(profile);
    const requestId = crypto.randomUUID();
    const llmRequest = buildLLMRequest(requestId, command, context, { stream: true });

    if (context.dryRun) {
      yield createLLMRequestStartedEvent(requestId, client.transportName);
      yield createLLMTokenDeltaEvent(requestId, this.buildDryRunPreview(llmRequest, profile));
      yield createLLMRequestCompletedEvent(requestId);
      return;
    }

    const events: LLMStreamEvent[] = [];
    try {
      for await (const event of client.stream(llmRequest)) {
        events.push(event);
        if (event.type === 'llm.request.completed' && event.usage) {
          this.recordUsage(requestId, profile, event.usage);
        }
        yield event;
      }
      const text = collectLLMText(events);
      this.logSafe(requestId, client.transportName, llmRequest.prompt, text, undefined);
    } catch (error) {
      const message = toSafeLLMErrorMessage(error);
      const code = error instanceof LLMError ? error.code : 'LLM_REQUEST_FAILED';
      const text = collectLLMText(events);
      this.logSafe(requestId, client.transportName, llmRequest.prompt, text, message);
      yield { type: 'llm.request.failed', requestId, errorCode: code, error: message };
    }
  }

  private resolveClient(profile: ModelProfile): TargetLLMClient {
    if (this.clientFactory) {
      return this.clientFactory(profile);
    }
    return this.client;
  }

  private recordUsage(requestId: string, profile: ModelProfile, usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }): void {
    if (!this.tracker || !usage) return;
    this.tracker.record(buildUsageRecord(requestId, profile.id, profile.modelId, usage));
  }

  private buildResult(
    command: NovelCommand,
    context: AdapterContext,
    text: string,
    profile: ModelProfile,
    validation?: GenerationValidationResult,
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
  ): NovelAgentResult {
    const effectiveValidation = validation ?? validateGenerationResult(text, 0, { minWordCount: 0, minRatioOfTarget: 0 });
    const cost: CostEstimate | undefined = usage ? estimateCost(profile, usage) : undefined;
    return {
      taskId: `${command.type}:${command.chapterId}`,
      attemptId: 1,
      status: 'completed',
      text: effectiveValidation.text,
      wordCount: effectiveValidation.wordCount,
      summary: effectiveValidation.valid ? '' : this.formatValidationSummary(effectiveValidation),
      durationMs: 0,
      validationIssues: effectiveValidation.issues,
      wasTrimmed: Boolean(context.modelProfileId) || Boolean(context.modelRole),
      metadata: {
        modelProfileId: profile.id,
        modelId: profile.modelId,
        estimatedCost: cost,
      },
    };
  }

  private async runFallback(
    command: NovelCommand,
    context: AdapterContext,
    profile: ModelProfile,
    errorCode: string,
  ): Promise<AdapterExecutionResult> {
    if (!this.fallbackAdapter) {
      return { success: false, errorCode: 'FALLBACK_NOT_AVAILABLE', error: '未配置 fallback adapter' };
    }
    const result = await this.fallbackAdapter.execute(command, { ...context, fallback: true, originalErrorCode: errorCode });
    if (result.success && result.result) {
      return {
        success: true,
        result: {
          ...result.result,
          fallback: true,
          originalErrorCode: errorCode,
          metadata: {
            ...(result.result.metadata ?? {}),
            modelProfileId: profile.id,
            fallback: true,
          },
        },
      };
    }
    return result;
  }

  private buildDryRunPreview(llmRequest: LLMRequest, profile: ModelProfile): string {
    return [
      '[dryRun] 真实 LLM 请求预览',
      `profile: ${profile.id}`,
      `model: ${profile.modelId}`,
      `adapter: ${llmRequest.adapter}`,
      `transport: ${this.resolveClient(profile).transportName}`,
      `stream: ${llmRequest.stream}`,
      `timeoutMs: ${llmRequest.timeoutMs}`,
      `promptLength: ${llmRequest.prompt.length}`,
      `hasSystemPrompt: ${Boolean(llmRequest.systemPrompt)}`,
      `metadata: ${JSON.stringify(llmRequest.metadata)}`,
    ].join('\n');
  }

  private validateResult(rawText: string, llmRequest: LLMRequest): GenerationValidationResult {
    const targetWordCount = llmRequest.metadata?.targetWordCount as number | undefined;
    if (typeof targetWordCount === 'number' && targetWordCount > 0) {
      return validateGenerationResult(rawText, targetWordCount);
    }
    return validateGenerationResult(rawText, 0, { minWordCount: 0, minRatioOfTarget: 0 });
  }

  private formatValidationSummary(validation: GenerationValidationResult): string {
    const messages = validation.issues.map((issue) => issue.message);
    return `生成结果存在以下问题，请检查后再采纳：${messages.join('；')}`;
  }

  private logSafe(
    requestId: string,
    transportName: string,
    prompt: string,
    responseText: string,
    error: string | undefined,
  ): void {
    if (!this.gates.llmRequestLogEnabled) return;
    const entry = createSafeLLMLogEntry({ requestId, adapter: transportName, prompt, responseText, error });
    // eslint-disable-next-line no-console
    console.log('[RealLLM] safe log', entry);
  }
}

function createTargetLLMClientWithDisabled(): TargetLLMClient {
  // 动态导入避免顶层引入循环依赖
  const { createTargetLLMClient } = require('../llm/target-llm-client');
  return createTargetLLMClient();
}