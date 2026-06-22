/**
 * @file llm/model-profile-registry.test.ts
 * @description ModelProfileRegistry 单元测试 — P3-D
 */

import { describe, it, expect } from 'vitest';
import { createModelProfileRegistry, createDefaultModelProfileRegistry } from './model-profile-registry';
import { DEFAULT_MODEL_PROFILES } from './model-profile';

const mockProfile = {
  id: 'test-profile',
  name: 'Test Profile',
  adapter: 'mock' as const,
  provider: 'disabled' as const,
  modelId: 'test-model',
  maxTokens: 1024,
  temperature: 0.5,
  costPer1KPromptTokens: 0.01,
  costPer1KCompletionTokens: 0.02,
};

describe('createModelProfileRegistry', () => {
  it('should initialize empty by default', () => {
    const registry = createModelProfileRegistry();
    expect(registry.list()).toEqual([]);
  });

  it('should initialize with provided profiles', () => {
    const registry = createModelProfileRegistry([mockProfile]);
    expect(registry.list()).toHaveLength(1);
    expect(registry.get('test-profile')).toEqual(mockProfile);
  });

  it('should register a new profile', () => {
    const registry = createModelProfileRegistry();
    registry.register(mockProfile);
    expect(registry.get('test-profile')).toEqual(mockProfile);
  });

  it('should override existing profile on register', () => {
    const registry = createModelProfileRegistry([mockProfile]);
    const updated = { ...mockProfile, name: 'Updated' };
    registry.register(updated);
    expect(registry.get('test-profile')?.name).toBe('Updated');
  });

  it('should unregister a profile', () => {
    const registry = createModelProfileRegistry([mockProfile]);
    registry.unregister('test-profile');
    expect(registry.get('test-profile')).toBeUndefined();
    expect(registry.list()).toHaveLength(0);
  });

  it('should return a copy of profile list', () => {
    const registry = createModelProfileRegistry([mockProfile]);
    const list = registry.list();
    list.push({ ...mockProfile, id: 'mutated' });
    expect(registry.list()).toHaveLength(1);
  });
});

describe('createDefaultModelProfileRegistry', () => {
  it('should include default profiles', () => {
    const registry = createDefaultModelProfileRegistry();
    const ids = registry.list().map((p) => p.id);
    expect(ids).toEqual(DEFAULT_MODEL_PROFILES.map((p) => p.id));
  });
});
