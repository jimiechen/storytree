/**
 * @file target-llm-client.ts
 * @description 真实 LLM Client 接口与默认实现 — P3-A
 *
 * 设计原则：
 * - Client 只负责调用 transport，并把超时、取消、异常转换为结构化 LLMError。
 * - 真实网络请求由可注入的 LLMTransport 完成，默认 transport 不会发起真实请求。
 * - API Key 必须由外部注入，Client 不读取 process.env，前端源码不持有密钥。
 */

import type { LLMRequest, LLMResponse } from './llm-request-types';
import type { LLMStreamEvent } from './llm-stream-events';
import { LLMError } from './llm-error-types';

/**
 * LLM Transport 接口。
 *
 * 真实供应商 transport 实现此接口；测试与默认场景使用 mock / disabled transport。
 */
export interface LLMTransport {
  /** 非流式完成 */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /** 流式完成，返回 NovelForge 统一事件 */
  stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent>;

  /** transport 名称，用于日志与错误信息 */
  readonly name: string;
}

/**
 * 默认禁用 transport。
 *
 * 当没有显式注入真实 transport 时使用，保证默认情况下不会发起真实网络请求。
 */
export const disabledLLMTransport: LLMTransport = {
  name: 'disabled',

  async complete(request: LLMRequest): Promise<LLMResponse> {
    throw new LLMError(
      'CLIENT_STUB_ONLY',
      request.requestId,
      { message: '未注入真实 LLM transport，禁止发起真实请求' },
    );
  },

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
    throw new LLMError(
      'CLIENT_STUB_ONLY',
      request.requestId,
      { message: '未注入真实 LLM transport，禁止发起真实请求' },
    );
  },
};

/** Target LLM Client 接口。 */
export interface TargetLLMClient {
  /** transport 名称 */
  readonly transportName: string;

  /** 非流式完成 */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /** 流式完成 */
  stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent>;
}

/** Client 选项。 */
export interface TargetLLMClientOptions {
  transport?: LLMTransport;
}

/**
 * 创建 Target LLM Client。
 *
 * 默认使用 disabledLLMTransport，避免误发真实请求。
 * 只有在受控环境中显式注入真实 transport（如 DeepSeekTransport）时才会调用真实 API。
 */
export function createTargetLLMClient(options?: TargetLLMClientOptions): TargetLLMClient {
  const transport = options?.transport ?? disabledLLMTransport;

  return {
    transportName: transport.name,

    async complete(request: LLMRequest): Promise<LLMResponse> {
      const timeoutMs = request.timeoutMs > 0 ? request.timeoutMs : 30_000;
      const timeoutError = new LLMError(
        'LLM_REQUEST_TIMEOUT',
        request.requestId,
        { message: `请求超时（${timeoutMs}ms）` },
      );

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
      });

      try {
        const response = await Promise.race([transport.complete(request), timeoutPromise]);
        return response;
      } catch (error) {
        if (error instanceof LLMError) throw error;
        throw new LLMError(
          'LLM_NETWORK_ERROR',
          request.requestId,
          { cause: error, message: error instanceof Error ? error.message : '网络请求失败' },
        );
      } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
      }
    },

    async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
      try {
        yield* transport.stream(request);
      } catch (error) {
        if (error instanceof LLMError) throw error;
        throw new LLMError(
          'LLM_NETWORK_ERROR',
          request.requestId,
          { cause: error, message: error instanceof Error ? error.message : '流式请求失败' },
        );
      }
    },
  };
}
