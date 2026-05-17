/**
 * Webview Panel Manager
 *
 * Manages the lifecycle of VS Code Webview panels,
 * including creation, message handling, and resource loading.
 */
import * as vscode from "vscode";
import { MessageRouter } from "../core/message-router";
export declare class WebviewPanelManager implements vscode.Disposable {
    private panel;
    private context;
    private router;
    private disposables;
    constructor(context: vscode.ExtensionContext, router: MessageRouter);
    showDashboard(): Promise<void>;
    refresh(): Promise<void>;
    getPanel(): vscode.WebviewPanel | undefined;
    dispose(): void;
    private setupWebviewContent;
    private setupMessageHandler;
    private setupPanelLifecycle;
    private getHtmlForWebview;
}
//# sourceMappingURL=panel-manager.d.ts.map