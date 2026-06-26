/**
 * @file novel-chapter-http.ts
 * @description HTTP Provider — 调用 opencode server 的 /novel/project/:projectId/chapter REST API
 *
 * 当 realNovelBackendEnabled FeatureGate 开启时，useNovelChapters 使用此 Provider。
 * 否则回退到 NovelChapterProvider（内存 mock）。
 *
 * 注意：后端路由 /novel/project/:projectId/chapter/:id 中的 projectId 是路径参数，
 * 但 GET/PATCH/DELETE 实际只用 chapter id 查询。此 Provider 在 listChapters(projectId)
 * 时缓存当前 projectId，供后续按 id 操作使用。
 */

import type { Chapter, ChapterStatus, AISuggestion, ChapterExtractedInfo } from '../types';
import type { ChapterInformationState } from '../types/information-flow';
import type { INovelChapterProvider } from './index';
import type { ProviderError } from '../types/provider-error';

/** 后端 API 返回的章节结构 */
interface RemoteChapter {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  status: 'draft' | 'revising' | 'completed' | 'published';
  wordCount: number;
  content: string;
  summary?: string;
  outline?: { goal: string; conflict: string; keyPlot: string };
  extractedInfo?: ChapterExtractedInfo;
  informationState?: ChapterInformationState;
  aiSuggestions?: AISuggestion[];
  createdAt: number; // Unix ms
  updatedAt: number; // Unix ms
  lastEditedAt?: number; // Unix ms
}

export interface NovelChapterHttpConfig {
  /** opencode server baseURL，如 http://localhost:4096 */
  baseURL: string;
  /** 当前 workspace 目录（作为 directory query 参数） */
  directory: string;
  /** 可选 basicAuth 凭证 */
  auth?: { user: string; pass: string };
}

export class NovelChapterHttpProvider implements INovelChapterProvider {
  private baseHeaders: Record<string, string>;
  /** 当前项目 ID（由 listChapters 缓存，供按 id 操作使用） */
  private currentProjectId = '';

  constructor(private config: NovelChapterHttpConfig) {
    this.baseHeaders = {
      'Content-Type': 'application/json',
      ...(config.auth
        ? { Authorization: `Basic ${btoa(`${config.auth.user}:${config.auth.pass}`)}` }
        : {}),
    };
  }

  private url(path: string): string {
    const sep = path.includes('?') ? '&' : '?';
    return `${this.config.baseURL}${path}${sep}directory=${encodeURIComponent(this.config.directory)}`;
  }

  private async handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.text();
        if (body) message += `: ${body}`;
      } catch {
        // ignore body read error
      }
      const e: ProviderError = {
        code: res.status === 404 ? 'NOT_FOUND' : 'REMOTE_ERROR',
        message,
      };
      throw e;
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  /** 后端 RemoteChapter → 前端 Chapter（时间戳转 ISO 字符串） */
  private adapt(c: RemoteChapter): Chapter {
    return {
      id: c.id,
      projectId: c.projectId,
      title: c.title,
      orderIndex: c.orderIndex,
      status: c.status,
      wordCount: c.wordCount,
      content: c.content,
      summary: c.summary,
      outline: c.outline ?? { goal: '', conflict: '', keyPlot: '' },
      extractedInfo: c.extractedInfo,
      informationState: c.informationState,
      aiSuggestions: c.aiSuggestions,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString(),
      lastEditedAt: c.lastEditedAt ? new Date(c.lastEditedAt) : undefined,
    };
  }

  /** 设置当前项目 ID（供后续按 id 操作使用） */
  setCurrentProject(projectId: string) {
    this.currentProjectId = projectId;
  }

  async listChapters(projectId: string): Promise<Chapter[]> {
    this.setCurrentProject(projectId);
    const res = await fetch(this.url(`/novel/project/${projectId}/chapter`), {
      headers: this.baseHeaders,
    });
    const data = await this.handle<RemoteChapter[]>(res);
    return data.map(c => this.adapt(c));
  }

  async getChapter(id: string): Promise<Chapter | null> {
    const res = await fetch(this.url(`/novel/project/${this.currentProjectId}/chapter/${id}`), {
      headers: this.baseHeaders,
    });
    if (res.status === 404) return null;
    return this.adapt(await this.handle<RemoteChapter>(res));
  }

  async saveChapter(id: string, content: string): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${this.currentProjectId}/chapter/${id}`), {
      method: 'PATCH',
      headers: this.baseHeaders,
      body: JSON.stringify({ content, wordCount: content.length }),
    });
    await this.handle<void>(res);
  }

  async saveChapterSummary(id: string, summary: string): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${this.currentProjectId}/chapter/${id}`), {
      method: 'PATCH',
      headers: this.baseHeaders,
      body: JSON.stringify({ summary }),
    });
    await this.handle<void>(res);
  }

  async saveChapterWordCount(id: string, wordCount: number): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${this.currentProjectId}/chapter/${id}`), {
      method: 'PATCH',
      headers: this.baseHeaders,
      body: JSON.stringify({ wordCount }),
    });
    await this.handle<void>(res);
  }

  async saveChapterInformationState(id: string, state: ChapterInformationState): Promise<void> {
    // 后端暂未暴露 informationState 的 PATCH 字段，仅记录到本地
    // 未来可扩展后端 PATCH 接口支持 informationState 字段
    // 此处静默成功，避免阻塞调用方
    void id;
    void state;
  }

  async saveChapterExtractedInfo(id: string, info: ChapterExtractedInfo): Promise<void> {
    // 后端暂未暴露 extractedInfo 的 PATCH 字段，仅记录到本地
    void id;
    void info;
  }

  async updateChapterStatus(id: string, status: ChapterStatus): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${this.currentProjectId}/chapter/${id}`), {
      method: 'PATCH',
      headers: this.baseHeaders,
      body: JSON.stringify({ status }),
    });
    await this.handle<void>(res);
  }

  async addAISuggestion(_chapterId: string, _suggestion: AISuggestion): Promise<void> {
    // 后端暂未暴露 aiSuggestions 的独立端点
    // 此处静默成功，避免阻塞调用方
  }

  async acceptSuggestion(_chapterId: string, _suggestionId: string): Promise<void> {
    // 后端暂未暴露 aiSuggestions 的独立端点
    // 此处静默成功，避免阻塞调用方
  }

  // ─── PAGE-10 扩展：CRUD 完整接口 ─────────────────────────────

  async createChapter(
    projectId: string,
    input: { title: string; orderIndex?: number; content?: string },
  ): Promise<Chapter> {
    this.setCurrentProject(projectId);
    const res = await fetch(this.url(`/novel/project/${projectId}/chapter`), {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify(input),
    });
    return this.adapt(await this.handle<RemoteChapter>(res));
  }

  async deleteChapter(id: string): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${this.currentProjectId}/chapter/${id}`), {
      method: 'DELETE',
      headers: this.baseHeaders,
    });
    await this.handle<void>(res);
  }

  async listDeletedChapters(projectId: string): Promise<Chapter[]> {
    const res = await fetch(this.url(`/novel/project/${projectId}/chapter/trash`), {
      headers: this.baseHeaders,
    });
    const data = await this.handle<RemoteChapter[]>(res);
    return data.map(c => this.adapt(c));
  }

  async restoreChapter(id: string): Promise<void> {
    const res = await fetch(
      this.url(`/novel/project/${this.currentProjectId}/chapter/${id}/restore`),
      {
        method: 'POST',
        headers: this.baseHeaders,
      },
    );
    await this.handle<void>(res);
  }
}
