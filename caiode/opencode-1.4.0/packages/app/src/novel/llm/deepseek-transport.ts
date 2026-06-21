/**
 * @file deepseek-transport.ts
 * @description DeepSeek 官方 API Transport — P3-A
 *
 * DeepSeek API 兼容 OpenAI Chat Completions 协议。
 * 首期 Pilot 使用 deepseek-chat 模型，支持非流式与流式两种模式。
 *
 * 安全约束：
 * - API Key 必须由外部注入，本文件不读取 process.env。
 * - 前端源码不直接构造 Authorization header，只在受控运行环境注入密钥。
 * - 请求 / 响应中不包含完整 prompt 落盘逻辑。
 */

import type { LLMRequest, LLMResponse, LLMUsage } from './llm-request-types';
import type { LLMStreamEvent } from './llm-stream-events';
import { LLMError } from './llm-error-types';
import {
  createLLMRequestStartedEvent,
  createLLMTokenDeltaEvent,
  createLLMReasoningDeltaEvent,
  createLLMRequestCompletedEvent,
  createLLMRequestFailedEvent,
} from './llm-stream-events';
import type { LLMTransport } from './target-llm-client';

/** DeepSeek 官方 API 默认 endpoint。 */
export const DEEPSEEK_API_BASE_URL = 'https://api.deepseek.com';

/** DeepSeek 默认模型（V3）。 */
export const DEEPSEEK_DEFAULT_MODEL = 'deepseek-chat';

/** DeepSeek Transport 选项。 */
export interface DeepSeekTransportOptions {
  /** API Key，必须由外部注入 */
  apiKey: string;
  /** 基础 URL，默认 DeepSeek 官方 */
  baseURL?: string;
  /** 模型名称，默认 deepseek-chat */
  model?: string;
  /** 温度，默认 0.7 */
  temperature?: number;
  /** 最大 token 数，默认 2048 */
  maxTokens?: number;
  /** 是否输出 reasoning_content，默认 false */
  includeReasoning?: boolean;
  /** fetch 实现，可注入用于测试 */
  fetchImpl?: typeof fetch;
}

/** DeepSeek / OpenAI 消息格式。 */
interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** DeepSeek / OpenAI 请求体。 */
interface DeepSeekRequestBody {
  model: string;
  messages: DeepSeekMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

/** DeepSeek / OpenAI 非流式响应 choice。 */
interface DeepSeekChoice {
  message: { content: string; reasoning_content?: string };
  finish_reason: string;
}

/** DeepSeek / OpenAI 非流式响应。 */
interface DeepSeekCompletionResponse {
  id: string;
  choices: DeepSeekChoice[];
  usage?: LLMUsage;
  error?: { message: string; type?: string };
}

/** DeepSeek / OpenAI 流式响应 delta。 */
interface DeepSeekStreamDelta {
  content?: string;
  reasoning_content?: string;
}

/** DeepSeek / OpenAI 流式响应 choice。 */
interface DeepSeekStreamChoice {
  delta: DeepSeekStreamDelta;
  finish_reason: string | null;
}

/** DeepSeek / OpenAI 流式响应行。 */
interface DeepSeekStreamLine {
  id?: string;
  choices?: DeepSeekStreamChoice[];
  usage?: LLMUsage;
  error?: { message: string; type?: string };
}

/**
 * 创建 DeepSeek Transport 实例。
 */
export function createDeepSeekTransport(options: DeepSeekTransportOptions): LLMTransport {
  const apiKey = options.apiKey;
  if (!apiKey || apiKey.length < 8) {
    throw new LLMError('LLM_SECRET_MISSING', undefined, { message: 'DeepSeek API Key 未提供或无效' });
  }

  const baseURL = (options.baseURL ?? DEEPSEEK_API_BASE_URL).replace(/\/$/, '');
  const model = options.model ?? DEEPSEEK_DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2048;
  const includeReasoning = options.includeReasoning ?? false;
  const fetchImpl = options.fetchImpl ?? fetch;

  function buildMessages(request: LLMRequest): DeepSeekMessage[] {
    const messages: DeepSeekMessage[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });
    return messages;
  }

  function buildBody(request: LLMRequest): DeepSeekRequestBody {
    return {
      model,
      messages: buildMessages(request),
      stream: request.stream,
      temperature,
      max_tokens: maxTokens,
    };
  }

  function buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
  }

  async function post(request: LLMRequest): Promise<Response> {
    const url = `${baseURL}/chat/completions`;
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(buildBody(request)),
    });
    return response;
  }

  return {
    name: 'deepseek',

    async complete(request: LLMRequest): Promise<LLMResponse> {
      const response = await post(request);

      if (!response.ok) {
        const bodyText = await response.text().catch(() => 'unknown');
        throw new LLMError(
          'LLM_PROVIDER_ERROR',
          request.requestId,
          { message: `DeepSeek API 错误 ${response.status}: ${bodyText.slice(0, 200)}` },
        );
      }

      const body = (await response.json()) as DeepSeekCompletionResponse;
      if (body.error) {
        throw new LLMError(
          'LLM_PROVIDER_ERROR',
          request.requestId,
          { message: body.error.message },
        );
      }

      const choice = body.choices?.[0];
      if (!choice) {
        throw new LLMError('LLM_EMPTY_RESPONSE', request.requestId, { message: 'DeepSeek 返回空 choices' });
      }

      return {
        requestId: request.requestId,
        text: choice.message.content ?? '',
        usage: body.usage,
      };
    },

    async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
      const response = await post(request);

      if (!response.ok) {
        const bodyText = await response.text().catch(() => 'unknown');
        yield createLLMRequestFailedEvent(
          request.requestId,
          'LLM_PROVIDER_ERROR',
          `DeepSeek API 错误 ${response.status}: ${bodyText.slice(0, 200)}`,
        );
        return;
      }

      yield createLLMRequestStartedEvent(request.requestId, 'deepseek');

      const reader = response.body?.getReader();
      if (!reader) {
        yield createLLMRequestFailedEvent(
          request.requestId,
          'LLM_STREAM_PARSE_ERROR',
          '响应没有可读取的 body',
        );
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (!trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6).trim();
            if (data === '[DONE]') {
              yield createLLMRequestCompletedEvent(request.requestId);
              return;
            }

            let parsed: DeepSeekStreamLine;
            try {
              parsed = JSON.parse(data) as DeepSeekStreamLine;
            } catch {
              yield createLLMRequestFailedEvent(
                request.requestId,
                'LLM_STREAM_PARSE_ERROR',
                `无法解析 SSE 数据: ${data.slice(0, 120)}`,
              );
              return;
            }

            if (parsed.error) {
              yield createLLMRequestFailedEvent(
                request.requestId,
                'LLM_PROVIDER_ERROR',
                parsed.error.message,
              );
              return;
            }

            const choice = parsed.choices?.[0];
            if (!choice) continue;

            const content = choice.delta?.content ?? '';
            const reasoning = includeReasoning ? (choice.delta?.reasoning_content ?? '') : '';

            if (content) {
              yield createLLMTokenDeltaEvent(request.requestId, content);
            }
            if (reasoning) {
              yield createLLMReasoningDeltaEvent(request.requestId, reasoning);
            }

            if (choice.finish_reason) {
              yield createLLMRequestCompletedEvent(request.requestId, { usage: parsed.usage });
              return;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 流正常结束但未收到 [DONE] 或 finish_reason，兜底发送 completed
      yield createLLMRequestCompletedEvent(request.requestId);
    },
  };
}
