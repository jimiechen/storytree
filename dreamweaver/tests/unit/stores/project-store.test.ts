import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../../../src/stores/project-store';

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

describe('Project Store', () => {
  beforeEach(() => {
    // 重置 store 状态
    const { setProjects, setCurrentProject, setLoading, setError } = useProjectStore.getState();
    setProjects([]);
    setCurrentProject(null);
    setLoading(false);
    setError(null);
  });

  it('should initialize with empty projects list and null current project', () => {
    const { projects, currentProject, loading, error } = useProjectStore.getState();
    expect(projects).toEqual([]);
    expect(currentProject).toBeNull();
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('should add project to projects list', () => {
    const { addProject, projects } = useProjectStore.getState();
    const testProject: Project = {
      id: '1',
      title: 'Test Project',
      description: 'Test Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProject(testProject);
    const updatedProjects = useProjectStore.getState().projects;
    expect(updatedProjects).toHaveLength(1);
    expect(updatedProjects[0]).toEqual(testProject);
  });

  it('should set current project', () => {
    const { setCurrentProject, currentProject } = useProjectStore.getState();
    const testProject: Project = {
      id: '1',
      title: 'Test Project',
      description: 'Test Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(testProject);
    const updatedCurrentProject = useProjectStore.getState().currentProject;
    expect(updatedCurrentProject).toEqual(testProject);
  });

  it('should clear current project', () => {
    const { setCurrentProject, clearCurrentProject } = useProjectStore.getState();
    const testProject: Project = {
      id: '1',
      title: 'Test Project',
      description: 'Test Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(testProject);
    expect(useProjectStore.getState().currentProject).toEqual(testProject);

    clearCurrentProject();
    expect(useProjectStore.getState().currentProject).toBeNull();
  });

  it('should set loading state', () => {
    const { setLoading } = useProjectStore.getState();
    setLoading(true);
    expect(useProjectStore.getState().loading).toBe(true);

    setLoading(false);
    expect(useProjectStore.getState().loading).toBe(false);
  });

  it('should set and clear error', () => {
    const { setError, clearError } = useProjectStore.getState();
    const errorMessage = 'Test error';

    setError(errorMessage);
    expect(useProjectStore.getState().error).toBe(errorMessage);

    clearError();
    expect(useProjectStore.getState().error).toBeNull();
  });

  it('should set projects list', () => {
    const { setProjects } = useProjectStore.getState();
    const testProjects: Project[] = [
      {
        id: '1',
        title: 'Project 1',
        description: 'Description 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Project 2',
        description: 'Description 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    setProjects(testProjects);
    const updatedProjects = useProjectStore.getState().projects;
    expect(updatedProjects).toEqual(testProjects);
    expect(updatedProjects).toHaveLength(2);
  });
});
