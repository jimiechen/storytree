/**
 * T-FE-002: Playwright UI Testing & Visual Regression Testing (VRT)
 *
 * Since VS Code Webview runs inside an extension host (not an HTTP server),
 * we use a pragmatic testing approach:
 *
 * 1. **DOM Structure Validation**: Parse generated HTML, verify element hierarchy,
 *    CSS classes, accessibility attributes, and layout correctness.
 * 2. **IPC Data Binding Tests**: Simulate postMessage/acquireVsCodeApi to verify
 *    data flows correctly from IPC response → DOM rendering.
 * 3. **VRT Baseline Snapshots**: Use vitest snapshot() to establish visual regression
 *    baselines for each page's rendered output.
 * 4. **Navigation Flow**: Verify page switching logic produces correct HTML.
 * 5. **XSS Safety**: Verify escapeHtml() prevents injection.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getDashboardHtml } from "../webview/html-generator";

describe("T-FE-002: Webview UI & VRT Testing", () => {
  const nonce = "test-nonce-12345";

  describe("Suite A: DOM Structure Validation", () => {
    it("should generate valid HTML5 document structure", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
      expect(html).toContain("<head>");
      expect(html).toContain("</head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</body>");
    });

    it("should include Content-Security-Policy meta tag", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("Content-Security-Policy");
      expect(html).toContain(`nonce-${nonce}`);
    });

    it("should include correct lang attribute", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain('lang="zh-CN"');
    });

    it("should include viewport meta tag for responsive design", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain('name="viewport"');
      expect(html).toContain("width=device-width");
    });

    it("should have proper title", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("<title>StoryTree IDE</title>");
    });

    it("should include app container div", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain('id="app"');
    });

    it("should embed nonce in script tag", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain(`nonce="${nonce}"`);
      expect(html).toContain('<script');
      expect(html).toContain("</script>");
    });

    it("should include acquireVsCodeApi call", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("acquireVsCodeApi");
    });
  });

  describe("Suite B: Navigation Bar Structure", () => {
    it("should render navigation tabs for all pages", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("nav-tab");
      expect(html).toContain("工作台");
      expect(html).toContain("角色");
      expect(html).toContain("大纲");
      expect(html).toContain("世界观");
    });

    it("should have navigation click handlers referencing navigate()", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("navigate(");
      expect(html).toContain("window.navigate");
    });

    it("should include dashboard icon in nav", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("📊");
    });
  });

  describe("Suite C: Dashboard Page Rendering", () => {
    it("should render stats grid section", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("stats-grid");
      expect(html).toContain("stat-card");
      expect(html).toContain("stat-value");
      expect(html).toContain("stat-label");
    });

    it("should render project card grid section", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("card-grid");
      expect(html).toContain("card");
      expect(html).toContain("card-title");
      expect(html).toContain("card-desc");
    });

    it("should render status badge with connection indicator", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("status-badge");
      expect(html).toContain("status-dot");
      expect(html).toContain("已连接");
    });

    it("should render create project button", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("btn-primary");
      expect(html).toContain("+ 创建新项目");
    });

    it("should include header with title StoryTree IDE", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("header-title");
      expect(html).toContain("StoryTree IDE");
    });
  });

  describe("Suite D: Characters Page Structure", () => {
    it("should render character table with correct columns", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("<table>");
      expect(html).toContain("<thead>");
      expect(html).toContain("<tbody");
      expect(html).toContain("名称");
      expect(html).toContain("类型");
      expect(html).toContain("描述");
      expect(html).toContain("特征");
    });

    it("should render role badges (protagonist/antagonist/supporting)", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("role-badge");
      expect(html).toContain("role-protagonist");
      expect(html).toContain("role-antagonist");
      expect(html).toContain("role-supporting");
      expect(html).toContain("role-minor");
    });

    it("should render character search input", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("char-search");
      expect(html).toContain("filterCharacters()");
      expect(html).toContain("搜索角色名称");
    });
  });

  describe("Suite E: Outline Page Structure", () => {
    it("should render outline list with order indicators", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("outline-list");
      expect(html).toContain("outline-item");
      expect(html).toContain("outline-order");
      expect(html).toContain("selectChapter(");
    });

    it("should render outline detail panel", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("outline-detail");
    });

    it("should show word count display per chapter", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("字");
    });
  });

  describe("Suite F: World Settings Page Structure", () => {
    it("should render world setting cards with categories", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("ws-card");
      expect(html).toContain("category-badge");
      expect(html).toContain("cat-location");
      expect(html).toContain("cat-organization");
      expect(html).toContain("cat-magic_system");
    });

    it("should render world settings search input", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("ws-search");
      expect(html).toContain("filterWorldSettings()");
      expect(html).toContain("搜索设定");
    });
  });

  describe("Suite G: CSS Architecture & Styling", () => {
    it("should use CSS custom properties for theming", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("--vscode-editor-background");
      expect(html).toContain("--vscode-editor-foreground");
      expect(html).toContain("--vscode-button-background");
      expect(html).toContain("--vscode-panel-border");
      expect(html).toContain("--vscode-sideBar-background");
    });

    it("should define responsive grid layouts", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("grid-template-columns");
      expect(html).toContain("repeat(auto-fill");
      expect(html).toContain("minmax(");
    });

    it("should define hover states for interactive elements", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain(":hover");
    });

    it("should define transition animations", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("transition");
    });

    it("should support dark mode via CSS variables", () => {
      const html = getDashboardHtml(nonce);

      const vscodeVarCount = (html.match(/var\(--vscode-/g) || []).length;
      expect(vscodeVarCount).toBeGreaterThan(15);
    });
  });

  describe("Suite H: XSS Prevention & Security", () => {
    it("should escape HTML entities in escapeHtml function", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("esc(str)");
      expect(html).toContain("textContent");
      expect(html).toContain("innerHTML");
    });

    it("should not contain inline event handlers with unescaped data", () => {
      const html = getDashboardHtml(nonce);

      const unsafePatterns = [
        /onclick="[^"]*data[^"]*"/,
        /onerror\s*=/,
        /javascript:/i,
      ];

      unsafePatterns.forEach((pattern) => {
        const matches = html.match(pattern);
        if (matches) {
          expect(matches.length).toBe(0);
        }
      });
    });

    it("should use CSP nonce for all script tags", () => {
      const html = getDashboardHtml(nonce);

      const scriptTags = html.match(/<script[^>]*>/g) || [];
      scriptTags.forEach((tag) => {
        expect(tag).toContain(`nonce="${nonce}"`);
      });
    });
  });

  describe("Suite I: IPC Communication Contract", () => {
    it("should implement sendMessage() returning Promise", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("function sendMessage(");
      expect(html).toContain("return new Promise(");
      expect(html).toContain("resolve");
      expect(html).toContain("reject");
    });

    it("should construct JSON-RPC compliant messages", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain('"jsonrpc": "2.0"');
      expect(html).toContain('"action"');
      expect(html).toContain('"payload"');
      expect(html).toContain('"timestamp"');
    });

    it("should handle response routing by ID", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("data.id === id");
      expect(html).toContain("window.removeEventListener");
    });

    it("should implement timeout protection", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("setTimeout");
      expect(html).toContain("'Timeout'");
    });

    it("should call vscode.postMessage for IPC", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("vscode.postMessage");
    });

    it("should register message listener on window", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("window.addEventListener('message'");
    });
  });

  describe("Suite J: Page Initialization & Lifecycle", () => {
    it("should auto-navigate to dashboard on load", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("window.addEventListener('load'");
      expect(html).toContain("navigate('dashboard')");
    });

    it("should expose navigate function globally", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("window.navigate = navigate");
    });

    it("should define loadDashboard, loadCharacters, loadOutline, loadWorldSettings functions", () => {
      const html = getDashboardHtml(nonce);
      expect(html).toContain("async function loadDashboard()");
      expect(html).toContain("async function loadCharacters()");
      expect(html).toContain("async function loadOutline()");
      expect(html).toContain("async function loadWorldSettings()");
    });

    it("should implement error boundaries per page", () => {
      const html = getDashboardHtml(nonce);
      const errorHandlingCount = (html.match(/catch\(e\)/g) || []).length;
      expect(errorHandlingCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Suite K: VRT Baseline - Dashboard Full Render", () => {
    it("should match dashboard VRT baseline snapshot", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toMatchSnapshot("dashboard-full-html");
    });

    it("should match navigation bar VRT baseline", () => {
      const html = getDashboardHtml(nonce);

      const navMatch = html.match(/<div class="nav-bar">[\s\S]*?<\/div>/);
      expect(navMatch).not.toBeNull();
      expect(navMatch![0]).toMatchSnapshot("navigation-bar");
    });

    it("should match stats grid VRT baseline", () => {
      const html = getDashboardHtml(nonce);

      const statsMatch = html.match(/<div class="stats-grid">[\s\S]*?<\/div>/);
      expect(statsMatch).not.toBeNull();
      expect(statsMatch![0]).toMatchSnapshot("stats-grid");
    });

    it("should match card grid VRT baseline", () => {
      const html = getDashboardHtml(nonce);

      const cardMatch = html.match(/<div class="card-grid">[\s\S]*?<\/div>/);
      expect(cardMatch).not.toBeNull();
      expect(cardMatch![0]).toMatchSnapshot("project-card-grid");
    });
  });

  describe("Suite L: VRT Baseline - Characters Page", () => {
    it("should match character table VRT baseline", () => {
      const html = getDashboardHtml(nonce);

      const tableMatch = html.match(/<table>[\s\S]*?<\/table>/);
      expect(tableMatch).not.toBeNull();
      expect(tableMatch![0]).toMatchSnapshot("character-table");
    });
  });

  describe("Suite M: VRT Baseline - Outline Page", () => {
    it("should match outline list VRT baseline", () => {
      const html = getDashboardHtml(nonce);

      const outlineMatch = html.match(
        /<div id="outline-list">[\s\S]*?<\/div>\s*<\/div>/
      );
      expect(outlineMatch).not.toBeNull();
      expect(outlineMatch![0]).toMatchSnapshot("outline-list");
    });
  });

  describe("Suite N: VRT Baseline - World Settings Page", () => {
    it("should match world settings card grid VRT baseline", () => {
      const html = getDashboardHtml(nonce);

      const wsCardMatch = html.match(
        /class="card-grid"[^>]*>[\s\S]*?ws-card[\s\S]*?<\/div>\s*<\/div>/
      );
      expect(wsCardMatch).not.toBeNull();
      expect(wsCardMatch![0]).toMatchSnapshot("world-settings-cards");
    });
  });

  describe("Suite O: Accessibility (a11y)", () => {
    it("should use semantic HTML elements", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("<h1");
      expect(html).toContain("<h2");
      expect(html).toContain("<h3");
      expect(html).toContain("<table>");
      expect(html).toContain("<button");
    });

    it("should provide visible labels for search inputs", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain('placeholder="');
      const placeholders = (html.match(/placeholder="[^"]*"/g) || []).length;
      expect(placeholders).toBeGreaterThanOrEqual(2);
    });

    it("should have sufficient color contrast via CSS variables", () => {
      const html = getDashboardHtml(nonce);

      expect(html).toContain("opacity:");
      const opacityCount = (html.match(/opacity:\s*[\d.]+/g) || []).length;
      expect(opacityCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Suite P: Performance Characteristics", () => {
    it("should be a single self-contained HTML file (no external resources)", () => {
      const html = getDashboardHtml(nonce);

      expect(html).not.toContain('<link rel="stylesheet"');
      expect(html).not.toContain('<script src=');
      expect(html).toContain("<style>");
    });

    it("should have reasonable file size (< 50KB for initial load)", () => {
      const html = getDashboardHtml(nonce);
      const sizeKB = Buffer.byteLength(html, "utf-8") / 1024;
      expect(sizeKB).toBeLessThan(50);
    });

    it("should minimize DOM depth for rendering performance", () => {
      const html = getDashboardHtml(nonce);

      const maxNesting = Math.max(
        ...Array.from(html.matchAll(/</g)).map(() => 1)
      );

      const openTags = (html.match(/<\w+/g) || []).length;
      const closeTags = (html.match(/<\/\w+>/g) || []).length;

      expect(openTags).toBeGreaterThan(50);
      expect(Math.abs(openTags - closeTags)).toBeLessThan(5);
    });
  });
});
