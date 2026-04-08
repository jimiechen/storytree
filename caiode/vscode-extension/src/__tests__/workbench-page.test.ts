import { describe, it, expect } from "vitest";
import { getWorkbenchHtml } from "../webview/workbench-page";

describe("WorkbenchPage HTML Generator", () => {
  let html: string;

  beforeEach(() => {
    html = getWorkbenchHtml("test-nonce-123");
  });

  describe("HTML Structure", () => {
    it("should be valid HTML with DOCTYPE", () => {
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("should have proper charset and viewport meta tags", () => {
      expect(html).toContain('charset="UTF-8"');
      expect(html).toContain("viewport");
    });

    it("should include nonce in CSP context", () => {
      expect(html).toContain("test-nonce-123");
    });
  });

  describe("Header Section", () => {
    it("should contain workbench header with title input", () => {
      expect(html).toContain("workbench-header");
      expect(html).toContain("chapter-title-input");
      expect(html).toContain("id=\"chapterTitle\"");
    });

    it("should display word count and save status in header right area", () => {
      expect(html).toContain("wordCountDisplay");
      expect(html).toContain("saveStatus");
      expect(html).toContain("save-dot");
    });

    it("should have placeholder text for untitled chapter", () => {
      expect(html).toContain("placeholder=\"Chapter Title\"");
    });
  });

  describe("Editor Area (Main Content)", () => {
    it("should have contenteditable editor container", () => {
      expect(html).toContain("contenteditable=\"true\"");
      expect(html).toContain("editor-content");
      expect(html).toContain("editor-container");
    });

    it("should show placeholder text when editor is empty", () => {
      expect(html).toContain("Start writing your story...");
    });

    it("should include formatting toolbar with bold/italic/underline buttons", () => {
      expect(html).toContain("data-cmd=\"bold\"");
      expect(html).toContain("data-cmd=\"italic\"");
      expect(html).toContain("data-cmd=\"underline\"");
    });

    it("should include heading level buttons (H1, H2, H3)", () => {
      expect(html).toContain("data-cmd=\"h1\"");
      expect(html).toContain("data-cmd=\"h2\"");
      expect(html).toContain("data-cmd=\"h3\"");
    });

    it("should include blockquote and list buttons", () => {
      expect(html).toContain("data-cmd=\"quote\"");
      expect(html).toContain("data-cmd=\"ul\"");
      expect(html).toContain("data-cmd=\"ol\"");
    });

    it("should have editor footer with save indicator and last-saved time", () => {
      expect(html).toContain("editor-footer");
      expect(html).toContain("save-indicator");
      expect(html).toContain("All changes saved");
    });
  });

  describe("Left Sidebar (Chapter Navigation)", () => {
    it("should have left sidebar with chapter list", () => {
      expect(html).toContain("sidebar-left");
      expect(html).toContain("chapter-list");
      expect(html).toContain("Chapters");
    });

    it("should have 'New Chapter' button", () => {
      expect(html).toContain("addChapterBtn");
      expect(html).toContain("+ New Chapter");
    });

    it("should display chapter items with title and word count", () => {
      expect(html).toContain("chapter-item");
      expect(html).toContain("chapter-item-num");
    });
  });

  describe("Right Sidebar (AI Assistant Panel)", () => {
    it("should have AI panel header with status indicator", () => {
      expect(html).toContain("sidebar-right");
      expect(html).toContain("ai-panel-header");
      expect(html).toContain("aiStatusDot");
      expect(html).toContain("AI Assistant");
    });

    it("should have quick action buttons for common AI operations", () => {
      expect(html).toContain("quickActions");
      expect(html).toContain("data-action=\"continue\"");
      expect(html).toContain("data-action=\"polish\"");
      expect(html).toContain("data-action=\"expand\"");
      expect(html).toContain("data-action=\"summarize\"");
    });

    it("should have chat messages area", () => {
      expect(html).toContain("chat-messages");
    });

    it("should have chat input area with send button", () => {
      expect(html).toContain("chat-input-area");
      expect(html).toContain("chatInput");
      expect(html).toContain("chatSendBtn");
      expect(html).toContain("Send");
      expect(html).toContain("placeholder=\"Ask AI about this chapter...\"");
    });

    it("should support Shift+Enter for new line and Enter to send", () => {
      const scriptMatch = html.match(/e\.key === "Enter"/);
      expect(scriptMatch).not.toBeNull();
    });
  });

  describe("IPC Communication", () => {
    it("should call acquireVsCodeApi() for IPC bridge", () => {
      expect(html).toContain("acquireVsCodeApi()");
    });

    it("should send system.ready message on load", () => {
      expect(html).toContain('"system.ready"');
    });

    it("should send chapter.updateContent on auto-save (debounced 500ms)", () => {
      expect(html).toContain('"chapter.updateContent"');
      expect(html).toContain("500");
    });

    it("should send chapter.select when clicking a chapter item", () => {
      expect(html).toContain('"chapter.select"');
    });

    it("should send project.createChapter when clicking add chapter button", () => {
      expect(html).toContain('"project.createChapter"');
    });

    it("should send chapter.rename when title changes", () => {
      expect(html).toContain('"chapter.rename"');
    });

    it("should send ai.chat message on user chat submit", () => {
      expect(html).toContain('"ai.chat"');
    });

    it("should send ai.quickAction for quick action buttons", () => {
      expect(html).toContain('"ai.quickAction"');
    });

    it("should handle data-push events for chapters, content, ai_response, ai_stream", () => {
      expect(html).toContain('"data-push"');
      expect(html).toContain("chapters");
      expect(html).toContain("chapter_content");
      expect(html).toContain("ai_response");
      expect(html).toContain("ai_stream_chunk");
      expect(html).toContain("ai_stream_done");
    });
  });

  describe("Auto-save Behavior", () => {
    it("should debounce saves at 500ms interval", () => {
      const match = html.match(/setTimeout\(\(\) => \{/, "g");
      expect(match).not.toBeNull();
      const timeoutMatch = html.match(/500/g);
      expect(timeoutMatch).toBeTruthy();
    });

    it("should show saving state during auto-save", () => {
      expect(html).toContain("saving");
      expect(html).toContain("Saving...");
    });

    it("should update save status back to saved after completion", () => {
      expect(html).toContain("All changes saved");
    });
  });

  describe("Word Count Tracking", () => {
    it("should define updateWordCount function", () => {
      expect(html).toContain("updateWordCount");
    });

    it("should count words by splitting on whitespace", () => {
      expect(html).toContain("split(\\\\s+)");
    });

    it("should update display format as 'N words | N chars'", () => {
      expect(html).toContain("words | ");
      expect(html).toContain("chars");
    });
  });

  describe("XSS Prevention", () => {
    it("should use nonce-based script security", () => {
      expect(html).toContain('nonce="${nonce}"');
    });

    it("should not contain any external script sources", () => {
      expect(html).not.toContain("<script src=");
      expect(html).not.toContain("http://cdn.");
    });
  });

  describe("CSS Architecture", () => {
    it("should use VS Code CSS variables for theming", () => {
      expect(html).toContain("--vscode-editor-background");
      expect(html).toContain("--vscode-editor-foreground");
      expect(html).toContain("--vscode-button-background");
      expect(html).toContain("--vscode-sideBar-background");
      expect(html).toContain("--vscode-panel-border");
    });

    it("should be fully responsive with flex layout", () => {
      expect(html).toContain("display: flex");
      expect(html).toContain("overflow: hidden");
      expect(html).toContain("height: 100vh");
    });

    it("should style scrollbars with webkit prefix", () => {
      expect(html).toContain("-webkit-scrollbar");
    });
  });
});
