import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectStore } from '@/stores/project-store';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from '@/lib/api';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'draft' | 'completed';
  chapterCount: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

describe('Project Store', () => {
  beforeEach(() => {
    // 清除所有状态
    projectStore.setState({ 
      projects: [], 
      currentProject: null, 
      isLoading: false, 
      error: null 
    });
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = projectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set projects list', async () => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: '测试项目 1',
        description: '这是测试项目 1',
        status: 'active',
        chapterCount: 5,
        wordCount: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '测试项目 2',
        description: '这是测试项目 2',
        status: 'draft',
        chapterCount: 3,
        wordCount: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    (api.get as vi.Mock).mockResolvedValue(mockProjects);

    await projectStore.getState().fetchProjects();

    const state = projectStore.getState();
    expect(state.projects).toHaveLength(2);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle fetch projects failure', async () => {
    (api.get as vi.Mock).mockRejectedValue(new Error('API error'));

    await projectStore.getState().fetchProjects();

    const state = projectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed to fetch projects');
  });

  it('should set current project', () => {
    const mockProject: Project = {
      id: '1',
      title: '测试项目',
      description: '这是测试项目',
      status: 'active',
      chapterCount: 5,
      wordCount: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projectStore.getState().setCurrentProject(mockProject);

    const state = projectStore.getState();
    expect(state.currentProject).toEqual(mockProject);
  });

  it('should create new project', async () => {
    const newProjectData = {
      title: '新测试项目',
      description: '这是新测试项目',
      status: 'active' as const
    };

    const mockProject: Project = {
      id: '1',
      ...newProjectData,
      chapterCount: 0,
      wordCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    (api.post as vi.Mock).mockResolvedValue(mockProject);

    await projectStore.getState().createProject(newProjectData);

    const state = projectStore.getState();
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].title).toBe('新测试项目');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle create project failure', async () => {
    const newProjectData = {
      title: '新测试项目',
      description: '这是新测试项目',
      status: 'active' as const
    };

    (api.post as vi.Mock).mockRejectedValue(new Error('API error'));

    await projectStore.getState().createProject(newProjectData);

    const state = projectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed to create project');
  });

  it('should clear error', () => {
    // 先设置一个错误
    projectStore.setState({ error: 'Test error' });
    
    projectStore.getState().clearError();

    const state = projectStore.getState();
    expect(state.error).toBeNull();
  });
});
