import type { OutlineNode } from '../types';
import type { ChapterOutline } from '../types';
import type { INovelOutlineProvider } from './index';
import { mockOutlines, mockOutlineChapters } from '../mock-data';
import { mockChapters } from '../mock-data';
import { mockDelay } from '../utils/mock-delay';

/**
 * 大纲 Provider
 *
 * 职责：
 * - 管理大纲树数据（卷 > 章两级层级）
 * - 提供细纲查询（复用 ChapterOutline）
 * - Mock 模式下 generateOutline 返回预设数据
 */
export class NovelOutlineProvider implements INovelOutlineProvider {
  /** 内部大纲树存储（按 projectId 索引） */
  private outlineStore = new Map<string, OutlineNode[]>();

  constructor() {
    // 初始化：将 mockOutlines 存入 store
    this.deepCopyStore('proj-001', mockOutlines);
  }

  async listOutlines(projectId: string): Promise<OutlineNode[]> {
    await mockDelay(100);
    const stored = this.outlineStore.get(projectId);
    if (!stored) return [];
    return this.deepCopyNodes(stored);
  }

  async getDetailOutline(chapterId: string): Promise<ChapterOutline | null> {
    await mockDelay(80);
    const chapter = mockChapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    return { ...chapter.outline };
  }

  async generateOutline(projectId: string): Promise<OutlineNode[]> {
    await mockDelay(300);
    // Mock: 返回预设大纲数据（模拟 AI 生成）
    const existing = this.outlineStore.get(projectId);
    if (existing) {
      return this.deepCopyNodes(existing);
    }
    // 无数据时初始化默认大纲
    this.deepCopyStore(projectId, mockOutlines);
    return this.deepCopyNodes(mockOutlines);
  }

  /** 深拷贝大纲节点数组（防止外部修改污染内部状态） */
  private deepCopyNodes(nodes: OutlineNode[]): OutlineNode[] {
    return nodes.map(node => ({
      ...node,
      children: node.children ? this.deepCopyNodes(node.children) : undefined,
    }));
  }

  /** 深拷贝并存入 store */
  private deepCopyStore(projectId: string, nodes: OutlineNode[]): void {
    this.outlineStore.set(projectId, this.deepCopyNodes(nodes));
  }
}
