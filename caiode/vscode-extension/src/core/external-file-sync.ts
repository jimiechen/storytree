import * as vscode from "vscode";

export interface FileSyncConfig {
  watchGlob: string;
  debounceMs?: number;
  onFileChanged?: (uri: vscode.Uri, changeType: FileChangeType) => void;
}

export type FileChangeType = "created" | "changed" | "deleted";

export class ExternalFileSync {
  private watcher: vscode.FileSystemWatcher | null = null;
  private config: FileSyncConfig;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingChanges: Map<string, FileChangeType> = new Map();
  private _onDidChange = new vscode.EventEmitter<{
    uri: vscode.Uri;
    changeType: FileChangeType;
  }>();
  readonly onDidChange = this._onDidChange.event;

  constructor(config: FileSyncConfig) {
    this.config = { ...config, debounceMs: config.debounceMs ?? 300 };
  }

  start(): void {
    if (this.watcher) return;

    this.watcher = vscode.workspace.createFileSystemWatcher(
      this.config.watchGlob,
      false,
      false,
      false,
    );

    this.watcher.onDidCreate((uri) => this.enqueue(uri, "created"));
    this.watcher.onDidChange((uri) => this.enqueue(uri, "changed"));
    this.watcher.onDidDelete((uri) => this.enqueue(uri, "deleted"));
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingChanges.clear();
  }

  get isActive(): boolean {
    return this.watcher !== null;
  }

  private enqueue(uri: vscode.Uri, changeType: FileChangeType): void {
    const key = uri.fsPath;

    const existingType = this.pendingChanges.get(key);
    if (existingType === "deleted" && (changeType === "created" || changeType === "changed")) {
      this.pendingChanges.set(key, "created");
    } else if (
      existingType === "created" &&
      changeType === "deleted"
    ) {
      this.pendingChanges.delete(key);
    } else {
      this.pendingChanges.set(key, changeType);
    }

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), this.config.debounceMs);
  }

  private flush(): void {
    for (const [path, changeType] of this.pendingChanges) {
      const uri = vscode.Uri.file(path);
      this._onDidChange.fire({ uri, changeType });
      if (this.config.onFileChanged) {
        this.config.onFileChanged(uri, changeType);
      }
    }
    this.pendingChanges.clear();
    this.debounceTimer = null;
  }

  dispose(): void {
    this.stop();
    this._onDidChange.dispose();
  }
}
