/**
 * @file llm/model-router.test.ts
 * @description ModelRouter 单元测试 — P3-D
 */

import { describe, it, expect } from 'vitest';
import { createModelRouter } from './model-router';
import { createModelProfileRegistry } from './model-profile-registry';
import { createChapterGenerateCommand, createAIWritingCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';

const flashProfile = {
  id: 'deepseek-flash',
  name: 'Flash',
  adapter: 'real-llm' as const,
  provider: 'deepseek' as const,
  modelId: 'deepseek-v4-flash',
  maxTokens: 2048,
  temperature: 0.7,
  costPer1KPromptTokens: 0.05,
  costPer1KCompletionTokens: 0.1,
};

const chatProfile = {
  id: 'deepseek-chat',
  name: 'Chat',
  adapter: 'real-llm' as const,
  provider: 'deepseek' as const,
  modelId: 'deepseek-chat',
  maxTokens: 4096,
  temperature: 0.7,
  costPer1KPromptTokens: 0.1,
  costPer1KCompletionTokens: 0.2,
};

const mockProfile = {
  id: 'mock-default',
  name: 'Mock',
  adapter: 'mock' as const,
  provider: 'disabled' as const,
  modelId: 'mock',
  maxTokens: 0,
  temperature: 0,
  costPer1KPromptTokens: 0,
  costPer1KCompletionTokens: 0,
};

function makeContext(overrides?: Partial<AdapterContext>): AdapterContext {
  return {
    projectId: 'proj-001',
    chapterId: 'ch-001',
    genre: '玄幻',
    ...overrides,
  };
}

describe('createModelRouter', () => {
  it('should resolve explicit modelProfileId first', () => {
    const registry = createModelProfileRegistry([flashProfile, chatProfile]);
    const router = createModelRouter(registry);
    const command = createChapterGenerateCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      text: '测试',
    });
    const profile = router.resolveProfile(command, makeContext({ modelProfileId: 'deepseek-chat' }));
    expect(profile.id).toBe('deepseek-chat');
  });

  it('should ignore invalid explicit modelProfileId and fall back to role default', () => {
    const registry = createModelProfileRegistry([flashProfile, chatProfile]);
    const router = createModelRouter(registry);
    const command = createAIWritingCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'polish',
      text: '测试',
    });
    const profile = router.resolveProfile(command, makeContext({ modelProfileId: 'unknown' }));
    expect(profile.id).toBe('deepseek-chat');
  });

  it('should resolve by context modelRole', () => {
    const registry = createModelProfileRegistry([flashProfile, chatProfile]);
    const router = createModelRouter(registry);
    const command = createChapterGenerateCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      text: '测试',
    });
    const profile = router.resolveProfile(command, makeContext({ modelRole: 'rewrite' }));
    expect(profile.id).toBe('deepseek-chat');
  });

  it('should infer role from command type', () => {
    const registry = createModelProfileRegistry([flashProfile, chatProfile]);
    const router = createModelRouter(registry);
    const summarizeCmd = createAIWritingCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'summarize',
      text: '测试',
    });
    expect(router.resolveProfile(summarizeCmd, makeContext()).id).toBe('deepseek-flash');

    const polishCmd = createAIWritingCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'polish',
      text: '测试',
    });
    expect(router.resolveProfile(polishCmd, makeContext()).id).toBe('deepseek-chat');
  });

  it('should fall back to first profile when role default missing', () => {
    const registry = createModelProfileRegistry([chatProfile, mockProfile]);
    const router = createModelRouter(registry);
    const command = createChapterGenerateCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      text: '测试',
    });
    const profile = router.resolveProfile(command, makeContext());
    expect(profile.id).toBe('deepseek-chat');
  });
});