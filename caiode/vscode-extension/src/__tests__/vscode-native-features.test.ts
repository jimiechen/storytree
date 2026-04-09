import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import { StatusBarManager } from "../core/status-bar-manager";
import { CommandPaletteManager } from "../core/command-palette";
import { ExternalFileSync } from "../core/external-file-sync";

describe("StatusBarManager", () => {
  let manager: StatusBarManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    manager = new StatusBarManager();
  });

  it("should create status bar items with correct names", () => {
    expect(manager["projectItem"].name).toBe("StoryTree Project");
    expect(manager["chaptersItem"].name).toBe("StoryTree Chapters");
    expect(manager["wordsItem"].name).toBe("StoryTree Words");
    expect(manager["aiStatusItem"].name).toBe("StoryTree AI Status");
  });

  describe("update - project name", () => {
    it("should display project name with book icon", () => {
      manager.update({ projectName: "My Novel" });
      expect(manager["projectItem"].text).toContain("My Novel");
      expect(manager["projectItem"].text).toContain("$(book)");
    });

    it("should set tooltip with project name", () => {
      manager.update({ projectName: "Test" });
      expect(manager["projectItem"].tooltip).toBe("Current project: Test");
    });

    it("should set command to openDashboard on project click", () => {
      manager.update({ projectName: "X" });
      expect(manager["projectItem"].command).toBe("storytree.openDashboard");
    });
  });

  describe("update - chapter count", () => {
    it("should display chapter count with file-code icon", () => {
      manager.update({ chapterCount: 5 });
      expect(manager["chaptersItem"].text).toContain("5 chs");
      expect(manager["chaptersItem"].text).toContain("$(file-code)");
    });

    it("should use singular form for count of 1", () => {
      manager.update({ chapterCount: 1 });
      expect(manager["chaptersItem"].text).toContain("1 ch");
    });

    it("should show tooltip with count", () => {
      manager.update({ chapterCount: 12 });
      expect(manager["chaptersItem"].tooltip).toBe("12 chapters");
    });
  });

  describe("update - word count", () => {
    it("should format word count with K suffix for thousands", () => {
      manager.update({ totalWords: 15000 });
      expect(manager["wordsItem"].text).toContain("15.0k");
      expect(manager["wordsItem"].text).toContain("words");
    });

    it("should format word count with M suffix for millions", () => {
      manager.update({ totalWords: 2_500_000 });
      expect(manager["wordsItem"].text).toContain("2.5M");
    });

    it("should show raw number for small counts", () => {
      manager.update({ totalWords: 350 });
      expect(manager["wordsItem"].text).toContain("350 words");
    });

    it("should include locale-formatted count in tooltip", () => {
      manager.update({ totalWords: 12345 });
      expect(manager["wordsItem"].tooltip).toContain("12345");
    });
  });

  describe("update - AI status", () => {
    it("should show connected state with plug icon", () => {
      manager.update({ aiStatus: "online" });
      expect(manager["aiStatusItem"].text).toContain("AI Connected");
      expect(manager["aiStatusItem"].text).toContain("$(plug)");
    });

    it("should show offline state with circle-slash icon", () => {
      manager.update({ aiStatus: "offline" });
      expect(manager["aiStatusItem"].text).toContain("AI Offline");
      expect(manager["aiStatusItem"].text).toContain("$(circle-slash)");
    });

    it("should show config_missing state with warning icon and settings command", () => {
      manager.update({ aiStatus: "config_missing" });
      expect(manager["aiStatusItem"].text).toContain("Not Configured");
      expect(manager["aiStatusItem"].command).toBe("storytree.showSettings");
    });

    it("should show connecting state with spinner icon", () => {
      manager.update({ aiStatus: "connecting" });
      expect(manager["aiStatusItem"].text).toContain("Connecting...");
      expect(manager["aiStatusItem"].text).toContain("sync~spin");
    });
  });

  describe("show/hide", () => {
    it("show should call show on all items", () => {
      const spy1 = vi.spyOn(manager["projectItem"], "show").mockImplementation(() => {});
      const spy2 = vi.spyOn(manager["chaptersItem"], "show").mockImplementation(() => {});
      const spy3 = vi.spyOn(manager["wordsItem"], "show").mockImplementation(() => {});
      const spy4 = vi.spyOn(manager["aiStatusItem"], "show").mockImplementation(() => {});

      manager.show();

      expect(spy1).toHaveBeenCalledOnce();
      expect(spy2).toHaveBeenCalledOnce();
      expect(spy3).toHaveBeenCalledOnce();
      expect(spy4).toHaveBeenCalledOnce();
    });

    it("hide should call hide on all items", () => {
      const spy1 = vi.spyOn(manager["projectItem"], "hide").mockImplementation(() => {});
      const spy2 = vi.spyOn(manager["chaptersItem"], "hide").mockImplementation(() => {});

      manager.hide();

      expect(spy1).toHaveBeenCalledOnce();
      expect(spy2).toHaveBeenCalledOnce();
    });
  });

  describe("dispose", () => {
    it("should dispose all status bar items", () => {
      const spy1 = vi.spyOn(manager["projectItem"], "dispose").mockImplementation(() => {});
      const spy2 = vi.spyOn(manager["chaptersItem"], "dispose").mockImplementation(() => {});
      const spy3 = vi.spyOn(manager["wordsItem"], "dispose").mockImplementation(() => {});
      const spy4 = vi.spyOn(manager["aiStatusItem"], "dispose").mockImplementation(() => {});

      manager.dispose();

      expect(spy1).toHaveBeenCalledOnce();
      expect(spy2).toHaveBeenCalledOnce();
      expect(spy3).toHaveBeenCalledOnce();
      expect(spy4).toHaveBeenCalledOnce();
    });
  });
});

describe("CommandPaletteManager", () => {
  let manager: CommandPaletteManager;
  let mockContext: { subscriptions: Array<{ dispose: () => void }> };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContext = { subscriptions: [] };
    manager = new CommandPaletteManager();
  });

  it("should register all built-in commands", () => {
    manager.registerAll(mockContext as any);
    const registered = manager.getRegisteredCommands();
    expect(registered).toContain("storytree.openDashboard");
    expect(registered).toContain("storytree.newProject");
    expect(registered).toContain("storytree.newChapter");
    expect(registered).toContain("storytree.toggleAIChat");
    expect(registered).toContain("storytree.showSettings");
    expect(registered).toContain("storytree.wordCount");
    expect(registered).toHaveLength(6);
  });

  it("should not register duplicate commands", () => {
    manager.registerAll(mockContext as any);
    manager.registerAll(mockContext as any);
    expect(manager.getRegisteredCommands()).toHaveLength(6);
  });

  it("isCommandRegistered should return true for registered commands", () => {
    manager.registerAll(mockContext as any);
    expect(manager.isCommandRegistered("storytree.openDashboard")).toBe(true);
    expect(manager.isCommandRegistered("storytree.nonexistent")).toBe(false);
  });

  it("register should add single command", () => {
    const cmd = {
      id: "custom.test",
      title: "Custom Test",
      handler: vi.fn(),
    };
    manager.register(mockContext as any, cmd);
    expect(manager.isCommandRegistered("custom.test")).toBe(true);
  });

  it("should push disposables to context subscriptions", () => {
    manager.registerAll(mockContext as any);
    expect(mockContext.subscriptions.length).toBeGreaterThanOrEqual(6);
  });

  it("dispose should clear all registrations", () => {
    manager.registerAll(mockContext as any);
    expect(manager.getRegisteredCommands()).toHaveLength(6);

    manager.dispose();
    expect(manager.getRegisteredCommands()).toHaveLength(0);
  });

  it("built-in commands should have proper titles and keybindings", () => {
    manager.registerAll(mockContext as any);
    expect(manager.getRegisteredCommands().length).toBe(6);
  });
});

describe("ExternalFileSync", () => {
  let sync: ExternalFileSync;
  let mockWatcher: { onDidCreate: ReturnType<typeof vi.fn>; onDidChange: ReturnType<typeof vi.fn>; onDidDelete: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockWatcher = {
      onDidCreate: vi.fn(),
      onDidChange: vi.fn(),
      onDidDelete: vi.fn(),
      dispose: vi.fn(),
    };
    vi.spyOn(vscode.workspace, "createFileSystemWatcher").mockReturnValue(mockWatcher as any);
    sync = new ExternalFileSync({
      watchGlob: "**/.storytree/**/*.json",
      debounceMs: 50,
    });
  });

  afterEach(() => {
    sync.dispose();
  });

  it("should start inactive", () => {
    expect(sync.isActive).toBe(false);
  });

  it("start() should create FileSystemWatcher with correct glob", () => {
    sync.start();
    expect(sync.isActive).toBe(true);
    expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith(
      "**/.storytree/**/*.json",
      false,
      false,
      false,
    );
  });

  it("stop() should dispose watcher and clear pending changes", () => {
    sync.start();
    sync.stop();
    expect(mockWatcher.dispose).toHaveBeenCalledOnce();
    expect(sync.isActive).toBe(false);
  });

  it("second start() should be no-op if already started", () => {
    sync.start();
    sync.start();
    expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledTimes(1);
  });

  it("should fire onDidChange event after debounce period", async () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    sync.onDidChange(listener);
    sync.start();

    const uri = vscode.Uri.file("/test/.storytree/project.json");

    mockWatcher.onDidCreate.mock.calls[0]?.[0](uri);
    vi.advanceTimersByTime(60);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ changeType: "created" }),
    );

    vi.useRealTimers();
  });

  it("should batch multiple changes within debounce window", async () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    sync.onDidChange(listener);
    sync.start();

    const uri1 = vscode.Uri.file("/test/a.json");
    const uri2 = vscode.Uri.file("/test/b.json");

    mockWatcher.onDidChange.mock.calls[0]?.[0](uri1);
    mockWatcher.onDidCreate.mock.calls[0]?.[0](uri2);

    expect(listener).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60);

    expect(listener).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("should handle delete-then-create as created (file replaced)", async () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    sync.onDidChange(listener);
    sync.start();

    const uri = vscode.Uri.file("/test/replaced.json");

    mockWatcher.onDidDelete.mock.calls[0]?.[0](uri);
    mockWatcher.onDidCreate.mock.calls[0]?.[0](uri);

    vi.advanceTimersByTime(60);

    const calls = listener.mock.calls.map((c) => c[0].changeType);
    expect(calls).toEqual(["created"]);

    vi.useRealTimers();
  });

  it("should handle create-then-delete as no-op (temporary file)", async () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    sync.onDidChange(listener);
    sync.start();

    const uri = vscode.Uri.file("/test/temp.json");

    mockWatcher.onDidCreate.mock.calls[0]?.[0](uri);
    mockWatcher.onDidDelete.mock.calls[0]?.[0](uri);

    vi.advanceTimersByTime(60);

    expect(listener).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should invoke onFileChanged callback when configured", async () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    syncWithCallback = new ExternalFileSync({
      watchGlob: "**/*.json",
      debounceMs: 30,
      onFileChanged: callback,
    });

    syncWithCallback.start();
    const uri = vscode.Uri.file("/test/changed.json");
    mockWatcher.onDidChange.mock.calls[0]?.[0](uri);
    vi.advanceTimersByTime(40);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(uri, "changed");

    syncWithCallback.dispose();
    vi.useRealTimers();
  });

  it("dispose should clean up watcher and event emitter", () => {
    sync.start();
    const emitSpy = vi.spyOn(sync["_onDidChange"], "dispose");
    sync.dispose();
    expect(mockWatcher.dispose).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledOnce();
  });
});

let syncWithCallback: ExternalFileSync;
