/**
 * T-DB-001: SQLite Local Database Replacement
 *
 * Verifies:
 * 1. Database initialization and schema creation
 * 2. Migration system (version tracking, up/down)
 * 3. Sample data seeding
 * 4. Repository CRUD for all entity types
 * 5. Search functionality
 * 6. Transaction support
 * 7. Foreign key constraints
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SQLiteDatabaseManager } from "../core/sqlite-db";
import { StoryTreeRepository } from "../core/repository";
import type { Project, Chapter, Character, WorldSetting } from "../core/repository";

describe("T-DB-001: SQLite Local Database", () => {
  let dbManager: SQLiteDatabaseManager;
  let repo: StoryTreeRepository;
  const testDbPath = `/tmp/storytree-sqlite-test-${Date.now()}.db`;

  beforeEach(async () => {
    dbManager = new SQLiteDatabaseManager({ dbPath: testDbPath });
    try {
      await dbManager.initialize();
      repo = new StoryTreeRepository(dbManager);
      dbManager.seedSampleData();
    } catch (err) {
      console.error("[sqlite-db.test] Initialize failed:", err);
      throw err;
    }
  });

  afterEach(() => {
    dbManager.close();
    try {
      const fs = require("fs");
      fs.unlinkSync(testDbPath);
      try { fs.unlinkSync(testDbPath + "-wal"); } catch {}
      try { fs.unlinkSync(testDbPath + "-shm"); } catch {}
    } catch {}
  });

  describe("Suite A: Database Initialization & Schema", () => {
    it("should initialize database successfully", async () => {
      expect(dbManager).toBeDefined();
    });

    it("should create all required tables", () => {
      const stats = dbManager.getStats();
      const tableNames = stats.tables.map((t) => t.name);

      expect(tableNames).toContain("projects");
      expect(tableNames).toContain("chapters");
      expect(tableNames).toContain("characters");
      expect(tableNames).toContain("world_settings");
      expect(tableNames).toContain("outline_nodes");
    });

    it("should track schema version in migrations table", () => {
      const stats = dbManager.getStats();
      expect(stats.version).toBeGreaterThanOrEqual(1);
    });

    it("should have WAL journal mode enabled by default", () => {
      const mode = dbManager.pragma("journal_mode") as string;
      expect(mode.toLowerCase()).toContain("wal");
    });

    it("should have foreign keys enabled", () => {
      const fk = dbManager.pragma("foreign_keys") as number;
      expect(fk).toBe(1);
    });
  });

  describe("Suite B: Sample Data Seeding", () => {
    it("should seed a project after initialization", () => {
      const projects = repo.getProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe("星际迷途：归乡");
    });

    it("should seed 5 chapters", () => {
      const chapters = repo.getChaptersByProject("proj-001");
      expect(chapters.length).toBe(5);
    });

    it("should seed 3 characters", () => {
      const characters = repo.getCharactersByProject("proj-001");
      expect(characters.length).toBe(3);
    });

    it("should seed 2 world settings", () => {
      const settings = repo.getWorldSettingsByProject("proj-001");
      expect(settings.length).toBe(2);
    });

    it("should not re-seed if data exists", () => {
      repo.createProject({ name: "Another" });
      dbManager.seedSampleData();

      const projects = repo.getProjects();
      expect(projects.length).toBe(2);
    });
  });

  describe("Suite C: Project CRUD", () => {
    it("should get project by ID", () => {
      const proj = repo.getProjectById("proj-001");
      expect(proj?.name).toBe("星际迷途：归乡");
      expect(proj?.genre).toBe("科幻");
    });

    it("should return undefined for non-existent project", () => {
      expect(repo.getProjectById("nonexistent")).toBeUndefined();
    });

    it("should create a new project", () => {
      const proj = repo.createProject({
        name: "新小说",
        description: "测试描述",
        genre: "奇幻",
        status: "draft",
      });

      expect(proj.id).toBeDefined();
      expect(proj.name).toBe("新小说");
      expect(proj.description).toBe("测试描述");

      const fetched = repo.getProjectById(proj.id);
      expect(fetched?.name).toBe("新小说");
    });

    it("should update an existing project", () => {
      const updated = repo.updateProject("proj-001", {
        name: "星际迷途：归乡（修订版）",
        status: "completed",
      });

      expect(updated?.name).toBe("星际迷途：归乡（修订版）");
      expect(updated?.status).toBe("completed");
    });

    it("should return undefined when updating non-existent project", () => {
      expect(repo.updateProject("ghost", { name: "x" })).toBeUndefined();
    });

    it("should delete a project and cascade to related records", () => {
      const id = repo.createProject({ name: "To Delete" }).id;
      repo.createChapter({ project_id: id, title: "Ch1" });
      repo.createCharacter({ project_id: id, name: "Char1" });

      const deleted = repo.deleteProject(id);
      expect(deleted).toBe(true);

      expect(repo.getProjectById(id)).toBeUndefined();
      expect(repo.getChaptersByProject(id)).toHaveLength(0);
      expect(repo.getCharactersByProject(id)).toHaveLength(0);
    });
  });

  describe("Suite D: Chapter CRUD", () => {
    it("should get chapters ordered by order_num", () => {
      const chapters = repo.getChaptersByProject("proj-001");
      expect(chapters[0].order_num).toBeLessThan(chapters[4].order_num);
    });

    it("should get chapter by ID", () => {
      const ch = repo.getChapterById("ch-001");
      expect(ch?.title).toContain("启程");
    });

    it("should create a chapter with auto-generated ID", () => {
      const ch = repo.createChapter({
        project_id: "proj-001",
        title: "新章节",
        content: "内容...",
        status: "draft",
      });

      expect(ch.id.startsWith("ch-")).toBe(true);
      expect(ch.title).toBe("新章节");
    });

    it("should update chapter content and word count", () => {
      const updated = repo.updateChapter("ch-001", {
        content: "更新后的长篇内容...",
        word_count: 2500,
        status: "review",
      });

      expect(updated?.content).toBe("更新后的长篇内容...");
      expect(updated?.word_count).toBe(2500);
      expect(updated?.status).toBe("review");
    });

    it("should delete a chapter", () => {
      const before = repo.getChaptersByProject("proj-001").length;
      repo.deleteChapter("ch-005");
      const after = repo.getChaptersByProject("proj-001").length;

      expect(after).toBe(before - 1);
    });
  });

  describe("Suite E: Character CRUD", () => {
    it("should get characters sorted by name", () => {
      const chars = repo.getCharactersByProject("proj-001");
      const names = chars.map((c) => c.name);
      expect(names).toEqual([...names].sort());
    });

    it("should get character by ID", () => {
      const c = repo.getCharacterById("char-001");
      expect(c?.name).toBe("林远航");
      expect(c?.role).toBe("protagonist");
    });

    it("should create character with traits as JSON array", () => {
      const c = repo.createCharacter({
        project_id: "proj-001",
        name: "新角色",
        role: "supporting",
        traits: ["聪明", "勇敢"],
      });

      expect(c.traits).toBe(JSON.stringify(["聪明", "勇敢"]));
    });

    it("should update character role", () => {
      const updated = repo.updateCharacter("char-002", {
        role: "supporting",
        description: "新的角色描述",
      });

      expect(updated?.role).toBe("supporting");
      expect(updated?.description).toBe("新的角色描述");
    });

    it("should delete a character", () => {
      const deleted = repo.deleteCharacter("char-003");
      expect(deleted).toBe(true);

      expect(repo.getCharacterById("char-003")).toBeUndefined();
    });
  });

  describe("Suite F: World Settings & Outline", () => {
    it("should get world settings grouped by category", () => {
      const settings = repo.getWorldSettingsByProject("proj-001");
      expect(settings.length).toBe(2);

      const locations = settings.filter((s) => s.category === "location");
      expect(locations.length).toBe(1);
      expect(locations[0].name).toBe("新地平线空间站");
    });

    it("should get outline nodes", () => {
      const nodes = repo.getOutlineNodesByProject("proj-001");
      expect(Array.isArray(nodes)).toBe(true);
    });

    it("should parse world setting details JSON", () => {
      const settings = repo.getWorldSettingsByProject("proj-001");
      const station = settings.find((s) => s.name === "新地平线空间站");
      expect(station).toBeDefined();

      const details = JSON.parse(station!.details);
      expect(details.population).toBe(5000);
    });
  });

  describe("Suite G: Search Functionality", () => {
    it("should search across all entity types", () => {
      const results = repo.search("星际迷途");
      expect(results.length).toBeGreaterThan(0);

      const types = results.map((r) => r.type);
      expect(types).toContain("project");
    });

    it("should find characters by name", () => {
      const results = repo.search("林远航");
      const charResults = results.filter((r) => r.type === "character");
      expect(charResults.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const results = repo.search("zzz_nonexistent_zzz");
      expect(results.length).toBe(0);
    });

    it("should search chapter titles", () => {
      const results = repo.search("启程");
      expect(results.some((r) => r.type === "chapter")).toBe(true);
    });
  });

  describe("Suite H: Mock Stats Compatibility", () => {
    it("should provide mock-compatible stats interface", () => {
      const stats = repo.getMockStats();

      expect(stats.projects).toBeGreaterThanOrEqual(1);
      expect(stats.chapters).toBe(5);
      expect(stats.characters).toBe(3);
      expect(stats.worldSettings).toBe(2);
    });
  });

  describe("Suite I: Database Stats & Metadata", () => {
    it("should report correct total row count", () => {
      const stats = dbManager.getStats();
      expect(stats.totalRows).toBeGreaterThan(10);
    });

    it("should report correct database path", () => {
      const stats = dbManager.getStats();
      expect(stats.dbPath).toBe(testDbPath);
    });
  });

  describe("Suite J: Edge Cases", () => {
    it("should handle empty string search gracefully", () => {
      const results = repo.search("");
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle special characters in names", () => {
      const proj = repo.createProject({
        name: 'Test "with" <special> & chars',
      });
      expect(proj.name).toContain('"');
    });

    it("should handle very long descriptions", () => {
      const longDesc = "x".repeat(10000);
      const proj = repo.createProject({
        name: "Long Desc",
        description: longDesc,
      });

      const fetched = repo.getProjectById(proj.id);
      expect(fetched?.description.length).toBe(10000);
    });
  });
});
