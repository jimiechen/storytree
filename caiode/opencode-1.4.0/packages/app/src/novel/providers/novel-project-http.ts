/**
 * @file novel-project-http.ts
 * @description HTTP Provider — 调用 opencode server 的 /novel/project REST API
 *
 * 当 realNovelBackendEnabled FeatureGate 开启时，useNovelProject 使用此 Provider。
 * 否则回退到 NovelProjectProvider（内存 mock）。
 */

import type { Project, CreateProjectInput } from '../types';
import type { INovelProjectProvider } from './index';
import type { ProviderError } from '../types/provider-error';

/** 后端 API 返回的项目结构（snake_case → camelCase 由 adapt 转换） */
interface RemoteProject {
  id: string;
  name: string;
  genre: string;
  description: string;
  totalWordCount: number;
  chapterCount: number;
  characterCount: number;
  lastUpdated: number; // Unix ms
  status: 'active' | 'archived' | 'draft';
}

export interface NovelProjectHttpConfig {
  /** opencode server baseURL，如 http://localhost:4096 */
  baseURL: string;
  /** 当前 workspace 目录（作为 directory query 参数） */
  directory: string;
  /** 可选 basicAuth 凭证 */
  auth?: { user: string; pass: string };
}

export class NovelProjectHttpProvider implements INovelProjectProvider {
  private baseHeaders: Record<string, string>;

  constructor(private config: NovelProjectHttpConfig) {
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

  private adapt(p: RemoteProject): Project {
    return {
      id: p.id,
      name: p.name,
      genre: p.genre,
      description: p.description,
      totalWordCount: p.totalWordCount,
      chapterCount: p.chapterCount,
      characterCount: p.characterCount,
      lastUpdated: new Date(p.lastUpdated),
      status: p.status,
    };
  }

  async listProjects(): Promise<Project[]> {
    const res = await fetch(this.url('/novel/project'), { headers: this.baseHeaders });
    const data = await this.handle<RemoteProject[]>(res);
    return data.map(p => this.adapt(p));
  }

  async getProject(id: string): Promise<Project | null> {
    const res = await fetch(this.url(`/novel/project/${id}`), { headers: this.baseHeaders });
    if (res.status === 404) return null;
    return this.adapt(await this.handle<RemoteProject>(res));
  }

  async getActiveProject(): Promise<Project | null> {
    const all = await this.listProjects();
    return all.find(p => p.status === 'active') ?? null;
  }

  async searchProjects(keyword: string): Promise<Project[]> {
    const res = await fetch(
      this.url(`/novel/project/search?q=${encodeURIComponent(keyword)}`),
      { headers: this.baseHeaders },
    );
    const data = await this.handle<RemoteProject[]>(res);
    return data.map(p => this.adapt(p));
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const res = await fetch(this.url('/novel/project'), {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify(input),
    });
    return this.adapt(await this.handle<RemoteProject>(res));
  }

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${id}`), {
      method: 'DELETE',
      headers: this.baseHeaders,
    });
    await this.handle<void>(res);
  }

  async restoreProject(id: string): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${id}/restore`), {
      method: 'POST',
      headers: this.baseHeaders,
    });
    await this.handle<void>(res);
  }

  async listDeletedProjects(): Promise<Project[]> {
    const res = await fetch(this.url('/novel/project/trash'), { headers: this.baseHeaders });
    const data = await this.handle<RemoteProject[]>(res);
    return data.map(p => this.adapt(p));
  }
}
