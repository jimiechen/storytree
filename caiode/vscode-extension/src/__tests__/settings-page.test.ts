import { describe, it, expect } from "vitest";
import { getSettingsHtml } from "../webview/settings-page";

describe("SettingsPage HTML Generator", () => {
  let html: string;

  beforeEach(() => {
    html = getSettingsHtml("settings-nonce-456");
  });

  describe("HTML Structure", () => {
    it("should be valid HTML with DOCTYPE", () => {
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("should have proper title", () => {
      expect(html).toContain("<title>StoryTree - Settings</title>");
    });

    it("should include nonce for script security", () => {
      expect(html).toContain("settings-nonce-456");
    });
  });

  describe("AI Provider Configuration Section", () => {
    it("should have AI provider section with select dropdown", () => {
      expect(html).toContain("aiSection");
      expect(html).toContain("providerSelect");
      expect(html).toContain('option value="openai"');
      expect(html).toContain('option value="anthropic"');
      expect(html).toContain('option value="ollama"');
      expect(html).toContain('option value="custom"');
    });

    it("should have API Key input field (hidden by default)", () => {
      expect(html).toContain("apiKeyInput");
      expect(html).toContain("apiKeyRow");
      expect(html).toContain("type=\"password\"");
    });

    it("should have Base URL input field (hidden by default)", () => {
      expect(html).toContain("baseUrlInput");
      expect(html).toContain("baseUrlRow");
    });

    it("should have model selector (hidden by default)", () => {
      expect(html).toContain("modelSelect");
      expect(html).toContain("modelRow");
    });

    it("should have test connection button", () => {
      expect(html).toContain("testApiKeyBtn");
      expect(html).toContain("Test Connection");
    });

    it("should have connection status indicator", () => {
      expect(html).toContain("connectionStatusRow");
      expect(html).toContain("connectionStatus");
      expect(html).toContain("statusDot");
      expect(html).toContain("statusText");
    });
  });

  describe("Editor Preferences Section", () => {
    it("should have theme selector with system/light/dark options", () => {
      expect(html).toContain("editorSection");
      expect(html).toContain("themeSelect");
      expect(html).toContain('value="system"');
      expect(html).toContain('value="light"');
      expect(html).toContain('value="dark"');
    });

    it("should have language selector with zh-CN and en-US", () => {
      expect(html).toContain("languageSelect");
      expect(html).toContain('value="zh-CN"');
      expect(html).toContain('value="en-US"');
    });

    it("should have auto-save interval selector with default 500ms", () => {
      expect(html).toContain("autoSaveSelect");
      expect(html).toContain('value="500"');
      expect(html).toContain('value="0"');
    });

    it("should have default word target input", () => {
      expect(html).toContain("wordTargetInput");
      expect(html).toContain("placeholder=\"2000\"");
    });
  });

  describe("Data Management Section", () => {
    it("should have export and import buttons", () => {
      expect(html).toContain("dataSection");
      expect(html).toContain("exportDataBtn");
      expect(html).toContain("importDataBtn");
      expect(html).toContain("Export All Data");
      expect(html).toContain("Import Data");
    });
  });

  describe("Danger Zone Section", () => {
    it("should have danger zone styling", () => {
      expect(html).toContain("danger-zone");
      expect(html).toContain("dangerZone");
    });

    it("should have reset and clear data buttons with danger style", () => {
      expect(html).toContain("resetSettingsBtn");
      expect(html).toContain("clearAllDataBtn");
      expect(html).toContain("btn-danger");
      expect(html).toContain("Reset to Defaults");
      expect(html).toContain("Delete All Projects & Data");
    });
  });

  describe("IPC Communication", () => {
    it("should call acquireVsCodeApi()", () => {
      expect(html).toContain("acquireVsCodeApi()");
    });

    it("should send settings.load on initialization", () => {
      expect(html).toContain('"settings.load"');
    });

    it("should send settings.update on save button click", () => {
      expect(html).toContain('"settings.update"');
    });

    it("should send settings.testAiConnection on test click", () => {
      expect(html).toContain('"settings.testAiConnection"');
    });

    it("should send settings.reset on reset click", () => {
      expect(html).toContain('"settings.reset"');
    });

    it("should send data.clearAll on clear all click", () => {
      expect(html).toContain('"data.clearAll"');
    });

    it("should send data.export on export click", () => {
      expect(html).toContain('"data.export"');
    });

    it("should handle data-push events for settings_loaded, ai_connection_result, export_done, import_done", () => {
      expect(html).toContain('"data-push"');
      expect(html).toContain("settings_loaded");
      expect(html).toContain("ai_connection_result");
      expect(html).toContain("export_done");
      expect(html).toContain("import_done");
    });
  });

  describe("Form Interaction Logic", () => {
    it("should show/hide API key row based on provider selection", () => {
      expect(html).toContain("apiKeyRow");
      const showApiCheck = html.match(/showApi\s*=\s*(openai|anthropic|custom)/);
      expect(showApiCheck).not.toBeNull();
    });

    it("should show/hide base URL row for ollama or custom providers", () => {
      const showBaseCheck = html.match(/showBase\s*=\s*(ollama|custom)/);
      expect(showBaseCheck).not.toBeNull();
    });

    it("should populate model dropdown based on provider selection", () => {
      expect(html).toContain("providerModels");
      expect(html).toContain("gpt-4o");
      expect(html).toContain("claude-sonnet");
      expect(html).toContain("qwen2.5:7b");
    });

    it("should support file import via hidden input element", () => {
      expect(html).toContain('type="file"');
      expect(html).toContain('.accept = ".json"');
      expect(html).toContain('"data.import"');
    });

    it("should display toast notifications for save success/error", () => {
      expect(html).toContain("toast");
      expect(html).toContain("showToast");
      expect(html).toContain("Settings saved successfully!");
    });

    it("should require double confirmation before clearing all data", () => {
      const confirms = html.match(/confirm\(/g) || [];
      expect(confirms.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("CSS Architecture", () => {
    it("should use VS Code CSS variables for theming", () => {
      expect(html).toContain("--vscode-editor-background");
      expect(html).toContain("--vscode-input-background");
      expect(html).toContain("--vscode-panel-border");
      expect(html).toContain("--vscode-button-background");
    });

    it("should style danger zone distinctly", () => {
      expect(html).toContain("--error-fg");
      expect(html).toContain("btn-danger");
    });

    it("should use status badges for connection state", () => {
      expect(html).toContain("status-badge");
      expect(html).toContain("connected");
      expect(html).toContain("disconnected");
    });
  });

  describe("XSS Prevention", () => {
    it("should use nonce-based script security", () => {
      expect(html).toContain('nonce="${nonce}"');
    });

    it("should not contain any external resources", () => {
      expect(html).not.toContain("<script src=");
      expect(html).not.toContain("<link rel=");
    });
  });
});
