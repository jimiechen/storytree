import { create } from 'zustand';
import { Project } from '../types/api';

interface ProjectStore {
  // 状态
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // 操作
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
  clearCurrentProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  // 初始状态
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  // 操作实现
  setProjects: (projects) => set({ projects }),
  
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  
  setCurrentProject: (currentProject) => set({ currentProject }),
  
  clearCurrentProject: () => set({ currentProject: null }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
}));
