/**
 * Unit Tests for Mock Data Store
 *
 * Tests cover CRUD operations, search functionality,
 * and sample data seeding.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MockDataStore,
  StoryTreeMockStore,
  mockStore,
  initializeMockStore,
} from "../core/mock-store";
import type {
  Project,
  Chapter,
  Character,
  WorldSetting,
} from "../core/mock-store";

describe("Mock Data Store - Core Functionality", () => {
  let store: MockDataStore<Project>;

  beforeEach(() => {
    store = new MockDataStore<Project>();
  });

  it("should create entities with auto-generated IDs", () => {
    const project = store.create({
      name: "Test Project",
      description: "A test project",
      genre: "fantasy",
      status: "draft",
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe("Test Project");
    expect(project.createdAt).toBeDefined();
    expect(project.updatedAt).toBeDefined();
  });

  it("should find entity by ID", () => {
    const created = store.create({
      name: "Find Me",
      status: "draft",
    });

    const found = store.findById(created.id);

    expect(found).toBeDefined();
    expect(found?.name).toBe("Find Me");
  });

  it("should return undefined for non-existent ID", () => {
    const found = store.findById("non-existent");

    expect(found).toBeUndefined();
  });

  it("should list all entities", () => {
    store.create({ name: "Project 1", status: "draft" });
    store.create({ name: "Project 2", status: "draft" });
    store.create({ name: "Project 3", status: "draft" });

    const all = store.findAll();

    expect(all).toHaveLength(3);
  });

  it("should support filtering in findAll", () => {
    store.create({ name: "Active Project", status: "in_progress" });
    store.create({ name: "Draft Project", status: "draft" });

    const active = store.findAll((p) => p.status === "in_progress");

    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("Active Project");
  });

  it("should update existing entity", () => {
    const created = store.create({
      name: "Original Name",
      status: "draft",
    });

    const updated = store.update(created.id, {
      name: "Updated Name",
      status: "in_progress",
    });

    expect(updated).toBeDefined();
    expect(updated!.name).toBe("Updated Name");
    expect(updated!.status).toBe("in_progress");
    expect(updated!.id).toBe(created.id);
  });

  it("should return undefined when updating non-existent entity", () => {
    const result = store.update("non-existent", { name: "Test" });

    expect(result).toBeUndefined();
  });

  it("should delete entity by ID", () => {
    const created = store.create({ name: "To Delete", status: "draft" });

    expect(store.count()).toBe(1);

    const deleted = store.delete(created.id);

    expect(deleted).toBe(true);
    expect(store.count()).toBe(0);
  });

  it("should return false when deleting non-existent ID", () => {
    const result = store.delete("non-existent");

    expect(result).toBe(false);
  });

  it("should clear all entities", () => {
    store.create({ name: "1", status: "draft" });
    store.create({ name: "2", status: "draft" });
    store.create({ name: "3", status: "draft" });

    expect(store.count()).toBe(3);

    store.clear();

    expect(store.count()).toBe(0);
  });
});

describe("StoryTree Mock Store - Integration", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("should seed sample data on initialization", () => {
    const stats = mockStore.getStats();

    expect(stats.projects).toBeGreaterThan(0);
    expect(stats.chapters).toBeGreaterThan(0);
    expect(stats.characters).toBeGreaterThan(0);
    expect(stats.worldSettings).toBeGreaterThan(0);
  });

  it("should provide access to projects with relationships", () => {
    const projects = mockStore.getProjects();

    expect(projects.length).toBeGreaterThanOrEqual(1);

    const firstProject = projects[0];
    expect(firstProject.name).toBeDefined();

    const chapters = mockStore.getChaptersByProject(firstProject.id);
    expect(chapters.length).toBeGreaterThan(0);

    const characters = mockStore.getCharactersByProject(firstProject.id);
    expect(characters.length).toBeGreaterThan(0);
  });

  it("should support creating new entities via store methods", () => {
    const newProject = mockStore.createProject({
      name: "New Test Project",
      genre: "sci-fi",
      status: "draft",
    });

    expect(newProject.id).toBeDefined();
    expect(newProject.name).toBe("New Test Project");

    const retrieved = mockStore.getProjectById(newProject.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("New Test Project");
  });

  it("should support searching across entity types", () => {
    const results = mockStore.search({
      type: "character",
      keyword: "林远航",
    });

    expect(results.length).toBeGreaterThan(0);
    const firstResult = results[0] as { name?: string; title?: string };
    expect(firstResult.name || firstResult.title).toContain("林");
  });

  it("should return empty array for no matches in search", () => {
    const results = mockStore.search({
      type: "project",
      keyword: "NONEXISTENT_KEYWORD_12345",
    });

    expect(results).toHaveLength(0);
  });

  it("should maintain data consistency after reset and re-initialize", () => {
    const statsBefore = mockStore.getStats();

    mockStore.reset();
    const statsAfterReset = mockStore.getStats();

    expect(statsAfterReset.projects).toBe(statsBefore.projects);
    expect(statsAfterReset.chapters).toBe(statsBefore.chapters);
  });
});
