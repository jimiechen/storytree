import { describe, it, expect } from "bun:test";
import { mockProject, mockChapters, mockCharacters, mockAITasks } from "./index";

describe("Mock Data", () => {
  it("should have valid project data", () => {
    expect(mockProject.id).toBe("proj-001");
    expect(mockProject.name).toBeTruthy();
    expect(mockProject.genre).toBeTruthy();
    expect(mockProject.totalWordCount).toBeGreaterThan(0);
    expect(mockProject.chapterCount).toBeGreaterThan(0);
    expect(mockProject.characterCount).toBeGreaterThan(0);
    expect(mockProject.status).toBeOneOf(["active", "archived", "draft"]);
  });

  it("should have chapters with valid structure", () => {
    expect(mockChapters.length).toBeGreaterThan(0);

    for (const chapter of mockChapters) {
      expect(chapter.id).toBeTruthy();
      expect(chapter.title).toBeTruthy();
      expect(chapter.projectId).toBe(mockProject.id);
      expect(chapter.wordCount).toBeGreaterThanOrEqual(0);
      expect(chapter.status).toBeTruthy();
      expect(chapter.outline).toBeDefined();
      expect(chapter.outline.goal).toBeTruthy();
      expect(chapter.outline.conflict).toBeTruthy();
    }
  });

  it("should have chapters in correct order", () => {
    for (let i = 0; i < mockChapters.length - 1; i++) {
      expect(mockChapters[i].orderIndex).toBeLessThan(mockChapters[i + 1].orderIndex);
    }
  });

  it("should have characters with valid structure", () => {
    expect(mockCharacters.length).toBeGreaterThan(0);

    for (const character of mockCharacters) {
      expect(character.id).toBeTruthy();
      expect(character.name).toBeTruthy();
      expect(character.role).toBeTruthy();
      expect(character.personalityTags).toBeDefined();
      expect(character.goal).toBeTruthy();
      expect(character.secret).toBeTruthy();
    }
  });

  it("should have core protagonist", () => {
    const protagonist = mockCharacters.find(c => c.name === "苏瑶");
    expect(protagonist).toBeDefined();
    expect(protagonist?.role).toContain("主角");
  });

  it("should have AI tasks with valid structure", () => {
    expect(mockAITasks.length).toBeGreaterThan(0);

    for (const task of mockAITasks) {
      expect(task.id).toBeTruthy();
      expect(task.type).toBeTruthy();
      expect(task.status).toBeTruthy();
      expect(task.chapterId).toBeTruthy();
      expect(task.createdAt).toBeInstanceOf(Date);
    }
  });
});
