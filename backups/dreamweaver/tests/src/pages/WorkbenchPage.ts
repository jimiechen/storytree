import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkbenchPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string) {
    await super.goto(`/workbench/${projectId}`);
  }

  async getChapterSidebar() {
    return this.page.locator('.chapter-sidebar, [data-testid="chapter-sidebar"]');
  }

  async getChapterList() {
    return this.page.locator('.chapter-list, [data-testid="chapter-list"]');
  }

  async getChapterItems() {
    return this.page.locator('.chapter-item, [data-testid="chapter-item"]');
  }

  async getFirstChapterItem() {
    return this.page.locator('.chapter-item, [data-testid="chapter-item"]').first();
  }

  async getEditor() {
    return this.page.locator('.editor, [data-testid="editor"]');
  }

  async getEditorContent() {
    return this.page.locator('.editor-content, [data-testid="editor-content"]');
  }

  async getWordCount() {
    return this.page.locator('.word-count, [data-testid="word-count"]');
  }

  async getSaveStatus() {
    return this.page.locator('.save-status, [data-testid="save-status"]');
  }

  async getNewChapterButton() {
    return this.page.locator('button:has-text("新建章节"), button:has-text("New Chapter")');
  }

  async getAIPanel() {
    return this.page.locator('.ai-panel, [data-testid="ai-panel"]');
  }

  async getProjectTitle() {
    return this.page.locator('.project-title, [data-testid="project-title"]');
  }

  async clickChapterItem(index: number) {
    const chapterItems = await this.getChapterItems();
    await chapterItems.nth(index).click();
  }

  async clickFirstChapter() {
    const firstChapter = await this.getFirstChapterItem();
    await firstChapter.click();
  }

  async clickNewChapterButton() {
    const newChapterButton = await this.getNewChapterButton();
    await newChapterButton.click();
  }

  async typeInEditor(text: string) {
    const editor = await this.getEditor();
    await editor.click();
    await this.page.keyboard.type(text);
  }

  async expectWorkbenchLayoutVisible() {
    await this.expectElementToBeVisible('.chapter-sidebar');
    await this.expectElementToBeVisible('.editor');
    await this.expectElementToBeVisible('.ai-panel');
  }

  async expectChapterListVisible() {
    const chapterList = await this.getChapterList();
    await expect(chapterList).toBeVisible();
  }

  async expectEditorVisible() {
    const editor = await this.getEditor();
    await expect(editor).toBeVisible();
  }

  async expectWordCountVisible() {
    const wordCount = await this.getWordCount();
    await expect(wordCount).toBeVisible();
  }

  async expectSaveStatusVisible() {
    const saveStatus = await this.getSaveStatus();
    await expect(saveStatus).toBeVisible();
  }

  async expectProjectTitleVisible() {
    const projectTitle = await this.getProjectTitle();
    await expect(projectTitle).toBeVisible();
  }

  async expectAIPanelVisible() {
    const aiPanel = await this.getAIPanel();
    await expect(aiPanel).toBeVisible();
  }

  async expectContentLoaded() {
    const editorContent = await this.getEditorContent();
    await expect(editorContent).toBeVisible();
  }

  async expectWordCountUpdated() {
    const wordCount = await this.getWordCount();
    await expect(wordCount).not.toHaveText('0');
  }

  async expectAutoSaveSuccess() {
    const saveStatus = await this.getSaveStatus();
    await expect(saveStatus).toHaveText(/已保存|Saved/);
  }
}
