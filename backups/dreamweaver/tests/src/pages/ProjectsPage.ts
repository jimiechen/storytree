import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProjectsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/projects');
  }

  async getPageTitle() {
    return this.page.locator('h1, h2:has-text("项目列表"), h2:has-text("Projects")');
  }

  async getProjectList() {
    return this.page.locator('.grid, .flex, .project-list');
  }

  async getProjectCards() {
    return this.page.locator('.project-card, [data-testid="project-card"]');
  }

  async getFirstProjectCard() {
    return this.page.locator('.project-card, [data-testid="project-card"]').first();
  }

  async getCreateButton() {
    return this.page.locator('button:has-text("新建项目"), button:has-text("New Project"), a[href*="create"]');
  }

  async getSearchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"]');
  }

  async getEmptyState() {
    return this.page.locator('text=/暂无项目|No projects yet|还没有项目/');
  }

  async getEmptyStateCreateButton() {
    return this.page.locator('button:has-text("创建第一个项目"), button:has-text("Create your first project")');
  }

  async clickFirstProjectCard() {
    const projectCard = await this.getFirstProjectCard();
    await projectCard.click();
  }

  async clickCreateButton() {
    const createButton = await this.getCreateButton();
    await createButton.click();
  }

  async searchProjects(keyword: string) {
    const searchInput = await this.getSearchInput();
    await searchInput.fill(keyword);
    await searchInput.press('Enter');
  }

  async expectProjectsPageVisible() {
    await this.expectElementToBeVisible('h1, h2:has-text("项目列表")');
    await this.expectElementToBeVisible('.project-list, .grid');
    await this.expectElementToBeVisible('button:has-text("新建项目")');
  }

  async expectEmptyStateVisible() {
    const emptyState = await this.getEmptyState();
    await expect(emptyState).toBeVisible();
    const createButton = await this.getEmptyStateCreateButton();
    await expect(createButton).toBeVisible();
  }

  async expectProjectCardsVisible() {
    const projectCards = await this.getProjectCards();
    await expect(projectCards).toBeVisible();
  }

  async expectNavigationToWorkbench() {
    await this.expectUrlToContain('/workbench');
  }

  async expectNavigationToCreateProject() {
    await this.expectUrlToContain('/projects/create');
  }
}
