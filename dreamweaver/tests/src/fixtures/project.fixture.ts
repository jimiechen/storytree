import { test as base } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';
import { WorkbenchPage } from '../pages/WorkbenchPage';

export const test = base.extend({
  projectsPage: async ({ page }, use) => {
    const projectsPage = new ProjectsPage(page);
    await use(projectsPage);
  },

  workbenchPage: async ({ page }, use) => {
    const workbenchPage = new WorkbenchPage(page);
    await use(workbenchPage);
  },

  testProject: {
    id: '1',
    title: '测试项目',
    description: '这是一个测试项目',
    createdAt: new Date().toISOString()
  },

  testProjectData: {
    title: '新建测试项目',
    description: '这是一个新建的测试项目',
    genre: '科幻',
    wordCount: 0
  }
});

export { expect } from '@playwright/test';
