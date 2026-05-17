import type { Project } from '../types';
import type { INovelProjectProvider } from './index';
import { mockProject } from '../mock-data';
import { mockDelay } from '../utils/mock-delay';

export class NovelProjectProvider implements INovelProjectProvider {
  async listProjects(): Promise<Project[]> {
    await mockDelay(100);
    return [mockProject];
  }

  async getProject(id: string): Promise<Project | null> {
    await mockDelay(150);
    return mockProject.id === id ? { ...mockProject } : null;
  }

  async getActiveProject(): Promise<Project | null> {
    await mockDelay(100);
    return { ...mockProject };
  }
}
