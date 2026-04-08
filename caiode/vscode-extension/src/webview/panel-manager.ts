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
