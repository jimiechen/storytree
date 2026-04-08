import * as vscode from "vscode";

export interface CommandDefinition {
  id: string;
  title: string;
  handler: (...args: any[]) => any;
  keybinding?: string;
  category?: string;
}

const STORYTREE_COMMANDS: CommandDefinition[] = [
  {
    id: "storytree.openDashboard",
    title: "Open StoryTree Dashboard",
    handler: () => {
      vscode.commands.executeCommand("storytree.dashboard.open");
    },
    keybinding: "cmd+shift+t",
  },
  {
    id: "storytree.newProject",
    title: "Create New Project",
    handler: () => {
      vscode.commands.executeCommand("storytree.project.create");
    },
    keybinding: "cmd+shift+n",
  },
  {
    id: "storytree.newChapter",
    title: "Create New Chapter",
    handler: () => {
      vscode.commands.executeCommand("storytree.chapter.create");
    },
    keybinding: "cmd+shift+c",
  },
  {
    id: "storytree.toggleAIChat",
    title: "Toggle AI Chat Panel",
    handler: () => {
      vscode.commands.executeCommand("storytree.ai.chat.toggle");
    },
    keybinding: "cmd+shift+i",
  },
  {
    id: "storytree.showSettings",
    title: "Open StoryTree Settings",
    handler: () => {
      vscode.commands.executeCommand("storytree.settings.open");
    },
    keybinding: "cmd+shift+,",
  },
  {
    id: "storytree.wordCount",
    title: "Show Word Count Statistics",
    handler: () => {
      vscode.commands.executeCommand("storytree.stats.wordcount");
    },
  },
];

export class CommandPaletteManager {
  private disposables: vscode.Disposable[] = [];
  private registeredCommands: Set<string> = new Set();

  registerAll(context: vscode.ExtensionContext): void {
    for (const cmd of STORYTREE_COMMANDS) {
      this.register(context, cmd);
    }
  }

  register(context: vscode.ExtensionContext, command: CommandDefinition): void {
    if (this.registeredCommands.has(command.id)) return;

    const disposable = vscode.commands.registerCommand(command.id, command.handler);
    context.subscriptions.push(disposable);
    this.disposables.push(disposable);
    this.registeredCommands.add(command.id);

    if (command.keybinding) {
      const keybindingDisposable = vscode.commands.registerCommand(
        `${command.id}.keybind`,
        command.handler,
      );
      context.subscriptions.push(keybindingDisposable);
      this.disposables.push(keybindingDisposable);
    }
  }

  getRegisteredCommands(): string[] {
    return Array.from(this.registeredCommands);
  }

  isCommandRegistered(id: string): boolean {
    return this.registeredCommands.has(id);
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
    this.registeredCommands.clear();
  }
}
