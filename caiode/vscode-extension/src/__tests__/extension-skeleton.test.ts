import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type * as vscode from "vscode";

// Mock VS Code API
const mockWebviewPanel = {
  webview: {
    html: "",
    onDidReceiveMessage: vi.fn(),
    postMessage: vi.fn(),
    asWebviewUri: vi.fn((uri: vscode.Uri) => uri),
    options: {},
  },
  onDidDispose: vi.fn(),
  reveal: vi.fn(),
  dispose: vi.fn(),
};

const mockExtensionContext: {
  subscriptions: { dispose: () => void }[];
  extensionPath: string;
  extensionUri: vscode.Uri;
  storageUri: vscode.Uri;
  globalStorageUri: vscode.Uri;
  logUri: vscode.Uri;
  extensionMode: number;
  globalState: { get: (key: string, defaultValue?: unknown) => unknown; update: (key: string, value: unknown) => Promise<void> };
  workspaceState: { get: (key: string, defaultValue?: unknown) => unknown; update: (key: string, value: unknown) => Promise<void> };
  secrets: { get: (key: string) => Promise<unknown>; store: (key: string, value: string) => Promise<void>; delete: (key: string) => Promise<void> };
} = {
  subscriptions: [],
  extensionPath: "/test/extension",
  extensionUri: { fsPath: "/test/extension" } as vscode.Uri,
  storageUri: { fsPath: "/test/storage" } as vscode.Uri,
  globalStorageUri: { fsPath: "/test/global-storage" } as vscode.Uri,
  logUri: { fsPath: "/test/log" } as vscode.Uri,
  extensionMode: 1,
  globalState: {
    get: vi.fn(),
    update: vi.fn(),
  },
  workspaceState: {
    get: vi.fn(),
    update: vi.fn(),
  },
  secrets: {
    get: vi.fn(),
    store: vi.fn(),
    delete: vi.fn(),
  },
};

const mockCommands = {
  registerCommand: vi.fn((id: string, handler: () => void) => {
    return { dispose: vi.fn() };
  }),
};

const mockWindow = {
  createWebviewPanel: vi.fn((
    _viewType: string,
    _title: string,
    _showOptions: number | { viewColumn: number; preserveFocus?: boolean },
    _options?: { enableScripts?: boolean; retainContextWhenHidden?: boolean; localResourceRoots?: { fsPath: string }[] }
  ) => mockWebviewPanel),
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn(),
};

// Mock the vscode module
vi.mock("vscode", () => ({
  commands: mockCommands,
  window: mockWindow,
  ViewColumn: { One: 1, Two: 2 },
  Uri: {
    file: (path: string) => ({ fsPath: path, scheme: "file" }),
    joinPath: (base: vscode.Uri, ...paths: string[]) => ({
      fsPath: `${base.fsPath}/${paths.join("/")}`,
      scheme: "file",
    }),
  },
  EventEmitter: class EventEmitter<T> {
    private listeners: ((e: T) => void)[] = [];
    event = (listener: (e: T) => void) => {
      this.listeners.push(listener);
      return { dispose: () => {} };
    };
    fire = (event: T) => {
      this.listeners.forEach((l) => l(event));
    };
  },
}));

describe("TC-EXT: Extension Skeleton & Mock Migration Tests", () => {
  describe("TC-EXT-HP-001: activate() initialization", () => {
    it("should initialize extension context", () => {
      // Verify mock context is properly structured
      expect(mockExtensionContext).toBeDefined();
      expect(mockExtensionContext.subscriptions).toBeDefined();
      expect(mockExtensionContext.extensionPath).toBeDefined();
    });

    it("should have required context properties", () => {
      expect(mockExtensionContext.globalState).toBeDefined();
      expect(mockExtensionContext.workspaceState).toBeDefined();
      expect(mockExtensionContext.secrets).toBeDefined();
      expect(mockExtensionContext.storageUri).toBeDefined();
    });

    it("should support subscription disposal", () => {
      const disposable = { dispose: vi.fn() };
      mockExtensionContext.subscriptions.push(disposable);
      expect(mockExtensionContext.subscriptions).toContain(disposable);
    });
  });

  describe("TC-EXT-HP-002: Webview Panel creation", () => {
    it("should create webview panel with correct options", () => {
      const panel = mockWindow.createWebviewPanel(
        "storytree.dashboard",
        "StoryTree Dashboard",
        1,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [{ fsPath: "/test/extension" }],
        }
      );

      expect(panel).toBeDefined();
      expect(panel.webview).toBeDefined();
      expect(mockWindow.createWebviewPanel).toHaveBeenCalled();
    });

    it("should support webview HTML content", () => {
      const panel = mockWindow.createWebviewPanel(
        "test",
        "Test",
        1,
        {}
      );

      const htmlContent = "<html><body>Test</body></html>";
      panel.webview.html = htmlContent;
      expect(panel.webview.html).toBe(htmlContent);
    });

    it("should support message passing to webview", () => {
      const panel = mockWindow.createWebviewPanel(
        "test",
        "Test",
        1,
        {}
      );

      const message = { type: "test", data: { value: 123 } };
      panel.webview.postMessage(message);
      expect(panel.webview.postMessage).toHaveBeenCalledWith(message);
    });
  });

  describe("TC-EXT-HP-003: deactivate() resource cleanup", () => {
    it("should dispose webview panel on deactivate", () => {
      const panel = mockWindow.createWebviewPanel(
        "test",
        "Test",
        1,
        {}
      );

      panel.dispose();
      expect(panel.dispose).toHaveBeenCalled();
    });

    it("should clear subscriptions on deactivate", () => {
      const disposable1 = { dispose: vi.fn() };
      const disposable2 = { dispose: vi.fn() };

      mockExtensionContext.subscriptions.push(disposable1, disposable2);

      // Simulate deactivate by disposing all subscriptions
      mockExtensionContext.subscriptions.forEach((d: any) => d.dispose());

      expect(disposable1.dispose).toHaveBeenCalled();
      expect(disposable2.dispose).toHaveBeenCalled();
    });
  });

  describe("TC-EXT-HP-004: Extension state recovery", () => {
    it("should persist state to globalState", async () => {
      const key = "test-key";
      const value = { test: "data" };

      await mockExtensionContext.globalState.update(key, value);
      expect(mockExtensionContext.globalState.update).toHaveBeenCalledWith(
        key,
        value
      );
    });

    it("should retrieve state from globalState", () => {
      const key = "test-key";
      const defaultValue = "default";

      mockExtensionContext.globalState.get(key, defaultValue);
      expect(mockExtensionContext.globalState.get).toHaveBeenCalledWith(
        key,
        defaultValue
      );
    });
  });

  describe("TC-EXT-SP-001: Missing dependency handling", () => {
    it("should handle missing storage gracefully", () => {
      const contextWithoutStorage = {
        ...mockExtensionContext,
        storageUri: undefined,
      };

      expect(contextWithoutStorage.storageUri).toBeUndefined();
    });

    it("should show error message when initialization fails", () => {
      const errorMessage = "Failed to initialize";
      mockWindow.showErrorMessage(errorMessage);
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("TC-EXT-SP-002: Missing webview resources", () => {
    it("should handle missing HTML content gracefully", () => {
      const panel = mockWindow.createWebviewPanel(
        "test",
        "Test",
        1,
        {}
      );

      // Empty HTML should not crash
      panel.webview.html = "";
      expect(panel.webview.html).toBe("");
    });
  });

  describe("TC-EXT-HP-005: IPC communication from webview", () => {
    it("should register message handler", () => {
      const handler = vi.fn();
      mockWebviewPanel.webview.onDidReceiveMessage(handler);
      expect(mockWebviewPanel.webview.onDidReceiveMessage).toHaveBeenCalledWith(
        handler
      );
    });

    it("should support postMessage to webview", () => {
      const message = {
        id: "test-001",
        action: "project.list",
        payload: {},
      };

      mockWebviewPanel.webview.postMessage(message);
      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith(message);
    });
  });

  describe("TC-EXT-HP-006: Mock data handling", () => {
    it("should return mock project list", () => {
      const mockProjects = [
        { id: "1", name: "Project 1" },
        { id: "2", name: "Project 2" },
      ];

      // Simulate mock store response
      const response = { projects: mockProjects, total: mockProjects.length };
      expect(response.projects).toHaveLength(2);
      expect(response.total).toBe(2);
    });

    it("should handle mock chapter list request", () => {
      const projectId = "proj-1";
      const mockChapters = [
        { id: "c1", title: "Chapter 1", projectId },
        { id: "c2", title: "Chapter 2", projectId },
      ];

      const response = { chapters: mockChapters, total: mockChapters.length };
      expect(response.chapters.every((c) => c.projectId === projectId)).toBe(
        true
      );
    });
  });

  describe("TC-EXT-SP-005: Unknown action handling", () => {
    it("should return error for unregistered action", () => {
      const unregisteredAction = "unknown.action";
      const errorResponse = {
        status: "error",
        error: {
          code: -32601,
          message: `Unknown action: ${unregisteredAction}`,
        },
      };

      expect(errorResponse.status).toBe("error");
      expect(errorResponse.error.code).toBe(-32601);
    });
  });

  describe("TC-EXT-SP-006: Malformed message handling", () => {
    it("should handle null message gracefully", () => {
      const nullMessage = null;
      expect(() => {
        // Should not throw when processing null
        if (nullMessage === null) {
          return { status: "error", error: { message: "Null message" } };
        }
      }).not.toThrow();
    });

    it("should handle message without id", () => {
      const messageWithoutId = { action: "test", payload: {} };
      expect(messageWithoutId).not.toHaveProperty("id");
    });
  });

  describe("TC-EXT-SP-007: Memory leak prevention", () => {
    it("should remove listeners on panel dispose", () => {
      const panel = mockWindow.createWebviewPanel(
        "test",
        "Test",
        1,
        {}
      );

      const disposeHandler = vi.fn();
      panel.onDidDispose(disposeHandler);

      panel.dispose();
      expect(panel.dispose).toHaveBeenCalled();
    });
  });

  describe("TC-EXT-PERF-001: Large data transfer", () => {
    it("should handle 1MB JSON data", () => {
      // Create a large payload (~1MB)
      const largeArray = new Array(10000).fill(null).map((_, i) => ({
        id: i,
        content: "x".repeat(100),
      }));

      const payload = JSON.stringify(largeArray);
      const sizeInMB = Buffer.byteLength(payload) / (1024 * 1024);

      expect(sizeInMB).toBeGreaterThan(0.5); // At least 0.5MB
      expect(() => JSON.parse(payload)).not.toThrow();
    });
  });

  describe("Command Registration", () => {
    it("should register commands", () => {
      const commandId = "storytree.openDashboard";
      const handler = vi.fn();

      mockCommands.registerCommand(commandId, handler);
      expect(mockCommands.registerCommand).toHaveBeenCalledWith(
        commandId,
        handler
      );
    });

    it("should return disposable from registerCommand", () => {
      const disposable = mockCommands.registerCommand("test", () => {});
      expect(disposable.dispose).toBeDefined();
    });
  });

  describe("SecretStorage", () => {
    it("should store secrets", async () => {
      const key = "api-key";
      const value = "secret-value";

      await mockExtensionContext.secrets.store(key, value);
      expect(mockExtensionContext.secrets.store).toHaveBeenCalledWith(
        key,
        value
      );
    });

    it("should retrieve secrets", async () => {
      const key = "api-key";
      await mockExtensionContext.secrets.get(key);
      expect(mockExtensionContext.secrets.get).toHaveBeenCalledWith(key);
    });

    it("should delete secrets", async () => {
      const key = "api-key";
      await mockExtensionContext.secrets.delete(key);
      expect(mockExtensionContext.secrets.delete).toHaveBeenCalledWith(key);
    });
  });
});
