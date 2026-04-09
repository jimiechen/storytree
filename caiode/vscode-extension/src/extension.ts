/**
 * StoryTree VS Code Extension - Main Entry Point
 *
 * This is the main entry point for the VS Code extension.
 * It initializes the extension, sets up the webview panel,
 * and registers commands.
 */

import * as vscode from "vscode";
import { WebviewPanelManager } from "./webview/panel-manager";
import { MessageRouter } from "./core/message-router";
import { initializeMockStore, mockStore } from "./core/mock-store";
import type { IPCRequest } from "./types/ipc-protocol";
import {
  ProjectAction,
  ChapterAction,
  CharacterAction,
  SystemAction,
} from "./types/ipc-protocol";

let webviewManager: WebviewPanelManager | undefined;
let messageRouter: MessageRouter | undefined;
let extensionContext: vscode.ExtensionContext | undefined;

export function activate(context: vscode.ExtensionContext): void {
  extensionContext = context;

  console.log("[StoryTree] Extension activating...");

  initializeMockData();
  initializeMessageRouter();
  initializeWebviewManager();
  registerCommands();

  console.log("[StoryTree] Extension activated successfully!");
}

export function deactivate(): void {
  console.log("[StoryTree] Extension deactivating...");

  if (webviewManager) {
    webviewManager.dispose();
    webviewManager = undefined;
  }

  if (messageRouter) {
    messageRouter.dispose();
    messageRouter = undefined;
  }

  console.log("[StoryTree] Extension deactivated.");
}

function initializeMockData(): void {
  initializeMockStore();
  console.log(`[StoryTree] Mock data initialized: ${JSON.stringify(mockStore.getStats())}`);
}

function initializeMessageRouter(): void {
  messageRouter = new MessageRouter({
    debug: true,
    strictMode: false,
  });

  registerMockHandlers();

  console.log("[StoryTree] Message router initialized");
}

function registerMockHandlers(): void {
  if (!messageRouter) return;

  messageRouter.on(SystemAction.HEALTH_CHECK, () => ({
    status: "ok",
    version: "0.1.0",
    mockStats: mockStore.getStats(),
    timestamp: new Date().toISOString(),
  }));

  messageRouter.on(SystemAction.GET_CONFIG, () => ({
    mockMode: true,
    features: {
      aiChat: false,
      outlineEditor: true,
      characterManagement: true,
      worldBuilding: true,
    },
  }));

  messageRouter.on(ProjectAction.LIST, () => {
    const projects = mockStore.getProjects();
    return { projects, total: projects.length };
  });

  messageRouter.on(ProjectAction.GET, (request) => {
    const payload = request.payload as { id?: string };
    const id = payload?.id;
    if (!id) throw new Error("Project ID is required");

    const project = mockStore.getProjectById(id);
    if (!project) throw new Error("Project not found");

    return project;
  });

  messageRouter.on(ProjectAction.CREATE, (request) => {
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

  messageRouter.on(ChapterAction.LIST, (request) => {
    const payload = request.payload as { projectId?: string };
    const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;

    if (!projectId) throw new Error("No project available");

    const chapters = mockStore.getChaptersByProject(projectId);
    return { chapters, total: chapters.length };
  });

  messageRouter.on(ChapterAction.GET, (request) => {
    const payload = request.payload as { id?: string };
    const id = payload?.id;
    if (!id) throw new Error("Chapter ID is required");

    const chapter = mockStore.getChapterById(id);
    if (!chapter) throw new Error("Chapter not found");

    return chapter;
  });

  messageRouter.on(CharacterAction.LIST, (request) => {
    const payload = request.payload as { projectId?: string };
    const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;

    if (!projectId) throw new Error("No project available");

    const characters = mockStore.getCharactersByProject(projectId);
    return { characters, total: characters.length };
  });

  messageRouter.on("worldsetting.list", (request) => {
    const payload = request.payload as { projectId?: string };
    const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;

    if (!projectId) throw new Error("No project available");

    const settings = mockStore.getWorldSettingsByProject(projectId);
    return { worldSettings: settings, total: settings.length };
  });

  messageRouter.on("outline.list", (request) => {
    const payload = request.payload as { projectId?: string };
    const projectId = payload?.projectId || mockStore.getProjects()[0]?.id;

    if (!projectId) throw new Error("No project available");

    const nodes = mockStore.getOutlineByProject(projectId);
    return { nodes, total: nodes.length };
  });
}

function initializeWebviewManager(): void {
  if (!extensionContext || !messageRouter) return;

  webviewManager = new WebviewPanelManager(
    extensionContext,
    messageRouter
  );

  console.log("[StoryTree] Webview manager initialized");
}

function registerCommands(): void {
  if (!extensionContext) return;

  const openDashboardCommand = vscode.commands.registerCommand(
    "storytree.openDashboard",
    async () => {
      if (webviewManager) {
        await webviewManager.showDashboard();
      }
    }
  );

  const toggleAIChatCommand = vscode.commands.registerCommand(
    "storytree.toggleAIChat",
    async () => {
      if (webviewManager) {
        await webviewManager.toggleAIChat();
      }
    }
  );

  const newProjectCommand = vscode.commands.registerCommand(
    "storytree.newProject",
    async () => {
      if (webviewManager) {
        await webviewManager.createNewProject();
      }
    }
  );

  const newChapterCommand = vscode.commands.registerCommand(
    "storytree.newChapter",
    async () => {
      if (webviewManager) {
        await webviewManager.createNewChapter();
      }
    }
  );

  const showSettingsCommand = vscode.commands.registerCommand(
    "storytree.showSettings",
    async () => {
      vscode.commands.executeCommand("workbench.action.openSettings", "storytree");
    }
  );

  const wordCountCommand = vscode.commands.registerCommand(
    "storytree.wordCount",
    async () => {
      if (webviewManager) {
        await webviewManager.showWordCount();
      }
    }
  );

  const refreshCommand = vscode.commands.registerCommand(
    "storytree.refresh",
    async () => {
      if (webviewManager) {
        await webviewManager.refresh();
      }
    }
  );

  extensionContext.subscriptions.push(
    openDashboardCommand,
    toggleAIChatCommand,
    newProjectCommand,
    newChapterCommand,
    showSettingsCommand,
    wordCountCommand,
    refreshCommand
  );

  console.log("[StoryTree] All commands registered (7 total)");
}
