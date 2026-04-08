/**
 * T-POC-008: End-to-End IPC Communication Integration Test
 *
 * Verifies the complete dual-end communication pipeline:
 * Webview IPC Request → MessageRouter → MockStore Handler → IPCResponse → Frontend Rendering
 *
 * Test scenarios:
 * 1. Health check roundtrip with mock stats
 * 2. Project list retrieval and rendering data format
 * 3. Chapter/Character list by project ID
 * 4. Full dashboard initialization flow
 * 5. Error handling for invalid requests
 * 6. Response format compatibility with webview frontend
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MessageRouter } from "../core/message-router";
import { initializeMockStore, mockStore } from "../core/mock-store";
import type { IPCRequest, IPCResponse } from "../types/ipc-protocol";
import {
  SystemAction,
  ProjectAction,
  ChapterAction,
  CharacterAction,
  ErrorCode,
  createRequest,
  isSuccessResponse,
  isErrorResponse,
} from "../types/ipc-protocol";

describe("T-POC-008: End-to-End IPC Communication", () => {
  let router: MessageRouter;

  beforeEach(() => {
    mockStore.reset();
    router = new MessageRouter({ debug: false, strictMode: false });
    registerAllHandlers(router);
  });

  function registerAllHandlers(r: MessageRouter): void {
    r.on(SystemAction.HEALTH_CHECK, () => ({
      status: "ok",
      version: "0.1.0",
      mockStats: mockStore.getStats(),
      timestamp: new Date().toISOString(),
    }));

    r.on(SystemAction.GET_CONFIG, () => ({
      mockMode: true,
      features: {
        aiChat: false,
        outlineEditor: true,
        characterManagement: true,
        worldBuilding: true,
      },
    }));

    r.on(ProjectAction.LIST, () => {
      const projects = mockStore.getProjects();
      return { projects, total: projects.length };
    });

    r.on(ProjectAction.GET, (request) => {
      const payload = request.payload as { id?: string };
      const id = payload?.id;
      if (!id) throw new Error("Project ID is required");
      const project = mockStore.getProjectById(id);
      if (!project) throw new Error("Project not found");
      return project;
    });

    r.on(ProjectAction.CREATE, (request) => {
      const payload = request.payload as {
        name?: string;
        description?: string;
        genre?: string;
      };
      if (!payload.name) throw new Error("Project name is required");
      const project = mockStore.createProject({
        name: payload.name,
        description: payload.description,
        genre: payload.genre,
        status: "draft",
      });
      return project;
    });

    r.on(ChapterAction.LIST, (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;
      if (!projectId) throw new Error("No project available");
      const chapters = mockStore.getChaptersByProject(projectId);
      return { chapters, total: chapters.length };
    });

    r.on(ChapterAction.GET, (request) => {
      const payload = request.payload as { id?: string };
      const id = payload?.id;
      if (!id) throw new Error("Chapter ID is required");
      const chapter = mockStore.getChapterById(id);
      if (!chapter) throw new Error("Chapter not found");
      return chapter;
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

    r.on("outline.list", (request) => {
      const payload = request.payload as { projectId?: string };
      const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;
      if (!projectId) throw new Error("No project available");
      const nodes = mockStore.getOutlineByProject(projectId);
      return { nodes, total: nodes.length };
    });
  }

  // ============================================================
  // Scenario 1: Health Check Roundtrip
  // ============================================================

  describe("Scenario 1: Health Check Roundtrip", () => {
    it("should return success status on health check", async () => {
      const request = createRequest("hc-1", SystemAction.HEALTH_CHECK, {});
      const response = await router.processMessage(request);

      expect(response.status).toBe("success");
      expect(isSuccessResponse(response)).toBe(true);
    });

    it("should include mock store statistics in health check", async () => {
      const request = createRequest("hc-2", SystemAction.HEALTH_CHECK, {});
      const response = await router.processMessage(request);

      if (isSuccessResponse(response)) {
        const data = response.data as Record<string, unknown>;
        expect(data.status).toBe("ok");
        expect(data.version).toBe("0.1.0");

        const stats = data.mockStats as Record<string, number>;
        expect(stats.projects).toBeGreaterThan(0);
        expect(stats.chapters).toBeGreaterThan(0);
        expect(stats.characters).toBeGreaterThan(0);
      }
    });

    it("should preserve request ID in response", async () => {
      const request = createRequest("test-id-123", SystemAction.HEALTH_CHECK, {});
      const response = await router.processMessage(request);

      expect(response.id).toBe("test-id-123");
    });
  });

  // ============================================================
  // Scenario 2: Project List - Core Dashboard Data
  // ============================================================

  describe("Scenario 2: Project List Retrieval", () => {
    it("should return seeded mock projects", async () => {
      const request = createRequest("pl-1", ProjectAction.LIST, {});
      const response = await router.processMessage(request);

      expect(isSuccessResponse(response)).toBe(true);

      if (isSuccessResponse(response)) {
        const data = response.data as { projects: unknown[]; total: number };
        expect(data.projects.length).toBeGreaterThan(0);
        expect(data.total).toBe(data.projects.length);
        expect(data.total).toBe(1);
      }
    });

    it("should return project with expected fields for rendering", async () => {
      const request = createRequest("pl-2", ProjectAction.LIST, {});
      const response = await router.processMessage(request);

      if (isSuccessResponse(response)) {
        const data = response.data as {
          projects: Array<{
            id: string;
            name: string;
            description?: string;
            genre?: string;
            status: string;
          }>;
          total: number;
        };

        const project = data.projects[0];
        expect(project).toHaveProperty("id");
        expect(project).toHaveProperty("name");
        expect(project).toHaveProperty("status");
        expect(typeof project.id).toBe("string");
        expect(typeof project.name).toBe("string");

        expect(project.name).toContain("星际迷途");
      }
    });

    it("should support project detail retrieval by ID", async () => {
      const listReq = createRequest("pl-3", ProjectAction.LIST, {});
      const listRes = await router.processMessage(listReq);

      if (isSuccessResponse(listRes)) {
        const projects = (listRes.data as { projects: Array<{ id: string }> }).projects;
        const projectId = projects[0].id;

        const getReq = createRequest("pg-1", ProjectAction.GET, { id: projectId });
        const getRes = await router.processMessage(getReq);

        expect(isSuccessResponse(getRes)).toBe(true);
        if (isSuccessResponse(getRes)) {
          const project = getRes.data as { name: string; description?: string };
          expect(project.name).toBe("星际迷途：归乡");
          expect(project.description).toContain("科幻");
        }
      }
    });

    it("should return error for non-existent project ID", async () => {
      const request = createRequest("pg-2", ProjectAction.GET, { id: "non-existent" });
      const response = await router.processMessage(request);

      expect(isErrorResponse(response)).toBe(true);
      if (isErrorResponse(response)) {
        expect(response.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(response.error.message).toContain("not found");
      }
    });
  });

  // ============================================================
  // Scenario 3: Chapter & Character Lists (Related Entities)
  // ============================================================

  describe("Scenario 3: Related Entity Lists", () => {
    it("should return chapters for the default project", async () => {
      const request = createRequest("cl-1", ChapterAction.LIST, {});
      const response = await router.processMessage(request);

      expect(isSuccessResponse(response)).toBe(true);
      if (isSuccessResponse(response)) {
        const data = response.data as { chapters: unknown[]; total: number };
        expect(data.chapters.length).toBe(5);
        expect(data.total).toBe(5);
      }
    });

    it("should return characters for the default project", async () => {
      const request = createRequest("chl-1", CharacterAction.LIST, {});
      const response = await router.processMessage(request);

      expect(isSuccessResponse(response)).toBe(true);
      if (isSuccessResponse(response)) {
        const data = response.data as { characters: unknown[]; total: number };
        expect(data.characters.length).toBe(3);
        expect(data.total).toBe(3);
      }
    });

    it("should filter chapters by specific project ID", async () => {
      const listReq = createRequest("pl-4", ProjectAction.LIST, {});
      const listRes = await router.processMessage(listReq);

      if (isSuccessResponse(listRes)) {
        const projects = (listRes.data as { projects: Array<{ id: string }> }).projects;
        const projectId = projects[0].id;

        const chapReq = createRequest("cl-2", ChapterAction.LIST, { projectId });
        const chapRes = await router.processMessage(chapReq);

        expect(isSuccessResponse(chapRes)).toBe(true);
        if (isSuccessResponse(chapRes)) {
          const data = chapRes.data as { chapters: Array<{ projectId: string }>; total: number };
          data.chapters.forEach((ch) => {
            expect(ch.projectId).toBe(projectId);
          });
        }
      }
    });
  });

  // ============================================================
  // Scenario 4: Full Dashboard Initialization Flow
  // ============================================================

  describe("Scenario 4: Full Dashboard Flow (Webview Simulation)", () => {
    it("should complete the full dashboard loading sequence", async () => {
      const requestIdBase = "dash-";

      const healthCheckRequest: IPCRequest = {
        jsonrpc: "2.0",
        id: `${requestIdBase}hc`,
        action: SystemAction.HEALTH_CHECK,
        payload: {},
        timestamp: new Date().toISOString(),
      };

      const projectListRequest: IPCRequest = {
        jsonrpc: "2.0",
        id: `${requestIdBase}pl`,
        action: ProjectAction.LIST,
        payload: {},
        timestamp: new Date().toISOString(),
      };

      const hcResponse = await router.processMessage(healthCheckRequest);
      expect(isSuccessResponse(hcResponse)).toBe(true);

      const plResponse = await router.processMessage(projectListRequest);
      expect(isSuccessResponse(plResponse)).toBe(true);

      if (isSuccessResponse(plResponse)) {
        const data = plResponse.data as { projects: Array<{ name: string }>; total: number };
        expect(data.projects.length).toBeGreaterThan(0);
        expect(data.projects[0].name).toBe("星际迷途：归乡");
      }
    });

    it("should produce response format compatible with webview frontend", async () => {
      const request = createRequest("fmt-1", ProjectAction.LIST, {});
      const response = await router.processMessage(request);

      expect(response).toHaveProperty("jsonrpc", "2.0");
      expect(response).toHaveProperty("id");
      expect(response).toHaveProperty("status");
      expect(response).toHaveProperty("timestamp");

      if (isSuccessResponse(response)) {
        expect(response).toHaveProperty("data");
        const data = response.data as Record<string, unknown>;
        expect(data).toHaveProperty("projects");
        expect(data).toHaveProperty("total");
        expect(Array.isArray(data.projects)).toBe(true);
      }
    });

    it("should handle sequential requests correctly (simulating real webview)", async () => {
      const results: IPCResponse[] = [];

      const actions = [
        { action: SystemAction.HEALTH_CHECK, payload: {} },
        { action: ProjectAction.LIST, payload: {} },
        { action: ChapterAction.LIST, payload: {} },
        { action: CharacterAction.LIST, payload: {} },
      ];

      for (let i = 0; i < actions.length; i++) {
        const req = createRequest(`seq-${i}`, actions[i].action, actions[i].payload);
        const res = await router.processMessage(req);
        results.push(res);
      }

      expect(results.length).toBe(4);
      results.forEach((res) => {
        expect(isSuccessResponse(res)).toBe(true);
      });

      if (isSuccessResponse(results[1])) {
        const plData = results[1].data as { total: number };
        expect(plData.total).toBe(1);
      }

      if (isSuccessResponse(results[2])) {
        const clData = results[2].data as { total: number };
        expect(clData.total).toBe(5);
      }

      if (isSuccessResponse(results[3])) {
        const chlData = results[3].data as { total: number };
        expect(chlData.total).toBe(3);
      }
    });
  });

  // ============================================================
  // Scenario 5: Error Handling
  // ============================================================

  describe("Scenario 5: Error Handling & Edge Cases", () => {
    it("should return error for unknown action in strict mode", async () => {
      const strictRouter = new MessageRouter({ debug: false, strictMode: true });
      registerAllHandlers(strictRouter);

      const request = createRequest("err-1", "unknown.action", {});
      const response = await strictRouter.processMessage(request);

      expect(isErrorResponse(response)).toBe(true);
      if (isErrorResponse(response)) {
        expect(response.error.code).toBe(ErrorCode.METHOD_NOT_FOUND);
      }
    });

    it("should return error for unknown action in non-strict mode", async () => {
      const request = createRequest("err-2", "unknown.action", {});
      const response = await router.processMessage(request);

      expect(isErrorResponse(response)).toBe(true);
      if (isErrorResponse(response)) {
        expect(response.error.code).toBe(ErrorCode.METHOD_NOT_FOUND);
      }
    });

    it("should return error for malformed messages (missing jsonrpc)", async () => {
      const badMessage = { id: "bad-1", action: "project.list", payload: {} };
      const response = await router.processMessage(badMessage);

      expect(isErrorResponse(response)).toBe(true);
      if (isErrorResponse(response)) {
        expect(response.error.code).toBe(ErrorCode.INVALID_REQUEST);
      }
    });

    it("should return error for completely invalid input", async () => {
      const response = await router.processMessage(null);
      expect(isErrorResponse(response)).toBe(true);
      if (isErrorResponse(response)) {
        expect(response.error.code).toBe(ErrorCode.INVALID_REQUEST);
      }
    });

    it("should handle handler errors gracefully", async () => {
      const request = createRequest("err-3", ProjectAction.GET, {});
      const response = await router.processMessage(request);

      expect(isErrorResponse(response)).toBe(true);
      if (isErrorResponse(response)) {
        expect(response.error.message).toContain("required");
      }
    });

    it("should handle notifications (no id) without error", async () => {
      const notification = {
        jsonrpc: "2.0" as const,
        action: "system.healthCheck",
        payload: {},
        timestamp: new Date().toISOString(),
      };

      const response = await router.processMessage(notification);
      expect(isSuccessResponse(response)).toBe(true);
    });
  });

  // ============================================================
  // Scenario 6: Response Format Verification (Frontend Compatibility)
  // ============================================================

  describe("Scenario 6: Webview Frontend Compatibility", () => {
    it("should match expected sendMessage() -> resolve(data.data) contract", async () => {
      const request = createRequest("web-1", ProjectAction.LIST, {});
      const response = await router.processMessage(request);

      const frontendExpectation = {
        hasJsonrpc: response.jsonrpc === "2.0",
        hasId: typeof response.id === "string",
        isSuccess: response.status === "success",
        hasData: "data" in response,
        hasTimestamp: typeof response.timestamp === "string",
      };

      Object.values(frontendExpectation).forEach((val) => {
        expect(val).toBe(true);
      });
    });

    it("should provide renderable project card data", async () => {
      const request = createRequest("web-2", ProjectAction.LIST, {});
      const response = await router.processMessage(request);

      if (isSuccessResponse(response)) {
        const data = response.data as {
          projects: Array<{
            id: string;
            name: string;
            description?: string;
            createdAt: string;
            status: string;
          }>;
          total: number;
        };

        const project = data.projects[0];

        const renderableFields = {
          hasName: typeof project.name === "string" && project.name.length > 0,
          hasDescription: project.description !== undefined,
          hasCreatedAt: typeof project.createdAt === "string",
          hasStatus: typeof project.status === "string",
        };

        Object.values(renderableFields).forEach((val) => {
          expect(val).toBe(true);
        });
      }
    });

    it("should simulate the exact webview loadDashboard() flow", async () => {
      function simulateWebviewSendMessage(
        action: string,
        payload: unknown
      ): Promise<unknown> {
        return new Promise((resolve, reject) => {
          const id = `webview-${Date.now()}`;

          const ipcRequest: IPCRequest = {
            jsonrpc: "2.0",
            id,
            action,
            payload,
            timestamp: new Date().toISOString(),
          };

          router
            .processMessage(ipcRequest)
            .then((response) => {
              if (response.status === "success") {
                resolve((response as { data: unknown }).data);
              } else {
                reject(
                  new Error(
                    (response as { error: { message: string } }).error?.message ||
                      "Request failed"
                  )
                );
              }
            })
            .catch(reject);
        });
      }

      const healthData = await simulateWebviewSendMessage(
        SystemAction.HEALTH_CHECK,
        {}
      );
      expect(healthData).toBeDefined();
      expect((healthData as Record<string, unknown>).status).toBe("ok");

      const projectData = await simulateWebviewSendMessage(
        ProjectAction.LIST,
        {}
      );
      expect(projectData).toBeDefined();
      const pd = projectData as { projects: Array<{ name: string }>; total: number };
      expect(pd.projects.length).toBeGreaterThan(0);
      expect(pd.projects[0].name).toBe("星际迷途：归乡");
    });
  });
});
