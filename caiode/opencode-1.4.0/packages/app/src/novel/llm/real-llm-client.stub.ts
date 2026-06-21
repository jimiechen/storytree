/**
 * @file real-llm-client.stub.ts
 * @description 真实 LLM Client Stub — P3-0
 *
 * P3-0 不会发起真实网络请求，
 * 本 stub 只用于验证请求类型、事件协议与 FeatureGate 边界。
 */

import type { LLMRequest, LLMRequestOptions, LLMResponse } from './llm-request-types';
import type { LLMStreamEvent } from './llm-stream-events';
import { LLMError } from './llm-error-types';
import {
  createLLMRequestStartedEvent,
  createLLMTokenDeltaEvent,
  createLLMRequestCompletedEvent,
} from './llm-stream-events';

/**
 * 真实 LLM Client 的 P3-0 stub。
 *
 * - execute 直接抛错 CLIENT_STUB_ONLY，避免任何非流式真实调用。
 * - executeStream 返回可预测的 stub 事件序列，用于测试 UI 消费。
 * - 不读取环境变量、不读取 API Key、不发起 fetch。
 */
export class RealLLMClientStub {
  /** 非流式执行在 P3-0 不可用。 */
  async execute(_request: LLMRequest, _options?: LLMRequestOptions): Promise<LLMResponse> {
    throw new LLMError('CLIENT_STUB_ONLY', _request.requestId);
  }

  /**
   * 流式执行 stub。
   *
   * 返回稳定事件序列：
   * llm.request.started → token deltas → llm.request.completed
   */
  async *executeStream(
    request: LLMRequest,
    _options?: LLMRequestOptions,
  ): AsyncGenerator<LLMStreamEvent> {
    yield createLLMRequestStartedEvent(request.requestId, request.adapter, {
      commandId: request.commandId,
      workflowId: request.workflowId,
    });

    yield createLLMTokenDeltaEvent(request.requestId, '[Stub] ');
    yield createLLMTokenDeltaEvent(request.requestId, 'P3-0 未调用真实 LLM。');

    yield createLLMRequestCompletedEvent(request.requestId, {
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    });
  }
}
