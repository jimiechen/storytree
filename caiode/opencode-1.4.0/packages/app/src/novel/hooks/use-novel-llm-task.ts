/**
 * @file hooks/use-novel-llm-task.ts
 * @description 将 LLMStreamEvent 聚合为 AITask 的 Hook — P3-B
 *
 * 设计原则：
 * - UI 不直接解析供应商原始流，只消费 NovelForge 统一事件。
 * - 本 Hook 负责把离散事件聚合成一个可观察的 AITask 状态。
 * - token delta 实时进入 preview，最终文本进入 output.text。
 * - reasoning delta 单独记录但不混入 preview，避免 UI 显示推理过程。
 * - 取消操作通过 AbortController 实现，状态标记为 cancelled。
 *
 * 为什么需要聚合？
 * - Workflow Engine / agent-run Tool 返回的是事件数组或 AsyncGenerator；
 * - UI 组件（AITaskPanel / WorkspaceAIProgressDock / AIResultCard）只认识 AITask；
 * - 本 Hook 作为边界层，把底层事件翻译为 UI 可直接绑定的状态。
 */

import { createSignal } from 'solid-js';
import type { AITask, AITaskInput } from '../types/ai-task';
import type { LLMStreamEvent } from '../llm/llm-stream-events';

export interface UseNovelLLMTaskReturn {
  /** 当前聚合后的 AITask 状态 */
  task: () => AITask | null;
  /**
   * 启动任务。
   * streamFactory 接收 AbortSignal，通过 yield LLMStreamEvent 推送事件；
   * Hook 内部负责把事件映射到 AITask 状态。
   */
  startTask: (
    input: AITaskInput,
    streamFactory: (abortSignal: AbortSignal) => AsyncGenerator<LLMStreamEvent>,
  ) => Promise<AITask>;
  /** 手动触发一个事件（通常由外部 Adapter 直接调用） */
  emit: (event: LLMStreamEvent) => void;
  /** 取消当前任务 */
  cancel: () => void;
}

const PREVIEW_MAX_LENGTH = 200;

function createInitialTask(input: AITaskInput): AITask {
  return {
    id: crypto.randomUUID(),
    type: input.type,
    chapterId: input.chapterId,
    status: 'running',
    input: {
      text: input.text,
      selectedText: input.selectedText,
      characterId: input.characterId,
    },
    preview: '',
    createdAt: new Date(),
  };
}

function truncatePreview(text: string): string {
  if (text.length <= PREVIEW_MAX_LENGTH) return text;
  return text.slice(0, PREVIEW_MAX_LENGTH) + '...';
}

/** 把结构化 LLM 错误码映射为用户可读的简短文案，避免暴露内部细节。 */
function formatLLMError(errorCode: string, error: string): string {
  const userMessages: Record<string, string> = {
    REAL_LLM_NOT_ENABLED: '真实 LLM 已关闭，请在设置中开启后重试。',
    TARGET_LLM_ADAPTER_DISABLED: '目标 Adapter 未启用。',
    LLM_STREAMING_DISABLED: '流式生成已关闭，可关闭 stream 后重试。',
    LLM_SECRET_MISSING: '缺少 API Key，请检查环境配置。',
    LLM_REQUEST_TIMEOUT: '请求超时，请稍后重试。',
    LLM_REQUEST_CANCELLED: '请求已取消。',
    LLM_REQUEST_FAILED: '请求失败，请稍后重试。',
    LLM_NETWORK_ERROR: '网络错误，请检查网络连接。',
    LLM_PROVIDER_ERROR: '模型服务返回错误，请稍后重试。',
    LLM_STREAM_PARSE_ERROR: '流式响应解析失败，请稍后重试。',
    LLM_EMPTY_RESPONSE: '模型返回空响应，请稍后重试。',
    ADAPTER_DISABLED: '该 Adapter 已被禁用。',
    CLIENT_STUB_ONLY: '当前为 stub 模式，不会发起真实请求。',
    LLM_SECRET_LEAK: '检测到可能的密钥泄露，请联系管理员。',
  };
  return userMessages[errorCode] ?? `[${errorCode}] ${error}`;
}

/**
 * 创建 LLM 任务状态 Hook。
 *
 * 适用于 P3-B AI 续写 UI：把 executeStream 产生的事件流转换为 Solid 信号，
 * 供 AITaskPanel / WorkspaceAIProgressDock / AIResultCard 消费。
 */
export function useNovelLLMTask(): UseNovelLLMTaskReturn {
  const [task, setTask] = createSignal<AITask | null>(null);
  let buffer = '';
  let startTime = 0;
  let abortController: AbortController | null = null;

  function resetTask(input: AITaskInput) {
    buffer = '';
    startTime = Date.now();
    abortController = new AbortController();
    setTask(createInitialTask(input));
  }

  function handleEvent(event: LLMStreamEvent): boolean {
    let shouldStop = false;
    setTask((prev) => {
      if (!prev) return prev;
      switch (event.type) {
        case 'llm.request.started':
          return { ...prev, status: 'running' };
        case 'llm.token.delta': {
          buffer += event.text;
          return { ...prev, preview: truncatePreview(buffer) };
        }
        case 'llm.reasoning.delta':
          // reasoning 不进入 preview，仅更新状态保持响应性
          return prev;
        case 'llm.request.completed': {
          return {
            ...prev,
            status: 'completed',
            output: {
              text: buffer,
              wordCount: buffer.length,
            },
            duration: Date.now() - startTime,
            completedAt: new Date(),
          };
        }
        case 'llm.request.failed': {
          shouldStop = true;
          return {
            ...prev,
            status: 'failed',
            error: formatLLMError(event.errorCode, event.error),
            duration: Date.now() - startTime,
            completedAt: new Date(),
          };
        }
        case 'llm.request.cancelled': {
          shouldStop = true;
          return {
            ...prev,
            status: 'cancelled',
            duration: Date.now() - startTime,
            completedAt: new Date(),
          };
        }
        default:
          return prev;
      }
    });
    return shouldStop;
  }

  async function startTask(
    input: AITaskInput,
    streamFactory: (abortSignal: AbortSignal) => AsyncGenerator<LLMStreamEvent>,
  ): Promise<AITask> {
    resetTask(input);
    const controller = abortController!;

    try {
      for await (const event of streamFactory(controller.signal)) {
        if (controller.signal.aborted) {
          handleEvent({ type: 'llm.request.cancelled', requestId: task()?.id ?? 'unknown' });
          break;
        }
        const shouldStop = handleEvent(event);
        if (shouldStop) break;
      }
    } catch (error) {
      handleEvent({
        type: 'llm.request.failed',
        requestId: task()?.id ?? 'unknown',
        errorCode: 'LLM_TASK_ERROR',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const finalTask = task();
    if (!finalTask) {
      throw new Error('LLM task was reset before completion');
    }
    return finalTask;
  }

  function emit(event: LLMStreamEvent) {
    handleEvent(event);
  }

  function cancel() {
    abortController?.abort();
  }

  return {
    task,
    startTask,
    emit,
    cancel,
  };
}
