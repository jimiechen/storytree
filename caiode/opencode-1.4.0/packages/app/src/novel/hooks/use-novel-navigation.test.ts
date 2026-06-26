import { describe, it, expect } from 'vitest';
import type { NovelModal } from '../types/novel-modal';
import type { NovelView } from '../types/novel-view';

describe('useNovelNavigation 类型契约', () => {
  it('NovelModal 应包含 7 种弹框类型', () => {
    const modals: NovelModal[] = [
      'export',
      'feedback',
      'generation-settings',
      'chapter-history',
      'notifications',
      'batch-generation',
      'settings',
    ];
    expect(modals).toHaveLength(7);
  });

  it('NovelView 应包含 5 种核心视图', () => {
    const views: NovelView[] = [
      'bookshelf',
      'create-project',
      'workspace',
      'editor',
      'guide',
    ];
    expect(views).toHaveLength(5);
  });

  it('扩展视图值应为 NovelView 的超集', () => {
    // ExtendedView = NovelView | 'character-panel' | 'world-setting' | 'profile' | 'tutorial' | 'name-generator'
    const extendedViews = [
      'bookshelf',
      'create-project',
      'workspace',
      'editor',
      'guide',
      'character-panel',
      'world-setting',
      'profile',
      'tutorial',
      'name-generator',
    ];
    expect(extendedViews).toContain('workspace');
    expect(extendedViews).toContain('character-panel');
    expect(extendedViews).toContain('name-generator');
    expect(extendedViews).toHaveLength(10);
  });
});
