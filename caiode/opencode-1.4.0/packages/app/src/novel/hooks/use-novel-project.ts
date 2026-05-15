import { createSignal, createResource } from 'solid-js';
import type { Project } from '../types';
import { NovelProjectProvider } from '../providers/providers-index';

const projectProvider = new NovelProjectProvider();

export function useNovelProject() {
  const [projectId, setProjectId] = createSignal<string>('proj-001');
  
  const [project] = createResource(projectId, async (id) => {
    return projectProvider.getProject(id);
  });

  return {
    project,
    setProjectId,
    isLoading: project.loading
  };
}
