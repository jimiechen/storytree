/**
 * T-DB-003: Frontend-Database Integration Test
 *
 * Verifies that the frontend IPC request → MessageRouter → SQLite Database
 * pipeline works correctly, replacing MockStore with real persistence.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SQLiteDatabaseManager } from "../core/sqlite-db";
import { StoryTreeRepository } from "../core/repository";
import { createSQLiteAdapter } from "../core/db-adapter";
import { MessageRouter } from "../core/message-router";
import type { IPCRequest } from "../types/ipc-protocol";
import {
  SystemAction,
  ProjectAction,
  ChapterAction,
  CharacterAction,
  createRequest,
  isSuccessResponse,
} from "../types/ipc-protocol";

describe("T-DB-003: Frontend ↔ SQLite Integration", () => {
  let dbManager: SQLiteDatabaseManager;
  let router: MessageRouter;
  const testDbPath = `/tmp/storytree-integration-${Date.now()}.db`;

  beforeEach(async () => {
    dbManager = new SQLiteDatabaseManager({ dbPath: testDbPath });
    await dbManager.initialize();
    dbManager.seedSampleData();

    const adapter = createSQLiteAdapter(dbManager);
    const repo = new StoryTreeRepository(dbManager);

    router = new MessageRouter({ debug: false, strictMode: false });

    router.on(SystemAction.HEALTH_CHECK, () => ({
      status: "ok",
      version: "0.1.0",
      mode: "sqlite",
      dbStats: repo.getMockStats(),
      timestamp: new Date().toISOString(),
    }));

    router.on(SystemAction.GET_CONFIG, () => ({
      dbMode: "sqlite",
      encryption: true,
      features: { aiChat: false, outlineEditor: true },
    }));

    router.on(ProjectAction.LIST, () => {
      const projects = repo.getProjects();
      return { projects: adapter.getProjects(), total: projects.length };
    });

    router.on(ProjectAction.GET, (request) => {
      const payload = request.payload as { id?: string };
      if (!payload?.id) throw new Error("Project ID required");
      return repo.getProjectById(payload.id);
    });

    router.on(ProjectAction.CREATE, (request) => {
      const payload = request.payload as {
        name?: string;
        description?: string;
        genre?: string;
      };
      if (!payload?.name) throw new Error("Project name required");
      return repo.createProject({
        name: payload.name,
        description: payload.description,
        genre: payload.genre,
      });
    });

    router.on(ChapterAction.LIST, (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId =
        payload?.projectId || repo.getProjects()[0]?.id || "";
      if (!projectId) throw new Error("No project available");
      const chapters = repo.getChaptersByProject(projectId);
      return { chapters, total: chapters.length };
    });

    router.on(ChapterAction.GET, (request) => {
      const payload = request.payload as { id?: string };
      if (!payload?.id) throw new Error("Chapter ID required");
      return repo.getChapterById(payload.id);
    });

    router.on(CharacterAction.LIST, (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId =
        payload?.projectId || repo.getProjects()[0]?.id || "";
      if (!projectId) throw new Error("No project available");
      return {
        characters: adapter.getCharactersByProject(projectId),
        total: repo.getCharactersByProject(projectId).length,
      };
    });

    router.on("worldsetting.list", (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId =
        payload?.projectId || repo.getProjects()[0]?.id || "";
      if (!projectId) throw new Error("No project available");
      return {
        worldSettings: adapter.getWorldSettingsByProject(projectId),
        total: repo.getWorldSettingsByProject(projectId).length,
      };
    });

    router.on("outline.list", (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId =
        payload?.projectId || repo.getProjects()[0]?.id || "";
      if (!projectId) throw new Error("No project available");
      return {
        nodes: adapter.getOutlineByProject(projectId),
        total: repo.getOutlineNodesByProject(projectId).length,
      };
    });
  });

  afterEach(() => {
    dbManager.close();
    try {
      require("fs").unlinkSync(testDbPath);
    } catch {}
  });

  function sendRequest(action: string, payload?: unknown): Promise<unknown> {
    const req: IPCRequest = {
      jsonrpc: "2.0",
      id: `integ-${Date.now()}`,
      action,
      payload: payload ?? {},
      timestamp: new Date().toISOString(),
    };

    return router.processMessage(req).then((res) => {
      if ((res as { status: string }).status === "success") {
        return (res as { data: unknown }).data;
      }
      throw new Error(
        (res as { error: { message: string } }).error?.message ||
          "Request failed"
      );
    });
  }

  describe("Suite A: Health Check with SQLite Mode", () => {
    it("should report sqlite mode in health check", async () => {
      const health = await sendRequest(SystemAction.HEALTH_CHECK);
      expect((health as Record<string, unknown>).mode).toBe("sqlite");
    });

    it("should include real database stats in health check", async () => {
      const health = await sendRequest(SystemAction.HEALTH_CHECK);
      const stats = (health as Record<string, unknown>)
        .dbStats as Record<string, number>;

      expect(stats.projects).toBeGreaterThanOrEqual(1);
      expect(stats.chapters).toBe(5);
      expect(stats.characters).toBe(3);
    });
  });

  describe("Suite B: Project List from Real DB", () => {
    it("should list projects from SQLite", async () => {
      const data = await sendRequest(ProjectAction.LIST) as {
        projects: Array<{ name: string }>;
        total: number;
      };

      expect(data.projects.length).toBeGreaterThanOrEqual(1);
      expect(data.total).toBe(data.projects.length);
      expect(data.projects[0].name).toBe("星际迷途：归乡");
    });
  });

  describe("Suite C: Create & Retrieve Roundtrip", () => {
    it("should create a project via IPC and retrieve it", async () => {
      const created = await sendRequest(ProjectAction.CREATE, {
        name: "IPC 创建的小说",
        genre: "悬疑",
      }) as { id: string; name: string };

      expect(created.id).toBeDefined();
      expect(created.name).toBe("IPC 创建的小说");

      const retrieved = await sendRequest(ProjectAction.GET, {
        id: created.id,
      }) as { name: string };

      expect(retrieved.name).toBe("IPC 创建的小说");
    });
  });

  describe("Suite D: Chapters from Real DB", () => {
    it("should load chapters with correct order", async () => {
      const data = await sendRequest(ChapterAction.LIST) as {
        chapters: Array<{ order_num: number }>;
        total: number;
      };

      expect(data.chapters.length).toBe(5);
      expect(data.total).toBe(5);

      for (let i = 1; i < data.chapters.length; i++) {
        expect(data.chapters[i].order_num).toBeGreaterThan(
          data.chapters[i - 1].order_num
        );
      }
    });
  });

  describe("Suite E: Characters from Real DB", () => {
    it("should load characters with parsed traits array", async () => {
      const data = await sendRequest(CharacterAction.LIST) as {
        characters: Array<{ name: string; traits: string[] }>;
        total: number;
      };

      expect(data.characters.length).toBe(3);

      const protagonist = data.characters.find(
        (c) => c.name === "林远航"
      );
      expect(protagonist).toBeDefined();
      expect(Array.isArray(protagonist!.traits)).toBe(true);
      expect(protagonist!.traits).toContain("勇敢");
    });
  });

  describe("Suite F: World Settings from Real DB", () => {
    it("should load world settings with parsed details object", async () => {
      const data = await sendRequest("worldsetting.list") as {
        worldSettings: Array<{ name: string; details: Record<string, unknown> }>;
        total: number;
      };

      expect(data.worldSettings.length).toBe(2);

      const station = data.worldSettings.find(
        (ws) => ws.name === "新地平线空间站"
      );
      expect(station).toBeDefined();
      expect(station!.details.population).toBe(5000);
    });
  });

  describe("Suite G: Full Dashboard Flow Simulation", () => {
    it("should complete full dashboard initialization sequence", async () => {
      const health = await sendRequest(SystemAction.HEALTH_CHECK);
      expect(health).toBeDefined();

      const projects = await sendRequest(ProjectAction.LIST);
      expect(projects).toBeDefined();

      const chapters = await sendRequest(ChapterAction.LIST);
      expect(chapters).toBeDefined();

      const characters = await sendRequest(CharacterAction.LIST);
      expect(characters).toBeDefined();

      const worldSettings = await sendRequest("worldsetting.list");
      expect(worldSettings).toBeDefined();
    });
  });

  describe("Suite H: Data Persistence Verification", () => {
    it("should persist created data across multiple requests", async () => {
      const created = await sendRequest(ProjectAction.CREATE, {
        name: "持久化测试",
      }) as { id: string };

      const retrieved1 = await sendRequest(ProjectAction.GET, {
        id: created.id,
      });
      expect(retrieved1).toBeDefined();

      const retrieved2 = await sendRequest(ProjectAction.GET, {
        id: created.id,
      });
      expect(retrieved2).toBeDefined();
      expect(JSON.stringify(retrieved1)).toEqual(JSON.stringify(retrieved2));
    });
  });
});
