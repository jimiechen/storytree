/**
 * T-FE-001: Stitch UI Pages Restoration Test
 *
 * Verifies that all restored pages (Characters, Outline, World Settings)
 * can successfully fetch data via IPC and produce renderable output.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MessageRouter } from "../core/message-router";
import { initializeMockStore, mockStore } from "../core/mock-store";
import type { IPCRequest } from "../types/ipc-protocol";
import {
  SystemAction,
  ProjectAction,
  ChapterAction,
  CharacterAction,
  createRequest,
  isSuccessResponse,
} from "../types/ipc-protocol";

describe("T-FE-001: Stitch UI Pages Restoration", () => {
  let router: MessageRouter;

  beforeEach(() => {
    mockStore.reset();
    router = new MessageRouter({ debug: false, strictMode: false });
    registerAllHandlers(router);
  });

  function registerAllHandlers(r: MessageRouter): void {
    r.on(SystemAction.HEALTH_CHECK, () => ({
      status: "ok", version: "0.1.0",
      mockStats: mockStore.getStats(), timestamp: new Date().toISOString(),
    }));
    r.on(ProjectAction.LIST, () => {
      const projects = mockStore.getProjects();
      return { projects, total: projects.length };
    });
    r.on(ChapterAction.LIST, (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;
      if (!projectId) throw new Error("No project available");
      const chapters = mockStore.getChaptersByProject(projectId);
      return { chapters, total: chapters.length };
    });
    r.on(CharacterAction.LIST, (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;
      if (!projectId) throw new Error("No project available");
      const characters = mockStore.getCharactersByProject(projectId);
      return { characters, total: characters.length };
    });
    r.on("worldsetting.list", (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;
      if (!projectId) throw new Error("No project available");
      const settings = mockStore.getWorldSettingsByProject(projectId);
      return { worldSettings: settings, total: settings.length };
    });
  }

  function sendRequest(action: string, payload: unknown): Promise<unknown> {
    const req: IPCRequest = {
      jsonrpc: "2.0",
      id: `fe-${Date.now()}`,
      action,
      payload,
      timestamp: new Date().toISOString(),
    };
    return router.processMessage(req).then((res) => {
      if (isSuccessResponse(res)) return res.data;
      throw new Error(res.error?.message || "Request failed");
    });
  }

  describe("Page 1: Characters (角色管理)", () => {
    it("should load character list via IPC", async () => {
      const data = await sendRequest(CharacterAction.LIST, {}) as { characters: unknown[]; total: number };
      expect(data.characters).toBeDefined();
      expect(data.characters.length).toBe(3);
      expect(data.total).toBe(3);
    });

    it("should return characters with renderable fields", async () => {
      const data = await sendRequest(CharacterAction.LIST, {}) as {
        characters: Array<{ name: string; role: string; description?: string; traits?: string[] }>;
        total: number;
      };
      const c = data.characters[0];
      expect(c.name).toBe("林远航");
      expect(c.role).toBe("protagonist");
      expect(c.description).toBeDefined();
      expect(Array.isArray(c.traits)).toBe(true);
    });

    it("should support character search by name keyword", async () => {
      const data = await sendRequest(CharacterAction.LIST, {}) as { characters: Array<{ name: string }> };
      const found = data.characters.filter((c) => c.name.includes("艾拉"));
      expect(found.length).toBe(1);
      expect(found[0].name).toBe("艾拉");
    });

    it("should include role classification for rendering badges", async () => {
      const data = await sendRequest(CharacterAction.LIST, {}) as {
        characters: Array<{ role: string; name: string }>;
      };
      const roles = data.characters.map((c) => c.role);
      expect(roles).toContain("protagonist");
      expect(roles).toContain("antagonist");
      expect(roles).toContain("supporting");
    });

    it("should provide traits array for tag rendering", async () => {
      const data = await sendRequest(CharacterAction.LIST, {}) as {
        characters: Array<{ name: string; traits?: string[] }>;
      };
      const protagonist = data.characters.find((c) => c.name === "林远航");
      expect(protagonist?.traits).toContain("勇敢");
      expect(protagonist?.traits).toContain("好奇");
    });
  });

  describe("Page 2: Outline/Chapters (大纲编辑)", () => {
    it("should load chapter list via IPC", async () => {
      const data = await sendRequest(ChapterAction.LIST, {}) as { chapters: unknown[]; total: number };
      expect(data.chapters).toBeDefined();
      expect(data.chapters.length).toBe(5);
      expect(data.total).toBe(5);
    });

    it("should return chapters with ordered sequence", async () => {
      const data = await sendRequest(ChapterAction.LIST, {}) as {
        chapters: Array<{ order: number; title: string }>;
      };
      const orders = data.chapters.map((ch) => ch.order);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThan(orders[i - 1]);
      }
    });

    it("should include word count per chapter for display", async () => {
      const data = await sendRequest(ChapterAction.LIST, {}) as {
        chapters: Array<{ title: string; wordCount: number }>;
      };
      data.chapters.forEach((ch) => {
        expect(typeof ch.wordCount).toBe("number");
        expect(ch.wordCount).toBeGreaterThan(0);
      });
    });

    it("should have status field for workflow tracking", async () => {
      const data = await sendRequest(ChapterAction.LIST, {}) as {
        chapters: Array<{ status: string; order: number }>;
      };
      const validStatuses = ["outline", "draft", "review", "final"];
      data.chapters.forEach((ch) => {
        expect(validStatuses).toContain(ch.status);
      });
    });

    it("should contain seeded chapter titles matching the story", async () => {
      const data = await sendRequest(ChapterAction.LIST, {}) as {
        chapters: Array<{ title: string }>;
      };
      const titles = data.chapters.map((ch) => ch.title);
      expect(titles.some((t) => t.includes("启程"))).toBe(true);
      expect(titles.some((t) => t.includes("回归"))).toBe(true);
    });
  });

  describe("Page 3: World Settings (世界观设定)", () => {
    it("should load world settings list via IPC", async () => {
      const data = await sendRequest("worldsetting.list", {}) as { worldSettings: unknown[]; total: number };
      expect(data.worldSettings).toBeDefined();
      expect(data.worldSettings.length).toBe(2);
      expect(data.total).toBe(2);
    });

    it("should categorize settings by type", async () => {
      const data = await sendRequest("worldsetting.list", {}) as {
        worldSettings: Array<{ category: string; name: string }>;
      };
      const categories = data.worldSettings.map((ws) => ws.category);
      expect(categories).toContain("location");
      expect(categories).toContain("organization");
    });

    it("should return settings with name and description for card rendering", async () => {
      const data = await sendRequest("worldsetting.list", {}) as {
        worldSettings: Array<{ name: string; description?: string; category: string }>;
      };
      const location = data.worldSettings.find((ws) => ws.category === "location");
      expect(location).toBeDefined();
      expect(location!.name).toBe("新地平线空间站");
      expect(location!.description).toContain("废弃空间站");

      const org = data.worldSettings.find((ws) => ws.category === "organization");
      expect(org).toBeDefined();
      expect(org!.name).toBe("星际联盟");
    });

    it("should include details object for extended info", async () => {
      const data = await sendRequest("worldsetting.list", {}) as {
        worldSettings: Array<{ name: string; details?: Record<string, unknown> }>;
      };
      const station = data.worldSettings.find((ws) => ws.name === "新地平线空间站");
      expect(station?.details).toBeDefined();
      expect(station?.details?.population).toBe(5000);
    });
  });

  describe("Cross-page Data Consistency", () => {
    it("should share same project across all pages", async () => {
      const projRes = await sendRequest(ProjectAction.LIST, {}) as { projects: Array<{ id: string }> };
      const projId = projRes.projects[0].id;

      const chapRes = await sendRequest(ChapterAction.LIST, { projectId: projId }) as { chapters: Array<{ projectId: string }> };
      chapRes.chapters.forEach((ch) => expect(ch.projectId).toBe(projId));

      const charRes = await sendRequest(CharacterAction.LIST, { projectId: projId }) as { characters: Array<{ projectId: string }> };
      charRes.characters.forEach((ch) => expect(ch.projectId).toBe(projId));
    });

    it("should support full page navigation simulation", async () => {
      const pageSequence = [
        { action: SystemAction.HEALTH_CHECK, payload: {} },
        { action: ProjectAction.LIST, payload: {} },
        { action: CharacterAction.LIST, payload: {} },
        { action: ChapterAction.LIST, payload: {} },
        { action: "worldsetting.list", payload: {} },
      ];

      const results = [];
      for (const req of pageSequence) {
        const data = await sendRequest(req.action, req.payload);
        results.push({ action: req.action, hasData: data !== undefined && data !== null });
      }

      results.forEach((r) => expect(r.hasData).toBe(true));
    });
  });
});
