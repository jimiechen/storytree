import { createSignal, createResource } from 'solid-js';
import type { Project } from '../types';
import { createNovelProjectProvider } from '../providers/novel-project';

const projectProvider = createNovelProjectProvider();

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
