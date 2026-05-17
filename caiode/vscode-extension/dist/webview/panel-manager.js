/**
 * Webview Panel Manager
 *
 * Manages the lifecycle of VS Code Webview panels,
 * including creation, message handling, and resource loading.
 */
import * as vscode from "vscode";
export class WebviewPanelManager {
    panel;
    context;
    router;
    disposables = [];
    constructor(context, router) {
        this.context = context;
        this.router = router;
    }
    async showDashboard() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        this.panel = vscode.window.createWebviewPanel("storytree.dashboard", "StoryTree 工作台", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, "out"),
                vscode.Uri.joinPath(this.context.extensionUri, "webview-dist"),
            ],
        });
        this.setupWebviewContent();
        this.setupMessageHandler();
        this.setupPanelLifecycle();
        console.log("[WebviewManager] Dashboard panel created");
    }
    async refresh() {
        if (this.panel) {
            this.setupWebviewContent();
        }
    }
    getPanel() {
        return this.panel;
    }
    dispose() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
        while (this.disposables.length > 0) {
            const d = this.disposables.pop();
            if (d)
                d.dispose();
        }
    }
    setupWebviewContent() {
        if (!this.panel)
            return;
        const webview = this.panel.webview;
        webview.html = this.getHtmlForWebview(webview);
    }
    setupMessageHandler() {
        if (!this.panel)
            return;
        const messageHandler = async (message) => {
            try {
                const response = await this.router.processMessage(message);
                if (response && response.status !== undefined) {
                    this.panel?.webview.postMessage(response);
                }
            }
            catch (error) {
                console.error("[WebviewManager] Error processing message:", error);
            }
        };
        this.disposables.push(this.panel.webview.onDidReceiveMessage(messageHandler));
    }
    setupPanelLifecycle() {
        if (!this.panel)
            return;
        this.disposables.push(this.panel.onDidChangeViewState((e) => {
            if (e.webviewPanel.visible) {
                console.log("[WebviewManager] Panel became visible");
            }
        }));
        this.disposables.push(this.panel.onDidDispose(() => {
            console.log("[WebviewManager] Panel disposed");
            this.panel = undefined;
        }));
    }
    getHtmlForWebview(webview) {
        const extensionUri = this.context.extensionUri;
        const nonce = getNonce();
        const csp = [
            `default-src 'none'`,
            `script-src 'nonce-${nonce}'`,
            `style-src ${webview.cspSource} 'unsafe-inline'`,
            `img-src ${webview.cspSource} data: https:`,
            `font-src ${webview.cspSource} data:`,
        ].join("; ");
        return /* html */ `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>StoryTree IDE</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin: 0;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #89d185;
    }
    .card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .card h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    .card p {
      margin: 0;
      opacity: 0.7;
      font-size: 13px;
    }
    .loading {
      text-align: center;
      padding: 40px;
      opacity: 0.7;
    }
    .error {
      color: var(--vscode-errorForeground);
      background: var(--vscode-inputValidation-errorBackground);
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .success {
      color: var(--vscode-symbolIcon-colorForeground);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 StoryTree IDE</h1>
      <div class="status">
        <span class="status-dot"></span>
        已连接
      </div>
    </div>

    <div id="app">
      <div class="loading">正在加载 StoryTree 工作台...</div>
    </div>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();

      function sendMessage(action, payload) {
        return new Promise((resolve, reject) => {
          const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

          const handler = (event) => {
            const data = event.data;
            if (data.id === id || (data.jsonrpc === '2.0' && data.id === id)) {
              window.removeEventListener('message', handler);
              if (data.status === 'success') {
                resolve(data.data);
              } else {
                reject(new Error(data.error?.message || 'Request failed'));
              }
            }
          };

          window.addEventListener('message', handler);

          vscode.postMessage({
            jsonrpc: '2.0',
            id: id,
            action: action,
            payload: payload,
            timestamp: new Date().toISOString()
          });

          setTimeout(() => {
            window.removeEventListener('message', handler);
            reject(new Error('Request timeout'));
          }, 30000);
        });
      }

      async function loadDashboard() {
        const app = document.getElementById('app');

        try {
          const healthCheck = await sendMessage('system.healthCheck', {});
          console.log('[StoryTree] Health check:', healthCheck);

          const projects = await sendMessage('project.list', {});
          console.log('[StoryTree] Projects:', projects);

          app.innerHTML = renderDashboard(projects);
        } catch (error) {
          console.error('[StoryTree] Failed to load:', error);
          app.innerHTML = '<div class="error">加载失败: ' + error.message + '</div>';
        }
      }

      function renderDashboard(data) {
        const projects = data.projects || [];

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">';

        if (projects.length === 0) {
          html += '<div class="card"><h3>暂无项目</h3><p>点击下方按钮创建您的第一个小说项目</p></div>';
        } else {
          projects.forEach(project => {
            html += '<div class="card">';
            html += '<h3>' + project.name + '</h3>';
            html += '<p>' + (project.description || '暂无描述') + '</p>';
            html += '<p style="margin-top: 8px; font-size: 11px; opacity: 0.5;">创建于 ' + (project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-') + '</p>';
            html += '</div>';
          });
        }

        html += '</div>';

        html += '<div style="margin-top: 24px; text-align: center;">';
        html += '<button onclick="createProject()" style="padding: 10px 24px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">+ 创建新项目</button>';
        html += '</div>';

        return html;
      }

      window.createProject = function() {
        alert('项目创建功能将在后续版本实现');
      };

      window.addEventListener('load', loadDashboard);
    })();
  </script>
</body>
</html>`;
    }
}
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=panel-manager.js.map