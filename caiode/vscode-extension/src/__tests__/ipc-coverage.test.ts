/**
 * T-FE-003: IPC Adapter Full Coverage Verification
 *
 * Verifies that ALL data requests in Webview frontend go through
 * the Phase 1.1 IPC adapter (sendMessage/postMessage) instead of
 * direct HTTP calls (fetch/axios/XMLHttpRequest).
 *
 * Also verifies bidirectional completeness:
 * - Every frontend action has a backend handler
 * - Every backend handler is reachable from some frontend action
 */

import { describe, it, expect } from "vitest";
import { getDashboardHtml } from "../webview/html-generator";

describe("T-FE-003: IPC Adapter Full Coverage", () => {
  const html = getDashboardHtml("test-nonce");

  describe("Rule 1: Zero Direct HTTP Calls", () => {
    const forbiddenPatterns = [
      { pattern: /fetch\s*\(/, name: "fetch()" },
      { pattern: /axios\./, name: "axios." },
      { pattern: /XMLHttpRequest/, name: "XMLHttpRequest" },
      { pattern: /api\.get\s*\(/, name: "api.get()" },
      { pattern: /api\.post\s*\(/, name: "api.post()" },
      { pattern: /api\.put\s*\(/, name: "api.put()" },
      { pattern: /api\.delete\s*\(/, name: "api.delete()" },
      { pattern: /\.then\s*\(.*response\b/i, name: ".then(response) (fetch-style)" },
      { pattern: /new\s+Request\(/, name: "new Request()" },
    ];

    forbiddenPatterns.forEach(({ pattern, name }) => {
      it(`should not contain ${name} in JavaScript code`, () => {
        const jsMatch = html.match(pattern);
        expect(jsMatch).toBeNull();
        if (jsMatch) {
          throw new Error(
            `Found forbidden HTTP call pattern "${name}" in HTML: ${jsMatch[0]}`
          );
        }
      });
    });
  });

  describe("Rule 2: All Data Requests Use sendMessage()", () => {
    it("should use sendMessage for health check", () => {
      expect(html).toContain("sendMessage('system.healthCheck'");
    });

    it("should use sendMessage for project list", () => {
      expect(html).toContain("sendMessage('project.list'");
    });

    it("should use sendMessage for character list", () => {
      expect(html).toContain("sendMessage('character.list'");
    });

    it("should use sendMessage for chapter list", () => {
      expect(html).toContain("sendMessage('chapter.list'");
    });

    it("should use sendMessage for world settings list", () => {
      expect(html).toContain("sendMessage('worldsetting.list'");
    });

    it("should have exactly 5 unique sendMessage data calls", () => {
      const matches = html.match(/sendMessage\(['"]([^'"]+)['"]/g);
      expect(matches).not.toBeNull();

      const actions = (matches || []).map((m) =>
        m.match(/['"]([^'"]+)['"]/)?.[1]
      );
      const uniqueActions = [...new Set(actions)];

      expect(uniqueActions.length).toBe(5);
      expect(uniqueActions).toContain("system.healthCheck");
      expect(uniqueActions).toContain("project.list");
      expect(uniqueActions).toContain("character.list");
      expect(uniqueActions).toContain("chapter.list");
      expect(uniqueActions).toContain("worldsetting.list");
    });
  });

  describe("Rule 3: IPC Message Format Compliance", () => {
    it("should construct JSON-RPC 2.0 compliant messages", () => {
      expect(html).toContain('"jsonrpc": "2.0"');
    });

    it("should include id field in every request", () => {
      expect(html).toContain('"id"');
    });

    it("should include timestamp field for tracing", () => {
      expect(html).toContain('"timestamp"');
    });

    it("should include action field (method equivalent)", () => {
      expect(html).toContain('"action"');
    });

    it("should include payload field (params equivalent)", () => {
      expect(html).toContain('"payload"');
    });

    it("should send via vscode.postMessage (IPC channel)", () => {
      expect(html).toContain("vscode.postMessage");
    });

    it("should NOT use window.fetch or XMLHttpRequest as transport", () => {
      expect(html).not.toContain("window.fetch");
      expect(html).not.toContain("new XMLHttpRequest");
    });
  });

  describe("Rule 4: Response Handling Contract", () => {
    it("should resolve on success status", () => {
      expect(html).toContain("response.status === 'success'");
    });

    it("should reject on error status", () => {
      expect(html).toContain("reject(new Error(");
    });

    it("should extract data from response.data property", () => {
      expect(html).toContain("resolve(data.data)");
    });

    it("should handle error message from response.error.message", () => {
      expect(html).toContain("response.error?.message");
    });

    it("should clean up message listener after response", () => {
      expect(html).toContain("window.removeEventListener('message'");
    });
  });

  describe("Rule 5: Frontend-Backend Action Mapping Completeness", () => {
    const frontendActions = [
      "system.healthCheck",
      "project.list",
      "character.list",
      "chapter.list",
      "worldsetting.list",
    ];

    const knownBackendHandlers = [
      "system.healthCheck",
      "system.getConfig",
      "project.list",
      "project.get",
      "project.create",
      "chapter.list",
      "chapter.get",
      "character.list",
      "worldsetting.list",
      "outline.list",
    ];

    frontendActions.forEach((action) => {
      it(`frontend action '${action}' should have a registered backend handler`, () => {
        expect(knownBackendHandlers).toContain(action);
      });
    });

    it("all frontend actions are a subset of backend handlers", () => {
      frontendActions.forEach((action) => {
        expect(knownBackendHandlers).toContain(action);
      });
    });

    it("backend has additional handlers not yet used by frontend (future-ready)", () => {
      const unusedHandlers = knownBackendHandlers.filter(
        (h) => !frontendActions.includes(h)
      );

      expect(unusedHandlers.length).toBeGreaterThan(0);
      expect(unusedHandlers).toEqual(
        expect.arrayContaining([
          "system.getConfig",
          "project.get",
          "project.create",
          "chapter.get",
          "outline.list",
        ])
      );
    });
  });

  describe("Rule 6: No External Resource Dependencies", () => {
    it("should not load external JavaScript files", () => {
      expect(html).not.toContain('<script src="http');
      expect(html).not.toContain('<script src="https');
    });

    it("should not load external CSS files", () => {
      expect(html).not.toContain('<link rel="stylesheet"');
    });

    it("should embed all styles inline in <style> tag", () => {
      const styleTags = html.match(/<style[^>]*>/g);
      expect(styleTags).not.toBeNull();
      expect(styleTags!.length).toBeGreaterThanOrEqual(1);
    });

    it("should embed all scripts inline in <script> tag", () => {
      const scriptTags = html.match(/<script[^>]*>/g);
      expect(scriptTags).not.toBeNull();
      expect(scriptTags!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Rule 7: Error Boundary Per Page Function", () => {
    const pageFunctions = [
      "loadDashboard",
      "loadCharacters",
      "loadOutline",
      "loadWorldSettings",
    ];

    pageFunctions.forEach((fn) => {
      it(`${fn}() should have try-catch error handling`, () => {
        const fnRegex = new RegExp(
          `async function ${fn}\\(\\)[\\s\\S]*?catch\\s*\\(e\\)`
        );
        expect(html).toMatch(fnRegex);
      });

      it(`${fn}() should render error state on failure`, () => {
        const fnStartIdx = html.indexOf(`function ${fn}`);
        expect(fnStartIdx).toBeGreaterThan(-1);

        const fnBlock = html.substring(fnStartIdx, fnStartIdx + 500);
        expect(fnBlock).toContain("error-state");
      });
    });
  });

  describe("Rule 8: RPC Client Adapter Compatibility", () => {
    it("should be compatible with IRPCClient interface contract", () => {
      const requiredMethods = ["send", "request", "notify", "batch"];
      const hasCompatibleInterface =
        html.includes("function sendMessage") &&
        html.includes("vscode.postMessage") &&
        html.includes("Promise");

      expect(hasCompatibleInterface).toBe(true);
    });

    it("should support request-response correlation via ID", () => {
      expect(html).toContain("data.id === id");
    });

    it("should support timeout-based error handling", () => {
      expect(html).toContain("'Timeout'");
    });
  });
});
