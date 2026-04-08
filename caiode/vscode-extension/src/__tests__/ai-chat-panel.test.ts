import { describe, it, expect, beforeEach } from "vitest";
import {
  getAIChatPanelHtml,
  type AIChatPanelConfig,
  type ChatMessage,
} from "../webview/ai-chat-panel";

describe("AIChatPanel", () => {
  const mockNonce = "test-nonce-123";

  describe("HTML Structure", () => {
    it("should generate valid HTML document", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<html lang="zh-CN">');
      expect(html).toContain("</html>");
    });

    it("should include required meta tags", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    });

    it("should include CSP nonce in script tag", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain(`<script nonce="${mockNonce}">`);
    });
  });

  describe("Configuration Options", () => {
    it("should use default title when not specified", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain("<title>AI Assistant</title>");
      expect(html).toContain("AI Assistant");
    });

    it("should use custom title when specified", () => {
      const html = getAIChatPanelHtml({
        nonce: mockNonce,
        title: "StoryTree AI",
      });

      expect(html).toContain("<title>StoryTree AI</title>");
      expect(html).toContain("StoryTree AI");
    });

    it("should use default placeholder when not specified", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain('placeholder="Ask AI about this chapter..."');
    });

    it("should use custom placeholder when specified", () => {
      const html = getAIChatPanelHtml({
        nonce: mockNonce,
        placeholder: "Type your message...",
      });

      expect(html).toContain('placeholder="Type your message..."');
    });

    it("should show quick actions by default", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain('display: flex');
      expect(html).toContain('id="quickActions"');
    });

    it("should hide quick actions when showQuickActions is false", () => {
      const html = getAIChatPanelHtml({
        nonce: mockNonce,
        showQuickActions: false,
      });

      expect(html).toContain('display: none');
    });

    it("should show token count by default", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain('id="tokenCount"');
    });

    it("should hide token count when showTokenCount is false", () => {
      const html = getAIChatPanelHtml({
        nonce: mockNonce,
        showTokenCount: false,
      });

      expect(html).toContain('display: none');
    });

    it("should use default maxHeight", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).toContain("height: 100%");
    });

    it("should use custom maxHeight when specified", () => {
      const html = getAIChatPanelHtml({
        nonce: mockNonce,
        maxHeight: "500px",
      });

      expect(html).toContain("height: 500px");
    });
  });

  describe("UI Components", () => {
    let html: string;

    beforeEach(() => {
      html = getAIChatPanelHtml({ nonce: mockNonce });
    });

    it("should have header with title and status dot", () => {
      expect(html).toContain('class="ai-panel-header"');
      expect(html).toContain('class="ai-panel-title"');
      expect(html).toContain('id="aiStatusDot"');
      expect(html).toContain('class="ai-status-dot"');
    });

    it("should have header action buttons", () => {
      expect(html).toContain('id="clearBtn"');
      expect(html).toContain('id="settingsBtn"');
      expect(html).toContain('title="Clear conversation"');
      expect(html).toContain('title="AI Settings"');
    });

    it("should have quick action buttons", () => {
      expect(html).toContain('data-action="continue"');
      expect(html).toContain('data-action="polish"');
      expect(html).toContain('data-action="expand"');
      expect(html).toContain('data-action="summarize"');
      expect(html).toContain('data-action="rewrite"');
    });

    it("should have chat messages container", () => {
      expect(html).toContain('id="chatMessages"');
      expect(html).toContain('class="chat-messages"');
    });

    it("should have empty state", () => {
      expect(html).toContain('id="emptyState"');
      expect(html).toContain('class="empty-state"');
      expect(html).toContain("🤖");
    });

    it("should have error message container", () => {
      expect(html).toContain('id="errorMessage"');
      expect(html).toContain('class="error-message"');
    });

    it("should have input area with textarea", () => {
      expect(html).toContain('id="chatInput"');
      expect(html).toContain('class="chat-input"');
      expect(html).toContain("<textarea");
    });

    it("should have send and stop buttons", () => {
      expect(html).toContain('id="sendBtn"');
      expect(html).toContain('id="stopBtn"');
      expect(html).toContain('class="send-btn"');
      expect(html).toContain('class="stop-btn"');
    });
  });

  describe("CSS Styling", () => {
    let html: string;

    beforeEach(() => {
      html = getAIChatPanelHtml({ nonce: mockNonce });
    });

    it("should define CSS variables for theming", () => {
      expect(html).toContain("--bg:");
      expect(html).toContain("--fg:");
      expect(html).toContain("--border:");
      expect(html).toContain("--accent:");
      expect(html).toContain("--sidebar-bg:");
      expect(html).toContain("--input-bg:");
    });

    it("should have message bubble styles", () => {
      expect(html).toContain('class="chat-message"');
      expect(html).toContain('class="chat-message user"');
      expect(html).toContain('class="chat-message assistant"');
      expect(html).toContain('class="chat-message-content"');
    });

    it("should have avatar styles", () => {
      expect(html).toContain('class="chat-message-avatar"');
    });

    it("should have markdown content styles", () => {
      expect(html).toContain(".chat-message-content h1");
      expect(html).toContain(".chat-message-content code");
      expect(html).toContain(".chat-message-content pre");
      expect(html).toContain(".chat-message-content blockquote");
    });

    it("should have code block wrapper styles", () => {
      expect(html).toContain('class="code-block-wrapper"');
      expect(html).toContain('class="code-block-header"');
      expect(html).toContain('class="code-language"');
      expect(html).toContain('class="code-copy-btn"');
    });

    it("should have message action button styles", () => {
      expect(html).toContain('class="message-actions"');
      expect(html).toContain('class="message-action-btn"');
    });

    it("should have streaming animation styles", () => {
      expect(html).toContain("@keyframes blink");
      expect(html).toContain("@keyframes fadeIn");
      expect(html).toContain("@keyframes pulse");
    });
  });

  describe("JavaScript Functionality", () => {
    let html: string;

    beforeEach(() => {
      html = getAIChatPanelHtml({ nonce: mockNonce });
    });

    it("should include Markdown parser", () => {
      expect(html).toContain("const Markdown = {");
      expect(html).toContain("escape:");
      expect(html).toContain("parse:");
    });

    it("should handle code blocks in markdown", () => {
      expect(html).toContain("Code blocks");
      expect(html).toContain('class="code-block-wrapper"');
      expect(html).toContain('class="language-');
    });

    it("should handle inline code in markdown", () => {
      expect(html).toContain("Inline code");
    });

    it("should handle headers in markdown", () => {
      expect(html).toContain("Headers");
      expect(html).toContain("<h1>");
      expect(html).toContain("<h2>");
      expect(html).toContain("<h3>");
      expect(html).toContain("<h4>");
    });

    it("should handle bold and italic in markdown", () => {
      expect(html).toContain("Bold and italic");
      expect(html).toContain("<strong>");
      expect(html).toContain("<em>");
    });

    it("should handle links in markdown", () => {
      expect(html).toContain("Links");
      expect(html).toContain('<a href="');
    });

    it("should handle lists in markdown", () => {
      expect(html).toContain("Lists");
      expect(html).toContain("<li>");
      expect(html).toContain("<ul>");
    });

    it("should define message state management", () => {
      expect(html).toContain("let messages = []");
      expect(html).toContain("let isStreaming = false");
      expect(html).toContain("let currentStreamMessageId = null");
    });

    it("should define VS Code API integration", () => {
      expect(html).toContain("acquireVsCodeApi()");
      expect(html).toContain("vscode.postMessage");
    });

    it("should define utility functions", () => {
      expect(html).toContain("function generateId()");
      expect(html).toContain("function updateEmptyState()");
      expect(html).toContain("function updateTokenCount()");
      expect(html).toContain("function showError(");
      expect(html).toContain("function setAIStatus(");
    });

    it("should define message rendering functions", () => {
      expect(html).toContain("function createMessageElement(");
      expect(html).toContain("function renderMessage(");
      expect(html).toContain("function appendStreamChunk(");
      expect(html).toContain("function finalizeStream(");
    });

    it("should define action handlers", () => {
      expect(html).toContain("function handleMessageAction(");
      expect(html).toContain("case 'copy':");
      expect(html).toContain("case 'regenerate':");
      expect(html).toContain("case 'insert':");
    });

    it("should define send and stop functions", () => {
      expect(html).toContain("function sendToAI(");
      expect(html).toContain("function stopGeneration()");
    });

    it("should define event listeners", () => {
      expect(html).toContain("sendBtn.addEventListener('click'");
      expect(html).toContain("stopBtn.addEventListener('click'");
      expect(html).toContain("chatInput.addEventListener('keydown'");
      expect(html).toContain("chatInput.addEventListener('input'");
      expect(html).toContain("window.addEventListener('message'");
    });

    it("should handle message types from extension", () => {
      expect(html).toContain("case 'ai.stream.chunk':");
      expect(html).toContain("case 'ai.stream.done':");
      expect(html).toContain("case 'ai.stream.error':");
      expect(html).toContain("case 'ai.status':");
      expect(html).toContain("case 'ai.loadHistory':");
    });

    it("should handle quick action buttons", () => {
      expect(html).toContain("document.querySelectorAll('.quick-action-btn')");
      expect(html).toContain("btn.dataset.prompt");
      expect(html).toContain("btn.dataset.action");
    });

    it("should handle clear conversation", () => {
      expect(html).toContain("document.getElementById('clearBtn')");
      expect(html).toContain("confirm('Clear all messages?')");
      expect(html).toContain("action: 'ai.clearConversation'");
    });

    it("should handle settings navigation", () => {
      expect(html).toContain("document.getElementById('settingsBtn')");
      expect(html).toContain("action: 'navigation.navigate'");
    });

    it("should handle code copy buttons", () => {
      expect(html).toContain("e.target.classList.contains('code-copy-btn')");
      expect(html).toContain("decodeURIComponent(e.target.dataset.code)");
      expect(html).toContain("navigator.clipboard.writeText");
    });
  });

  describe("Message Types", () => {
    it("should define ChatMessage interface with required fields", () => {
      const message: ChatMessage = {
        id: "msg-1",
        role: "user",
        content: "Hello",
        timestamp: Date.now(),
      };

      expect(message.id).toBeDefined();
      expect(message.role).toBeDefined();
      expect(message.content).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });

    it("should support all message roles", () => {
      const roles: ChatMessage["role"][] = ["user", "assistant", "system"];

      roles.forEach((role) => {
        const message: ChatMessage = {
          id: `msg-${role}`,
          role,
          content: "Test",
          timestamp: Date.now(),
        };
        expect(message.role).toBe(role);
      });
    });

    it("should support optional metadata", () => {
      const message: ChatMessage = {
        id: "msg-1",
        role: "assistant",
        content: "Hello",
        timestamp: Date.now(),
        metadata: {
          model: "gpt-4",
          tokens: { prompt: 10, completion: 20 },
          latency: 500,
        },
      };

      expect(message.metadata?.model).toBe("gpt-4");
      expect(message.metadata?.tokens?.prompt).toBe(10);
      expect(message.metadata?.tokens?.completion).toBe(20);
      expect(message.metadata?.latency).toBe(500);
    });
  });

  describe("Security", () => {
    it("should escape HTML in title", () => {
      const html = getAIChatPanelHtml({
        nonce: mockNonce,
        title: '<script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain("&lt;script&gt;");
    });

    it("should escape HTML in placeholder", () => {
      const html = getAIChatPanelHtml({
        nonce: mockNonce,
        placeholder: '<img src=x onerror=alert(1)>',
      });

      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain("&lt;img");
    });

    it("should not contain external resources", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).not.toContain('src="http');
      expect(html).not.toContain('href="http');
      expect(html).not.toContain("//cdn.");
    });

    it("should use inline styles only", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).not.toContain('<link rel="stylesheet"');
      expect(html).toContain("<style>");
    });

    it("should use inline scripts only", () => {
      const html = getAIChatPanelHtml({ nonce: mockNonce });

      expect(html).not.toContain('src="');
      expect(html).toContain("<script");
    });
  });

  describe("Quick Actions", () => {
    let html: string;

    beforeEach(() => {
      html = getAIChatPanelHtml({ nonce: mockNonce });
    });

    it("should have Continue action", () => {
      expect(html).toContain('data-action="continue"');
      expect(html).toContain("Continue writing from where I left off");
    });

    it("should have Polish action", () => {
      expect(html).toContain('data-action="polish"');
      expect(html).toContain("Polish and improve the writing style");
    });

    it("should have Expand action", () => {
      expect(html).toContain('data-action="expand"');
      expect(html).toContain("Expand this section with more details");
    });

    it("should have Summarize action", () => {
      expect(html).toContain('data-action="summarize"');
      expect(html).toContain("Summarize the key points");
    });

    it("should have Rewrite action", () => {
      expect(html).toContain('data-action="rewrite"');
      expect(html).toContain("Rewrite this in a different style");
    });
  });

  describe("Streaming Support", () => {
    let html: string;

    beforeEach(() => {
      html = getAIChatPanelHtml({ nonce: mockNonce });
    });

    it("should have streaming state indicator", () => {
      expect(html).toContain("isStreaming");
      expect(html).toContain("currentStreamMessageId");
    });

    it("should have streaming animation", () => {
      expect(html).toContain("streaming");
      expect(html).toContain('content: "▋"');
    });

    it("should toggle send/stop buttons during streaming", () => {
      expect(html).toContain("sendBtn.style.display = 'none'");
      expect(html).toContain("stopBtn.style.display = 'block'");
      expect(html).toContain("sendBtn.style.display = 'block'");
      expect(html).toContain("stopBtn.style.display = 'none'");
    });

    it("should update AI status during streaming", () => {
      expect(html).toContain("setAIStatus('connecting')");
      expect(html).toContain("setAIStatus('online')");
      expect(html).toContain("setAIStatus('error')");
    });
  });

  describe("Accessibility", () => {
    let html: string;

    beforeEach(() => {
      html = getAIChatPanelHtml({ nonce: mockNonce });
    });

    it("should have button titles", () => {
      expect(html).toContain('title="Clear conversation"');
      expect(html).toContain('title="AI Settings"');
    });

    it("should have proper input attributes", () => {
      expect(html).toContain("<textarea");
      expect(html).toContain("placeholder=");
    });

    it("should support keyboard navigation", () => {
      expect(html).toContain("e.key === 'Enter'");
      expect(html).toContain("!e.shiftKey");
    });
  });

  describe("Responsive Design", () => {
    let html: string;

    beforeEach(() => {
      html = getAIChatPanelHtml({ nonce: mockNonce });
    });

    it("should have flexbox layout", () => {
      expect(html).toContain("display: flex");
      expect(html).toContain("flex-direction: column");
    });

    it("should have overflow handling", () => {
      expect(html).toContain("overflow: hidden");
      expect(html).toContain("overflow-y: auto");
    });

    it("should have scrollbar styling", () => {
      expect(html).toContain("::-webkit-scrollbar");
    });
  });
});
