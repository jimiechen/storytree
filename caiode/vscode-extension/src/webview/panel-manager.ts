/**
 * Webview Panel Manager
 *
 * Manages the lifecycle of VS Code Webview panels,
 * including creation, message handling, and resource loading.
 */

import * as vscode from "vscode";
import { MessageRouter } from "../core/message-router";
import type { IPCResponse } from "../types/ipc-protocol";
import { getDashboardHtml } from "./html-generator";

export class WebviewPanelManager implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private router: MessageRouter;
  private disposables: vscode.Disposable[] = [];

  constructor(
    context: vscode.ExtensionContext,
    router: MessageRouter
  ) {
    this.context = context;
    this.router = router;
  }

  async showDashboard(): Promise<void> {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "storytree.dashboard",
      "StoryTree 工作台",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, "out"),
          vscode.Uri.joinPath(this.context.extensionUri, "webview-dist"),
        ],
      }
    );

    this.setupWebviewContent();
    this.setupMessageHandler();
    this.setupPanelLifecycle();

    console.log("[WebviewManager] Dashboard panel created");
  }

  async toggleAIChat(): Promise<void> {
    const aiChatPanel = vscode.window.createWebviewPanel(
      "storytree.aiChat",
      "StoryTree AI 对话",
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    const nonce = getNonce();
    const { getAIChatPanelHtml } = await import("./ai-chat-panel");
    aiChatPanel.webview.html = getAIChatPanelHtml({ nonce });

    console.log("[WebviewManager] AI Chat panel opened");
  }

  async createNewProject(): Promise<void> {
    const projectName = await vscode.window.showInputBox({
      prompt: "输入新项目名称",
      placeHolder: "例如：星际迷途",
    });

    if (!projectName) return;

    try {
      const response = await this.router.processMessage({
        jsonrpc: "2.0",
        id: Date.now().toString(),
        action: "project.create",
        payload: { name: projectName },
      });

      if (response?.status === "success") {
        vscode.window.showInformationMessage(`项目 "${projectName}" 创建成功!`);
        await this.refresh();
      }
    } catch (error) {
      vscode.window.showErrorMessage(`创建项目失败: ${error}`);
    }
  }

  async createNewChapter(): Promise<void> {
    const chapterTitle = await vscode.window.showInputBox({
      prompt: "输入新章节标题",
      placeHolder: "例如：第一章 启程",
    });

    if (!chapterTitle) return;

    try {
      await this.router.processMessage({
        jsonrpc: "2.0",
        id: Date.now().toString(),
        action: "chapter.create",
        payload: { title: chapterTitle },
      });

      vscode.window.showInformationMessage(`章节 "${chapterTitle}" 创建成功!`);
      await this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`创建章节失败: ${error}`);
    }
  }

  async showWordCount(): Promise<void> {
    try {
      const response = await this.router.processMessage({
        jsonrpc: "2.0",
        id: Date.now().toString(),
        action: "system.healthCheck",
        payload: {},
      });

      const mockStats = (response && response.status === "success" ? (response as { status: string; data: { mockStats?: Record<string, unknown> } }).data?.mockStats : {}) || {};
      const projects = Number(mockStats.projects || 0);
      const chapters = Number(mockStats.chapters || 0);

      vscode.window.showInformationMessage(
        `📊 字数统计:\n` +
        `• 项目总数: ${projects}\n` +
        `• 章节总数: ${chapters}\n` +
        `• 总字数约: ${chapters * 1500} 字 (估算)`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`获取字数统计失败: ${error}`);
    }
  }

  async refresh(): Promise<void> {
    if (this.panel) {
      this.setupWebviewContent();
    }
  }

  getPanel(): vscode.WebviewPanel | undefined {
    return this.panel;
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }

    while (this.disposables.length > 0) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  private setupWebviewContent(): void {
    if (!this.panel) return;

    const webview = this.panel.webview;
    const nonce = getNonce();

    const csp = [
      `default-src 'none'`,
      `script-src 'nonce-${nonce}'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `img-src ${webview.cspSource} data: https:`,
      `font-src ${webview.cspSource} data:`,
    ].join("; ");

    const htmlContent = getDashboardHtml(nonce);

    webview.html = htmlContent.replace(
      "<head>",
      `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`
    );
  }

  private setupMessageHandler(): void {
    if (!this.panel) return;

    const messageHandler = async (
      message: unknown
    ) => {
      try {
        const response = await this.router.processMessage(message);

        if (response && response.status !== undefined) {
          this.panel?.webview.postMessage(response);
        }
      } catch (error) {
        console.error("[WebviewManager] Error processing message:", error);
      }
    };

    this.disposables.push(
      this.panel.webview.onDidReceiveMessage(messageHandler)
    );
  }

  private setupPanelLifecycle(): void {
    if (!this.panel) return;

    this.disposables.push(
      this.panel.onDidChangeViewState((e) => {
        if (e.webviewPanel.visible) {
          console.log("[WebviewManager] Panel became visible");
        }
      })
    );

    this.disposables.push(
      this.panel.onDidDispose(() => {
        console.log("[WebviewManager] Panel disposed");
        this.panel = undefined;
      })
    );
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}
