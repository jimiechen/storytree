/**
 * @file use-llm-generation.ts
 * @description 轻量级 LLM 文本生成 Hook — 用于创建项目弹窗的世界观/剧情生成
 *
 * 直接调用 DeepSeek API（OpenAI 兼容协议），不经过 Workflow Engine。
 * 适用于一次性文本生成场景（世界观、剧情大纲等）。
 */

import { createSignal } from 'solid-js';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

export interface LLMGenerationParams {
  prompt: string;
  context?: string;
  systemPrompt?: string;
}

export interface UseLLMGenerationReturn {
  isLoading: () => boolean;
  result: () => string;
  error: () => string | null;
  generate: (params: LLMGenerationParams) => Promise<string>;
  clear: () => void;
}

export function useLLMGeneration(): UseLLMGenerationReturn {
  const [isLoading, setIsLoading] = createSignal(false);
  const [result, setResult] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);

  const getApiKey = (): string | null => {
    const key = (import.meta as any).env?.VITE_DEEPSEEK_API_KEY;
    return key && key.length >= 8 ? key : null;
  };

  const generate = async (params: LLMGenerationParams): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      const msg = '未配置 DeepSeek API Key，无法生成内容。请在 .env.local 中设置 VITE_DEEPSEEK_API_KEY。';
      setError(msg);
      return '';
    }

    setIsLoading(true);
    setError(null);

    const systemContent = params.systemPrompt || '你是一个专业的小说创作助手，擅长生成世界观设定和剧情大纲。';
    const userContent = params.context
      ? `参考信息：${params.context}\n\n请求：${params.prompt}`
      : params.prompt;

    try {
      const resp = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: userContent },
          ],
          max_tokens: 2000,
          temperature: 0.8,
          stream: false,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
      }

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '';
      setResult(text);
      return text;
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setResult('');
    setError(null);
  };

  return { isLoading, result, error, generate, clear };
}
