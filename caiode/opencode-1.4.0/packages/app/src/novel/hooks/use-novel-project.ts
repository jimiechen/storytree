import { createSignal, createResource } from 'solid-js';
import type { Project } from '../types';
import { NovelProjectProvider } from '../providers/providers-index';

const projectProvider = new NovelProjectProvider();

export function useNovelProject() {
  const [projectId, setProjectId] = createSignal<string>('proj-001');

  const [project] = createResource(projectId, async (id) => {
    return projectProvider.getProject(id);
  });

  const [projectsResource, { refetch: refetchProjects }] = createResource(
    () => projectId(),
    async () => projectProvider.listProjects()
  );

  const [searchKeyword, setSearchKeyword] = createSignal('');

  const filteredProjects = (): Project[] => {
    const all = projectsResource();
    if (!all) return [];
    const kw = searchKeyword().trim().toLowerCase();
    if (!kw) return all;
    return all.filter(
      p => p.name.toLowerCase().includes(kw) || p.genre.toLowerCase().includes(kw)
    );
  };

  const selectProject = (id: string) => setProjectId(id);

  return {
    project,
    projects: projectsResource,
    filteredProjects,
    searchKeyword,
    setSearchKeyword,
    setProjectId,
    selectProject,
    isLoading: project.loading,
    isLoadingList: projectsResource.loading,
    refetchProjects
  };
}
