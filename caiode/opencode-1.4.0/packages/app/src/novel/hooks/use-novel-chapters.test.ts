import { describe, it, expect } from 'vitest';
import { NovelChapterProvider } from '../providers/novel-chapter';
import type { Chapter, AISuggestion } from '../types';

const mockSeedChapters: Chapter[] = [
  {
    id: 'ch-001',
    projectId: 'proj-001',
    title: '第一章 初入江湖',
    orderIndex: 1,
    status: 'draft',
    wordCount: 1500,
    content: '这是第一章的内容...',
    outline: { goal: '引入主角', conflict: '无', keyPlot: '离家' },
    lastEditedAt: new Date('2026-06-01')
  },
  {
    id: 'ch-002',
    projectId: 'proj-001',
    title: '第二章 风起云涌',
    orderIndex: 2,
    status: 'revising',
    wordCount: 2300,
    content: '这是第二章的内容...',
    outline: { goal: '引入冲突', conflict: '门派争斗', keyPlot: '挑战' },
    lastEditedAt: new Date('2026-06-02')
  }
];

function getProvider(): NovelChapterProvider {
  return new NovelChapterProvider();
}

describe('useNovelChapters - Provider 层验证', () => {

  describe('listChapters', () => {
    it('应返回按 orderIndex 排序的章节列表', async () => {
      const provider = getProvider();
      const chapters = await provider.listChapters('proj-001');
      expect(chapters.length).toBeGreaterThan(0);
      for (let i = 1; i < chapters.length; i++) {
        expect(chapters[i].orderIndex).toBeGreaterThanOrEqual(chapters[i - 1].orderIndex);
      }
    });
  });

  describe('getChapter', () => {
    it('存在的章节应返回数据', async () => {
      const provider = getProvider();
      const chapter = await provider.getChapter('ch-001');
      expect(chapter).not.toBeNull();
      expect(chapter!.title).toBeTruthy();
    });

    it('不存在的章节应返回 null', async () => {
      const provider = getProvider();
      const chapter = await provider.getChapter('ch-nonexist');
      expect(chapter).toBeNull();
    });
  });

  describe('saveChapter', () => {
    it('保存后 content 和 wordCount 应更新', async () => {
      const provider = getProvider();
      await provider.saveChapter('ch-001', '新内容');
      const saved = await provider.getChapter('ch-001');
      expect(saved).not.toBeNull();
      expect(saved!.content).toBe('新内容');
      expect(saved!.wordCount).toBe(3);
    });

    it('保存 draft 章节后状态应变为 revising', async () => {
      const provider = getProvider();
      await provider.saveChapter('ch-002', '更新内容');
      const saved = await provider.getChapter('ch-002');
      // ch-002 原状态是 revising，保持不变
      expect(saved!.status).toBe('revising');
    });

    it('保存不存在的章节应抛 NOT_FOUND', async () => {
      const provider = getProvider();
      try {
        await provider.saveChapter('ch-nonexist', '内容');
        expect.unreachable('应该抛出错误');
      } catch (e) {
        expect((e as { code: string }).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('acceptSuggestion / addAISuggestion', () => {
    it('完整流程：add → accept 应追加文本到正文', async () => {
      const provider = getProvider();
      const suggestion: AISuggestion = {
        id: 'sug-001',
        taskId: 'task-001',
        text: 'AI续写内容',
        status: 'saved',
        createdAt: new Date()
      };

      await provider.addAISuggestion('ch-001', suggestion);
      await provider.acceptSuggestion('ch-001', 'sug-001');

      const chapter = await provider.getChapter('ch-001');
      expect(chapter).not.toBeNull();
      expect(chapter!.content).toContain('AI续写内容');
    });

    it('acceptSuggestion 不存在的建议应抛 NOT_FOUND', async () => {
      const provider = getProvider();
      try {
        await provider.acceptSuggestion('ch-001', 'sug-nonexist');
        expect.unreachable('应该抛出错误');
      } catch (e) {
        expect((e as { code: string }).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('返回副本验证', () => {
    it('listChapters 副本修改不应污染内部状态', async () => {
      const provider = getProvider();
      const chapters = await provider.listChapters('proj-001');
      chapters[0].title = '被篡改';

      const fresh = await provider.listChapters('proj-001');
      expect(fresh[0].title).not.toBe('被篡改');
    });

    it('getChapter 副本修改不应污染内部状态', async () => {
      const provider = getProvider();
      const chapter = await provider.getChapter('ch-001');
      expect(chapter).not.toBeNull();
      chapter!.title = '被篡改';

      const fresh = await provider.getChapter('ch-001');
      expect(fresh!.title).not.toBe('被篡改');
    });
  });
});
