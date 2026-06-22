/**
 * @file target-llm-request-builder.ts
 * @description NovelCommand → LLMRequest 构造器 — P3-A
 *
 * P3-A 为 Pilot 阶段，只支持 chapter.generate 与 chapter.continue（即 chapter.rewrite + command=continue）。
 * Prompt 只包含必要上下文，不暴露密钥、不携带过长历史。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';
import type { LLMRequest, LLMRequestMetadata } from './llm-request-types';
import { buildChapterGenerationPrompt } from './chapter-prompt-builder';

/**
 * 判断当前命令是否为 AI 续写（chapter.continue）。
 *
 * 在 NovelCommand 类型中，continue/rewrite/expand/polish/summarize 统一映射为 chapter.rewrite，
 * 通过 command 字段区分子类型。
 */
export function isChapterContinueCommand(command: NovelCommand): boolean {
  return command.type === 'chapter.rewrite' && command.command === 'continue';
}

/**
 * 判断当前命令是否被 RealLLMAdapter 支持。
 *
 * P3-A 仅开放：
 * - chapter.generate
 * - chapter.rewrite + command=continue
 */
export function isRealLLMSupportedCommand(command: NovelCommand): boolean {
  if (command.type === 'chapter.generate') return true;
  if (isChapterContinueCommand(command)) return true;
  return false;
}

/**
 * 根据命令类型构建用户 prompt。
 *
 * - chapter.generate：P3-C 使用 chapter-prompt-builder，带 token 预算、上下文裁剪与生成约束。
 * - chapter.continue：保持 P3-A 简洁续写 prompt。
 * - 其他：兜底。
 */
function buildPrompt(command: NovelCommand, context: AdapterContext): { prompt: string; systemPrompt: string; wasTrimmed?: boolean; targetWordCount?: number } {
  const systemPrompt =
    '你是一位中文小说写作助手。请根据用户提供的上下文续写或生成正文，保持风格一致，只输出正文内容，不要输出解释、总结或 Markdown 格式。';

  if (command.type === 'chapter.generate') {
    const chapterPrompt = buildChapterGenerationPrompt(command, context);
    return {
      systemPrompt: chapterPrompt.systemPrompt,
      prompt: chapterPrompt.prompt,
      wasTrimmed: chapterPrompt.wasTrimmed,
      targetWordCount: chapterPrompt.targetWordCount,
    };
  }

  if (isChapterContinueCommand(command)) {
    return {
      systemPrompt,
      prompt: `请续写以下小说正文，保持原有风格：\n\n${command.text}`,
    };
  }

  return {
    systemPrompt,
    prompt: command.text,
  };
}

/**
 * 构造 LLM 请求元数据。
 *
 * 只包含定位信息，不得包含密钥或完整 prompt。
 */
function buildMetadata(command: NovelCommand, context: AdapterContext): LLMRequestMetadata {
  return {
    projectId: context.projectId,
    chapterId: context.chapterId ?? command.chapterId,
    branchId: context.branchId,
    modelProfileId: context.modelProfileId,
    modelRole: context.modelRole,
    skillId: command.skillId,
    workflowId: command.workflowId,
  };
}

/**
 * 从 NovelCommand 构建 LLMRequest。
 *
 * 注意：
 * - requestId 由调用方生成，保证一次命令对应一次请求可追踪。
 * - 默认 stream=false，避免未显式开启流式时产生流式事件。
 * - 默认 timeoutMs=30_000，P3-A 真实调用先使用较短超时。
 * - P3-C chapter.generate 的 metadata 携带 wasTrimmed / targetWordCount，供结果校验使用。
 */
export function buildLLMRequest(
  requestId: string,
  command: NovelCommand,
  context: AdapterContext,
  options?: { stream?: boolean; timeoutMs?: number },
): LLMRequest {
  const { prompt, systemPrompt, wasTrimmed, targetWordCount } = buildPrompt(command, context);

  return {
    requestId,
    adapter: 'real-llm',
    commandId: `${command.type}:${command.chapterId}`,
    workflowId: command.workflowId,
    prompt,
    systemPrompt,
    stream: options?.stream ?? false,
    timeoutMs: options?.timeoutMs ?? 30_000,
    metadata: {
      ...buildMetadata(command, context),
      wasTrimmed,
      targetWordCount,
    },
  };
}
