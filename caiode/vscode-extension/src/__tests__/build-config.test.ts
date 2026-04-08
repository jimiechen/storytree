import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PKG_PATH = path.resolve(__dirname, "../package.json");
const ESBUILD_PATH = path.resolve(__dirname, "../esbuild.config.mjs");

describe("Build & Package Pipeline", () => {
  let pkg: Record<string, unknown>;
  let esbuildContent: string;

  beforeAll(() => {
    pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf-8"));
    esbuildContent = fs.readFileSync(ESBUILD_PATH, "utf-8");
  });

  describe("esbuild Production Build Configuration", () => {
    it("should define external modules (vscode, better-sqlite3)", () => {
      expect(esbuildContent).toContain('"vscode"');
      expect(esbuildContent).toContain('"better-sqlite3"');
      expect(esbuildContent).toContain("EXTERNAL_MODULES");
    });

    it("should define entry points for extension and webview bundle", () => {
      expect(esbuildContent).toContain("extension.ts");
      expect(esbuildContent).toContain("webview-bundle");
    });

    it("should configure production minification with syntax + whitespace", () => {
      expect(esbuildContent).toContain('syntax: true');
      expect(esbuildContent).toContain('whitespace: true');
      expect(esbuildContent).toContain('identifiers: false');
    });

    it("should drop console and debugger in production", () => {
      expect(esbuildContent).toContain('drop: ["console", "debugger"]');
    });

    it("should enable tree shaking in production mode", () => {
      expect(esbuildContent).toContain("treeShaking: true");
    });

    it("should set keepNames to false for obfuscation", () => {
      expect(esbuildContent).toContain("keepNames: false");
    });

    it("should generate metafile for bundle analysis in production", () => {
      expect(esbuildContent).toContain("metafile: true");
    });

    it("should output to dist/ directory", () => {
      expect(esbuildContent).toContain('"dist/"');
    });
  });

  describe("package.json VSIX Configuration", () => {
    it("should have proper name, displayName, version, publisher", () => {
      expect(pkg.name).toBe("storytree-vscode");
      expect((pkg as { displayName?: string }).displayName).toBe("StoryTree IDE");
      expect(pkg.version).toBeDefined();
      expect((pkg as { publisher?: string }).publisher).toBe("storytree");
    });

    it("should set main entry to dist/extension.js", () => {
      expect(pkg.main).toBe("./dist/extension.js");
    });

    it("should define VS Code engine compatibility", () => {
      const engines = pkg.engines as Record<string, string>;
      expect(engines.vscode).toMatch(/^[\^~]\d+/);
    });

    it("should register all StoryTree commands in contributes.commands", () => {
      const commands = (pkg.contributes as Record<string, unknown>).commands as Array<Record<string, string>>;
      const ids = commands.map((c) => c.command);
      expect(ids).toContain("storytree.openDashboard");
      expect(ids).toContain("storytree.newProject");
      expect(ids).toContain("storytree.newChapter");
      expect(ids).toContain("storytree.toggleAIChat");
      expect(ids).toContain("storytree.showSettings");
      expect(ids).toContain("storytree.wordCount");
      expect(commands.length).toBeGreaterThanOrEqual(6);
    });

    it("should register keybindings for all commands", () => {
      const keybindings = (pkg.contributes as Record<string, unknown>).keybindings as Array<Record<string, string>>;
      const cmdIds = keybindings.map((k) => k.command);
      expect(cmdIds.length).toBeGreaterThanOrEqual(5);
    });

    it("should define activation events", () => {
      const activationEvents = pkg.activationEvents as string[];
      expect(activationEvents).toContain("onCommand:storytree.openDashboard");
      expect(activationEvents).toContain("onView:storytreeExplorer");
    });

    it("should register storytreeExplorer TreeView in contributes.views", () => {
      const views = (pkg.contributes as Record<string, unknown>).views as Record<string, Array<Record<string, unknown>>>;
      const explorerViews = views["storytree-sidebar-container"] || [];
      const hasExplorer = explorerViews.some(
        (v) => (v as { id?: string }).id === "storytreeExplorer",
      );
      expect(hasExplorer).toBe(true);
    });

    it("should define configuration properties for AI settings", () => {
      const config = (pkg.contributes as Record<string, unknown>).configuration as Record<string, unknown>;
      const props = (config.properties as Record<string, unknown>) || {};
      expect(props["storytree.ai.provider"]).toBeDefined();
      expect(props["storytree.ai.openai.apiKey"]).toBeDefined();
      expect(props["storytree.ai.anthropic.apiKey"]).toBeDefined();
      expect(props["storytree.ai.ollama.baseUrl"]).toBeDefined();
      expect(props["storytree.editor.autoSaveMs"]).toBeDefined();
    });

    it("should have build scripts defined", () => {
      const scripts = pkg.scripts as Record<string, string>;
      expect(scripts["build:dev"]).toContain("esbuild");
      expect(scripts["build:prod"]).toContain("--prod");
      expect(scripts["watch"]).toContain("--watch");
      expect(scripts["package"]).toContain("vsce package");
      expect(scripts["test"]).toContain("vitest");
    });

    it("should use --no-dependencies flag for vsce packaging", () => {
      const scripts = pkg.scripts as Record<string, string>;
      expect(scripts["package"]).toContain("--no-dependencies");
    });

    it("should include vscode:prepublish hook that runs production build", () => {
      const scripts = pkg.scripts as Record<string, string>;
      expect(scripts["vscode:prepublish"]).toContain("build:prod");
    });

    it("should list relevant categories and keywords", () => {
      const categories = pkg.categories as string[];
      const keywords = pkg.keywords as string[];
      expect(categories.length).toBeGreaterThan(0);
      expect(keywords).toContain("novel");
      expect(keywords).toContain("writing");
      expect(keywords).toContain("AI");
    });
  });
});
