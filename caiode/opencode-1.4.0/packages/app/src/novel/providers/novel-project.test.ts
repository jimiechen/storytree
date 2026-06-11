import { describe, it, expect } from 'vitest';
import { NovelProjectProvider } from './novel-project';
import type { Project } from '../types';

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
