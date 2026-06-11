import { describe, it, expect } from 'vitest';
import type { NovelView } from '../types/novel-view';
import type { ProviderError, ProviderErrorCode } from '../types/provider-error';

describe('NovelView 类型', () => {
  it('应包含 5 个核心视图', () => {
    const views: NovelView[] = [
      'bookshelf',
      'create-project',
      'workspace',
      'editor',
      'guide'
    ];
    expect(views).toHaveLength(5);
  });
});

describe('ProviderError 类型', () => {
  it('应包含 6 种错误码', () => {
    const codes: ProviderErrorCode[] = [
      'NOT_FOUND',
      'INVALID_INPUT',
      'DENIED',
      'QUOTA',
      'CONFLICT',
      'UNAUTHORIZED'
    ];
    expect(codes).toHaveLength(6);
  });

  it('可构造完整的 ProviderError 对象', () => {
    const error: ProviderError = {
      code: 'NOT_FOUND',
      message: 'Chapter not found',
      details: { id: 'ch-001' }
    };
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Chapter not found');
    expect(error.details).toBeDefined();
  });

  it('details 为可选字段', () => {
    const error: ProviderError = {
      code: 'QUOTA',
      message: 'Rate limit exceeded'
    };
    expect(error.details).toBeUndefined();
  });
});
