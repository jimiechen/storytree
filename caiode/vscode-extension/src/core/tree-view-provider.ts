import * as vscode from "vscode";
import type { StoryTreeRepository } from "./repository";

export interface TreeProjectNode {
  id: string;
  label: string;
  type: "project";
  collapsibleState: vscode.TreeItemCollapsibleState;
  iconPath?: vscode.ThemeIcon;
  description?: string;
  tooltip?: string;
}

export interface TreeChapterNode {
  id: string;
  projectId: string;
  label: string;
  type: "chapter";
  collapsibleState: vscode.TreeItemCollapsibleState.Collapsed;
  iconPath?: vscode.ThemeIcon;
  description?: string;
  wordCount?: number;
  orderIndex: number;
}

export interface TreeSceneNode {
  id: string;
  chapterId: string;
  label: string;
  type: "scene";
  collapsibleState: vscode.TreeItemCollapsibleState.None;
  iconPath?: vscode.ThemeIcon;
  description?: string;
}

export type StoryTreeNode = TreeProjectNode | TreeChapterNode | TreeSceneNode;

export class StoryTreeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly node: StoryTreeNode,
  ) {
    super(node.label, node.collapsibleState);
    this.id = node.id;
    this.iconPath = node.iconPath || new vscode.ThemeIcon("file");
    this.description = node.description;
    if ("tooltip" in node && node.tooltip) {
      this.tooltip = node.tooltip;
    }
    this.contextValue = node.type;
  }
}

export class StoryTreeTreeViewProvider
  implements vscode.TreeDataProvider<StoryTreeTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<StoryTreeTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private projects: Array<{
    id: string; name: string; description?: string;
  }> = [];

  constructor(private repository: StoryTreeRepository) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async getChildren(element?: StoryTreeTreeItem): Promise<StoryTreeTreeItem[]> {
    if (!element) {
      return this.getProjectItems();
    }

    const node = element.node;

    switch (node.type) {
      case "project":
        return this.getChapterItems(node.id);
      case "chapter":
        return this.getSceneItems(node);
      default:
        return [];
    }
  }

  getTreeItem(element: StoryTreeTreeItem): vscode.TreeItem {
    return element;
  }

  async getProjectItems(): Promise<StoryTreeTreeItem[]> {
    try {
      const projectList = await this.repository.getProjects();
      this.projects = projectList.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || undefined,
      }));

      return this.projects.map(
        (p): StoryTreeTreeItem => {
          const node: TreeProjectNode = {
            id: `proj-${p.id}`,
            label: p.name,
            type: "project",
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            iconPath: new vscode.ThemeIcon("book"),
            description: undefined,
            tooltip: `${p.name}${p.description ? `\n${p.description}` : ""}`,
          };
          return new StoryTreeTreeItem(node);
        },
      );
    } catch (err) {
      console.error("Failed to load projects for tree view:", err);
      return [];
    }
  }

  async getChapterItems(projectId: string): Promise<StoryTreeTreeItem[]> {
    try {
      const chapters = await this.repository.getChaptersByProject(projectId);

      return chapters.map(
        (ch, index): StoryTreeTreeItem => {
          const wc = ch.word_count ?? ch.content?.length ?? 0;
          const displayWc = wc > 1000 ? `${(wc / 1000).toFixed(1)}k` : String(wc);
          const node: TreeChapterNode = {
            id: `ch-${ch.id}`,
            projectId,
            label: ch.title || `Chapter ${index + 1}`,
            type: "chapter",
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: new vscode.ThemeIcon(ch.status === "final" ? "check" : "file-code"),
            description: `${displayWc}w`,
            wordCount: wc,
            orderIndex: ch.order_num ?? index,
          };
          return new StoryTreeTreeItem(node);
        },
      );
    } catch (err) {
      console.error(`Failed to load chapters for project ${projectId}:`, err);
      return [];
    }
  }

  async getSceneItems(chapterNode: TreeChapterNode): Promise<StoryTreeTreeItem[]> {
    try {
      const outlineNodes = await this.repository.getOutlineNodesByChapterId(
        chapterNode.id.replace("ch-", ""),
      );

      return outlineNodes.slice(0, 20).map(
        (node, i): StoryTreeTreeItem => {
          const sceneNode: TreeSceneNode = {
            id: `scene-${node.id}`,
            chapterId: chapterNode.id.replace("ch-", ""),
            label: node.title || `Scene ${i + 1}`,
            type: "scene",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            iconPath: new vscode.ThemeIcon(
              node.type === "scene"
                ? "list-ordered"
                : node.type === "note"
                  ? "note"
                  : "symbol-text",
            ),
            description: undefined,
          };
          return new StoryTreeTreeItem(sceneNode);
        },
      );
    } catch (err) {
      console.error(`Failed to load scenes for chapter ${chapterNode.id}:`, err);
      return [];
    }
  }
}
