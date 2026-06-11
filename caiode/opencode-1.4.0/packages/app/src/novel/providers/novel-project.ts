import type { Project, CreateProjectInput } from '../types';
import type { INovelProjectProvider } from './index';
import type { ProviderError } from '../types/provider-error';
import { mockProjects } from '../mock-data';
import { mockDelay } from '../utils/mock-delay';

export class NovelProjectProvider implements INovelProjectProvider {
  private projects = new Map<string, Project>(
    mockProjects.map(p => [p.id, { ...p }])
  );

  async listProjects(): Promise<Project[]> {
    await mockDelay(100);
    return Array.from(this.projects.values())
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      .map(p => ({ ...p }));
  }

  async getProject(id: string): Promise<Project | null> {
    await mockDelay(150);
    const project = this.projects.get(id);
    return project ? { ...project } : null;
  }

  async getActiveProject(): Promise<Project | null> {
    await mockDelay(100);
    const active = Array.from(this.projects.values()).find(p => p.status === 'active');
    return active ? { ...active } : null;
  }

  async searchProjects(keyword: string): Promise<Project[]> {
    await mockDelay(80);
    if (!keyword.trim()) {
      return this.listProjects();
    }
    const kw = keyword.toLowerCase();
    return Array.from(this.projects.values())
      .filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.genre.toLowerCase().includes(kw)
      )
      .map(p => ({ ...p }));
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    await mockDelay(200);

    // 校验必填字段
    if (!input.name || !input.name.trim()) {
      const e: ProviderError = { code: 'INVALID_INPUT', message: '项目名称不能为空' };
      throw e;
    }
    if (!input.genre) {
      const e: ProviderError = { code: 'INVALID_INPUT', message: '项目类型不能为空' };
      throw e;
    }

    const id = `proj-${Date.now()}`;
    const now = new Date();
    const project: Project = {
      id,
      name: input.name.trim(),
      genre: input.genre,
      description: input.description?.trim() || '',
      totalWordCount: 0,
      chapterCount: 0,
      characterCount: input.protagonist ? 1 : 0,
      lastUpdated: now,
      status: 'draft',
    };

    this.projects.set(id, project);
    return { ...project };
  }
}
