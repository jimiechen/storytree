/**
 * @file target-llm-request-builder.test.ts
 * @description Target LLM Request Builder 单元测试 — P3-A
 */

import { describe, it, expect } from 'vitest';
import {
  isChapterContinueCommand,
  isRealLLMSupportedCommand,
  buildLLMRequest,
} from './target-llm-request-builder';
import { createChapterGenerateCommand, createAIWritingCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';

function makeContext(overrides?: Partial<AdapterContext>): AdapterContext {
  return {
    projectId: 'proj-001',
    chapterId: 'ch-001',
    genre: '玄幻',
    ...overrides,
  };
}

describe('TargetLLMRequestBuilder', () => {
  it('isChapterContinueCommand 正确识别 continue', () => {
    const continueCommand = createAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'continue',
      text: '他推开门',
    });
    expect(isChapterContinueCommand(continueCommand)).toBe(true);

    const rewriteCommand = createAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'rewrite',
      text: '他推开门',
    });
    expect(isChapterContinueCommand(rewriteCommand)).toBe(false);
  });

  it('isRealLLMSupportedCommand 支持 generate 与 continue', () => {
    const generate = createChapterGenerateCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      text: '测试',
    });
    expect(isRealLLMSupportedCommand(generate)).toBe(true);

    const continueCmd = createAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'continue',
      text: '测试',
    });
    expect(isRealLLMSupportedCommand(continueCmd)).toBe(true);

    const polishCmd = createAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'polish',
      text: '测试',
    });
    expect(isRealLLMSupportedCommand(polishCmd)).toBe(false);
  });

  it('buildLLMRequest 为 chapter.generate 构造请求', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      text: '测试正文',
    });
    const request = buildLLMRequest('req-001', command, makeContext());

    expect(request.requestId).toBe('req-001');
    expect(request.adapter).toBe('real-llm');
    expect(request.stream).toBe(false);
    expect(request.timeoutMs).toBe(30_000);
    expect(request.prompt).toContain('测试正文');
    expect(request.systemPrompt).toBeDefined();
    expect(request.metadata.projectId).toBe('proj-001');
  });

  it('buildLLMRequest 为 chapter.continue 构造请求', () => {
    const command = createAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'continue',
      text: '他推开门',
    });
    const request = buildLLMRequest('req-002', command, makeContext(), { stream: true });

    expect(request.requestId).toBe('req-002');
    expect(request.stream).toBe(true);
    expect(request.prompt).toContain('续写');
    expect(request.prompt).toContain('他推开门');
  });

  it('buildLLMRequest 不泄露密钥', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      text: '测试',
    });
    const request = buildLLMRequest('req-003', command, makeContext());

    expect(request.prompt).not.toContain('sk-');
    expect(request.systemPrompt).not.toContain('sk-');
    expect(request.metadata).not.toHaveProperty('apiKey');
  });
});
