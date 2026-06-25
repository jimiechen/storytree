import { createSignal, createResource, createMemo } from 'solid-js';
import type { Project, CreateProjectInput } from '../types';
import { NovelProjectProvider, NovelProjectHttpProvider } from '../providers/providers-index';
import type { INovelProjectProvider } from '../providers/providers-index';
import { useFeatureGates } from './use-feature-gates';

/** Mock Provider 模块级单例（内存数据共享） */
const mockProvider = new NovelProjectProvider();

/** HTTP Provider 模块级单例（无状态，仅在 realNovelBackendEnabled 时使用） */
let httpProvider: NovelProjectHttpProvider | null = null;

function getHttpProvider(): NovelProjectHttpProvider {
  if (!httpProvider) {
    httpProvider = new NovelProjectHttpProvider({
      baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4096',
      directory: typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('directory') ?? '.'
        : '.',
    });
  }
  return httpProvider;
}

export function useNovelProject() {
  const gates = useFeatureGates();
  const projectProvider: INovelProjectProvider = gates.realNovelBackendEnabled
    ? getHttpProvider()
    : mockProvider;

  const [projectId, setProjectId] = createSignal<string>('proj-001');

  const [project] = createResource(projectId, async (id) => {
    return projectProvider.getProject(id);
  });

  const [projectsResource, { refetch: refetchProjects, mutate: mutateProjects }] = createResource(
    () => projectId(),
    async () => projectProvider.listProjects()
  );

  const [searchKeyword, setSearchKeyword] = createSignal('');
  const [listError, setListError] = createSignal<Error | null>(null);
  const [deleting, setDeleting] = createSignal<string | null>(null);

  /** 全量项目（未过滤），用于徽章计数与"无匹配"判断 */
  const allProjects = createMemo<Project[]>(() => projectsResource() ?? []);

  const filteredProjects = (): Project[] => {
    const all = allProjects();
    const kw = searchKeyword().trim().toLowerCase();
    if (!kw) return all;
    return all.filter(
      p => p.name.toLowerCase().includes(kw) || p.genre.toLowerCase().includes(kw)
    );
  };

  /** 是否搜索无匹配（全量非空但过滤后为空） */
  const isNoMatch = createMemo(() => {
    const all = allProjects();
    const kw = searchKeyword().trim();
    return all.length > 0 && kw.length > 0 && filteredProjects().length === 0;
  });

  const selectProject = (id: string) => setProjectId(id);

  /** 创建项目 */
  const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const created = await projectProvider.createProject(input);
    await refetchProjects();
    return created;
  };

  /** 软删除项目：乐观更新 + 失败回滚 */
  const deleteProject = async (id: string): Promise<void> => {
    setDeleting(id);
    const snapshot = projectsResource() ?? [];
    // 乐观移除
    mutateProjects(snapshot.filter(p => p.id !== id));
    setListError(null);
    try {
      await projectProvider.deleteProject(id);
    } catch (err) {
      // 回滚
      mutateProjects(snapshot);
      setListError(err instanceof Error ? err : new Error('删除失败'));
      throw err;
    } finally {
      setDeleting(null);
    }
  };

  /** 恢复项目 */
  const restoreProject = async (id: string): Promise<void> => {
    await projectProvider.restoreProject(id);
    await refetchProjects();
  };

  return {
    project,
    projects: projectsResource,
    filteredProjects,
    allProjects,
    isNoMatch,
    searchKeyword,
    setSearchKeyword,
    setProjectId,
    selectProject,
    createProject,
    isLoading: () => project.loading,
    isLoadingList: () => projectsResource.loading,
    listError,
    deleting,
    deleteProject,
    restoreProject,
    refetchProjects,
  };
}
