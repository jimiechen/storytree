import { create } from 'zustand';
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

interface CreateProjectData {
  title: string;
  description: string;
  status: 'active' | 'draft' | 'completed';
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (projectData: CreateProjectData) => Promise<void>;
  setCurrentProject: (project: Project) => void;
  clearError: () => void;
}

export const projectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get<Project[]>('/api/projects');
      set({
        projects: Array.isArray(response) ? response : [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        projects: [],
        isLoading: false,
        error: 'Failed to fetch projects',
      });
    }
  },

  createProject: async (projectData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post<Project>('/api/projects', projectData);
      set((state) => ({
        projects: [...state.projects, response],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to create project',
      });
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  clearError: () => {
    set({ error: null });
  },
}));
