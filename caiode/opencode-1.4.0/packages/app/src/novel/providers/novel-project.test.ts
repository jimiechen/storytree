import { describe, it, expect } from 'vitest';
import { NovelProjectProvider } from './novel-project';
import type { Project, CreateProjectInput } from '../types';

describe('NovelProjectProvider - 书架多项目支持', () => {
  it('listProjects 应返回多个项目', async () => {
    const provider = new NovelProjectProvider();
    const projects = await provider.listProjects();
    expect(projects.length).toBeGreaterThanOrEqual(2);
  });

  it('listProjects 返回的每个项目应包含必要字段', async () => {
    const provider = new NovelProjectProvider();
    const projects = await provider.listProjects();
    for (const p of projects) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('genre');
      expect(p).toHaveProperty('totalWordCount');
      expect(p).toHaveProperty('chapterCount');
      expect(p).toHaveProperty('lastUpdated');
      expect(p).toHaveProperty('status');
    }
  });

  it('searchProjects 按关键词过滤项目名称', async () => {
    const provider = new NovelProjectProvider();
    const results = await provider.searchProjects('异兽');
    for (const r of results) {
      expect(r.name).toContain('异兽');
    }
  });

  it('searchProjects 空关键词返回全部项目', async () => {
    const provider = new NovelProjectProvider();
    const all = await provider.listProjects();
    const results = await provider.searchProjects('');
    expect(results.length).toBe(all.length);
  });

  it('searchProjects 无匹配结果返回空数组', async () => {
    const provider = new NovelProjectProvider();
    const results = await provider.searchProjects('zzzzzzzzz不存在的关键词');
    expect(results).toEqual([]);
  });

  it('getProject 返回副本，修改不应污染内部状态', async () => {
    const provider = new NovelProjectProvider();
    const project = await provider.getProject('proj-001');
    expect(project).not.toBeNull();
    if (project) {
      project.name = '已修改的名字';
      const again = await provider.getProject('proj-001');
      expect(again?.name).not.toBe('已修改的名字');
    }
  });
});

describe('NovelProjectProvider - 创建项目 (Phase 1.2)', () => {
  it('createProject 应成功创建并返回新项目', async () => {
    const provider = new NovelProjectProvider();
    const input: CreateProjectInput = {
      name: '测试小说',
      genre: '玄幻',
      description: '测试描述',
    };
    const project = await provider.createProject(input);
    expect(project).not.toBeNull();
    expect(project!.name).toBe('测试小说');
    expect(project!.genre).toBe('玄幻');
    expect(project!.id).toMatch(/^proj-/);
    expect(project!.status).toBe('draft');
    expect(project!.totalWordCount).toBe(0);
    expect(project!.chapterCount).toBe(0);
  });

  it('createProject 后 listProjects 应包含新项目', async () => {
    const provider = new NovelProjectProvider();
    const before = await provider.listProjects();
    await provider.createProject({ name: '新项目', genre: '科幻' });
    const after = await provider.listProjects();
    expect(after.length).toBe(before.length + 1);
    expect(after.find(p => p.name === '新项目')).toBeDefined();
  });

  it('createProject 缺少必填字段应抛出 ProviderError', async () => {
    const provider = new NovelProjectProvider();
    // @ts-expect-error 测试缺少 name
    await expect(provider.createProject({ genre: '玄幻' })).rejects.toThrow();
  });

  it('createProject 返回副本，修改不影响内部状态', async () => {
    const provider = new NovelProjectProvider();
    const project = await provider.createProject({ name: '隔离测试', genre: '都市' });
    expect(project).not.toBeNull();
    project!.name = '被篡改';
    const found = await provider.getProject(project!.id);
    expect(found?.name).toBe('隔离测试');
  });

  it('GENRE_OPTIONS 包含所有预定义类型', () => {
    const { GENRE_OPTIONS } = require('../types/project') as { GENRE_OPTIONS: string[] };
    expect(GENRE_OPTIONS).toContain('玄幻');
    expect(GENRE_OPTIONS).toContain('都市');
    expect(GENRE_OPTIONS).toContain('穿越');
    expect(GENRE_OPTIONS).toContain('科幻');
    expect(GENRE_OPTIONS).toContain('仙侠');
    expect(GENRE_OPTIONS).toContain('悬疑');
    expect(GENRE_OPTIONS).toContain('古言');
    expect(GENRE_OPTIONS).toContain('其他');
    expect(GENRE_OPTIONS.length).toBe(8);
  });
});
