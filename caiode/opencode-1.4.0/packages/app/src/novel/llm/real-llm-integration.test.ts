/**
 * @file llm/real-llm-integration.test.ts
 * @description 真实 DeepSeek API 集成测试 — P3-C
 *
 * 本测试需要外部注入环境变量（支持 env 文件常用命名）：
 * - DEEPSEEK_API_KEY（或 apikey）
 * - DEEPSEEK_BASE_URL（或 base_url_OpenAI，默认 https://api.deepseek.com）
 * - DEEPSEEK_MODEL（或 model，默认 deepseek-chat）
 *
 * 运行方式（从仓库根目录）：
 *   bun --env-file=docs/task-reports/2026-06-21/novel-deepseek-key.env test src/novel/llm/real-llm-integration.test.ts
 *
 * 安全约束：
 * - 本文件不硬编码任何 API Key。
 * - 真实调用只应在受控环境执行。
 */

import { describe, it, expect } from 'vitest';
import { RealLLMExecutionAdapter } from '../adapters/real-llm-adapter';
import { createTargetLLMClient } from './target-llm-client';
import { createDeepSeekTransport } from './deepseek-transport';
import { createChapterGenerateCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';

const INTEGRATION_TIMEOUT_MS = 30_000;

function getDeepSeekEnv(): { apiKey: string; baseURL: string | undefined; model: string } {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.apikey || '';
  const baseURL = process.env.DEEPSEEK_BASE_URL || process.env.base_url_OpenAI;
  const model = process.env.DEEPSEEK_MODEL || process.env.model;
  return { apiKey, baseURL, model };
}

function skipIfNoKey(): boolean {
  const { apiKey } = getDeepSeekEnv();
  return !apiKey || apiKey.length < 8;
}

function makeContext(): AdapterContext {
  return {
    projectId: 'proj-test',
    chapterId: 'ch-test',
    genre: '玄幻',
    targetWordCount: 200,
  };
}

describe('Real LLM Integration (DeepSeek)', () => {
  it.skipIf(skipIfNoKey())(
    '非流式 chapter.generate 返回有效正文与校验信息',
    async () => {
      const { apiKey, baseURL, model } = getDeepSeekEnv();
      const transport = createDeepSeekTransport({
        apiKey,
        baseURL,
        model: model ?? 'deepseek-chat',
        maxTokens: 500,
      });

      const adapter = new RealLLMExecutionAdapter({
        client: createTargetLLMClient({ transport }),
        gates: {
          realLLMEnabled: true,
          targetLLMAdapterEnabled: true,
          llmStreamingEnabled: false,
          llmRequestLogEnabled: false,
          llmCostTrackingEnabled: false,
          llmSafePromptLoggingEnabled: false,
        },
      });

      const command = createChapterGenerateCommand({
        projectId: 'proj-test',
        chapterId: 'ch-test',
        chapterIndex: 1,
        genre: '玄幻',
        text: '青云山下，少年李玄第一次握住剑柄。',
        targetWordCount: 200,
      });

      const result = await adapter.execute(command, makeContext());

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.text.length).toBeGreaterThan(0);
      expect(result.result!.wordCount).toBeGreaterThan(0);
      expect(result.result!.validationIssues).toBeDefined();
      // 真实响应不应暴露密钥或完整 prompt
      expect(result.result!.text).not.toContain(apiKey);
    },
    INTEGRATION_TIMEOUT_MS,
  );

  it.skipIf(skipIfNoKey())(
    '流式 chapter.generate 返回事件序列',
    async () => {
      const { apiKey, baseURL, model } = getDeepSeekEnv();
      const transport = createDeepSeekTransport({
        apiKey,
        baseURL,
        model: model ?? 'deepseek-chat',
        maxTokens: 300,
      });

      const adapter = new RealLLMExecutionAdapter({
        client: createTargetLLMClient({ transport }),
        gates: {
          realLLMEnabled: true,
          targetLLMAdapterEnabled: true,
          llmStreamingEnabled: true,
          llmRequestLogEnabled: false,
          llmCostTrackingEnabled: false,
          llmSafePromptLoggingEnabled: false,
        },
      });

      const command = createChapterGenerateCommand({
        projectId: 'proj-test',
        chapterId: 'ch-test',
        chapterIndex: 1,
        genre: '玄幻',
        text: '青云山下，少年李玄第一次握住剑柄。',
        targetWordCount: 200,
      });

      const events: Array<{ type: string }> = [];
      for await (const event of adapter.executeStream(command, makeContext())) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('llm.request.started');
      expect(events.at(-1)!.type).toBe('llm.request.completed');
    },
    INTEGRATION_TIMEOUT_MS,
  );
});
