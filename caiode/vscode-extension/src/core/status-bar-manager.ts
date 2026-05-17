import * as vscode from "vscode";

export interface StatusBarConfig {
  projectName?: string;
  chapterCount?: number;
  totalWords?: number;
  aiStatus?: "online" | "offline" | "config_missing" | "connecting";
}

export class StatusBarManager {
  private projectItem: vscode.StatusBarItem;
  private chaptersItem: vscode.StatusBarItem;
  private wordsItem: vscode.StatusBarItem;
  private aiStatusItem: vscode.StatusBarItem;

  constructor() {
    this.projectItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.chaptersItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      99,
    );
    this.wordsItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      98,
    );
    this.aiStatusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );

    this.projectItem.name = "StoryTree Project";
    this.chaptersItem.name = "StoryTree Chapters";
    this.wordsItem.name = "StoryTree Words";
    this.aiStatusItem.name = "StoryTree AI Status";
  }

  show(): void {
    this.projectItem.show();
    this.chaptersItem.show();
    this.wordsItem.show();
    this.aiStatusItem.show();
  }

  hide(): void {
    this.projectItem.hide();
    this.chaptersItem.hide();
    this.wordsItem.hide();
    this.aiStatusItem.hide();
  }

  update(config: StatusBarConfig): void {
    if (config.projectName) {
      this.projectItem.text = `$(book) ${config.projectName}`;
      this.projectItem.tooltip = `Current project: ${config.projectName}`;
      this.projectItem.command = "storytree.openDashboard";
    }

    if (config.chapterCount != null) {
      const count = config.chapterCount;
      this.chaptersItem.text = `$(file-code) ${count} ch${count !== 1 ? "s" : ""}`;
      this.chaptersItem.tooltip = `${count} chapter${count !== 1 ? "s" : ""}`;
      this.chaptersItem.command = "storytree.openDashboard";
    }

    if (config.totalWords != null) {
      const wc = config.totalWords;
      const formatted =
        wc >= 1_000_000
          ? `${(wc / 1_000_000).toFixed(1)}M`
          : wc >= 1_000
            ? `${(wc / 1_000).toFixed(1)}k`
            : String(wc);
      this.wordsItem.text = `$(pencil) ${formatted} words`;
      this.wordsItem.tooltip = `Total word count: ${wc.toLocaleString()}`;
      this.wordsItem.command = "storytree.wordCount";
    }

    if (config.aiStatus) {
      switch (config.aiStatus) {
        case "online":
          this.aiStatusItem.text = "$(plug) AI Connected";
          this.aiStatusItem.tooltip = "AI provider is connected and ready";
          break;
        case "offline":
          this.aiStatusItem.text = "$(circle-slash) AI Offline";
          this.aiStatusItem.tooltip = "AI provider is not available";
          break;
        case "config_missing":
          this.aiStatusItem.text = "$(warning) AI Not Configured";
          this.aiStatusItem.tooltip = "Configure AI provider in Settings";
          this.aiStatusItem.command = "storytree.showSettings";
          break;
        case "connecting":
          this.aiStatusItem.text = "$(sync~spin) Connecting...";
          this.aiStatusItem.tooltip = "Connecting to AI provider...";
          break;
      }
    }
  }

  dispose(): void {
    this.projectItem.dispose();
    this.chaptersItem.dispose();
    this.wordsItem.dispose();
    this.aiStatusItem.dispose();
  }
}
