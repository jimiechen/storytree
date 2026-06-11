import type { Project } from '../types';
import type { INovelProjectProvider } from './index';
import { mockProjects } from '../mock-data';
import { mockDelay } from '../utils/mock-delay';

export interface CreateProjectInput {
  name: string;
  genre: string;
  description?: string;
  targetAudience?: string;
  writingStyle?: string;
  storyTheme?: string;
}

export interface INovelProjectProviderExtended extends INovelProjectProvider {
  createProject(input: CreateProjectInput): Promise<Project>;
  listChapters(projectId: string): Promise<any[]>;
  getChapter(chapterId: string): Promise<any | null>;
}

class NovelProjectProviderImpl implements INovelProjectProviderExtended {
  private projects: Project[] = [...mockProjects];

  async listProjects(): Promise<Project[]> {
    await mockDelay(100);
    return [...this.projects];
  }

  async getProject(id: string): Promise<Project | null> {
    await mockDelay(150);
    const project = this.projects.find(p => p.id === id);
    return project ? { ...project } : null;
  }

  async getActiveProject(): Promise<Project | null> {
    await mockDelay(100);
    const active = this.projects.find(p => p.status === 'active');
    return active ? { ...active } : null;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    await mockDelay(300);
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: input.name,
      genre: input.genre,
      description: input.description || '',
      totalWordCount: 0,
      chapterCount: 0,
      characterCount: 0,
      lastUpdated: new Date(),
      status: 'active'
    };
    this.projects.push(newProject);
    return { ...newProject };
  }

  async listChapters(_projectId: string): Promise<any[]> {
    await mockDelay(100);
    // STDD 骨架：返回空数组，后续接入 ChapterProvider
    return [];
  }

  async getChapter(_chapterId: string): Promise<any | null> {
    await mockDelay(100);
    // STDD 骨架：返回 null，后续接入 ChapterProvider
    return null;
  }
}

let providerInstance: NovelProjectProviderImpl | null = null;

export function createNovelProjectProvider(): INovelProjectProviderExtended {
  if (!providerInstance) {
    providerInstance = new NovelProjectProviderImpl();
  }
  return providerInstance;
}

// 保持向后兼容的默认导出
export const novelProjectProvider = new NovelProjectProviderImpl();
