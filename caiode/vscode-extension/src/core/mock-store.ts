/**
 * Mock Data Store - In-Memory Database Simulation
 *
 * Provides mock data for development and testing.
 * Simulates Prisma/SQLite operations without actual database.
 *
 * Features:
 * - CRUD operations for all entities
 * - Auto-incrementing IDs
 * - Relationship support (Project → Chapters, Characters, etc.)
 * - Search and filtering
 */

export interface MockEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends MockEntity {
  name: string;
  description?: string;
  genre?: string;
  status: "draft" | "in_progress" | "completed" | "archived";
}

export interface Chapter extends MockEntity {
  projectId: string;
  title: string;
  content?: string;
  order: number;
  wordCount: number;
  status: "outline" | "draft" | "review" | "final";
  parentId?: string;
}

export interface Character extends MockEntity {
  projectId: string;
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  description?: string;
  traits?: string[];
  backstory?: string;
}

export interface WorldSetting extends MockEntity {
  projectId: string;
  category: "location" | "organization" | "magic_system" | "technology" | "culture" | "other";
  name: string;
  description?: string;
  details?: Record<string, unknown>;
}

export interface OutlineNode extends MockEntity {
  projectId: string;
  chapterId?: string;
  type: "act" | "arc" | "scene" | "beat";
  title: string;
  synopsis?: string;
  order: number;
  parentId?: string;
  childrenIds?: string[];
}

export class MockDataStore<T extends MockEntity> {
  private items: Map<string, T> = new Map();
  private counter: number = 0;

  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): T {
    const id = this.generateId();
    const now = new Date().toISOString();

    const entity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;

    this.items.set(id, entity);
    return entity;
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  findAll(filter?: (item: T) => boolean): T[] {
    if (!filter) return Array.from(this.items.values());
    return Array.from(this.items.values()).filter(filter);
  }

  update(id: string, data: Partial<Omit<T, "id" | "createdAt">>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...data,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  count(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  private generateId(): string {
    this.counter++;
    return `mock-${Date.now()}-${this.counter}`;
  }
}

export class StoryTreeMockStore {
  private projects = new MockDataStore<Project>();
  private chapters = new MockDataStore<Chapter>();
  private characters = new MockDataStore<Character>();
  private worldSettings = new MockDataStore<WorldSetting>();
  private outlineNodes = new MockDataStore<OutlineNode>();

  public initialize(): void {
    this.seedSampleData();
  }

  public reset(): void {
    this.projects.clear();
    this.chapters.clear();
    this.characters.clear();
    this.worldSettings.clear();
    this.outlineNodes.clear();
    this.initialize();
  }

  getProjects() {
    return this.projects.findAll();
  }

  getProjectById(id: string) {
    return this.projects.findById(id);
  }

  getChaptersByProject(projectId: string) {
    return this.chapters.findAll((ch) => ch.projectId === projectId);
  }

  getChapterById(id: string) {
    return this.chapters.findById(id);
  }

  getCharactersByProject(projectId: string) {
    return this.characters.findAll((ch) => ch.projectId === projectId);
  }

  getWorldSettingsByProject(projectId: string) {
    return this.worldSettings.findAll((ws) => ws.projectId === projectId);
  }

  getOutlineByProject(projectId: string) {
    return this.outlineNodes.findAll((on) => on.projectId === projectId);
  }

  createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">) {
    return this.projects.create(data);
  }

  createChapter(data: Omit<Chapter, "id" | "createdAt" | "updatedAt">) {
    return this.chapters.create(data);
  }

  createCharacter(data: Omit<Character, "id" | "createdAt" | "updatedAt">) {
    return this.characters.create(data);
  }

  createWorldSetting(data: Omit<WorldSetting, "id" | "createdAt" | "updatedAt">) {
    return this.worldSettings.create(data);
  }

  search(query: { type: "project" | "chapter" | "character"; keyword: string }) {
    switch (query.type) {
      case "project":
        return this.projects.findAll(
          (p) => p.name.includes(query.keyword) || (p.description ?? "").includes(query.keyword)
        );
      case "chapter":
        return this.chapters.findAll(
          (c) => c.title.includes(query.keyword)
        );
      case "character":
        return this.characters.findAll(
          (c) => c.name.includes(query.keyword) || (c.description ?? "").includes(query.keyword)
        );
      default:
        return [];
    }
  }

  getStats() {
    return {
      projects: this.projects.count(),
      chapters: this.chapters.count(),
      characters: this.characters.count(),
      worldSettings: this.worldSettings.count(),
      outlineNodes: this.outlineNodes.count(),
    };
  }

  private seedSampleData(): void {
    const project1 = this.createProject({
      name: "星际迷途：归乡",
      description: "一部关于太空探索与身份认同的科幻小说",
      genre: "科幻",
      status: "in_progress",
    });

    for (let i = 1; i <= 5; i++) {
      this.createChapter({
        projectId: project1.id,
        title: `第${i}章：${["启程", "遭遇", "转折", "危机", "回归"][i - 1]}`,
        order: i,
        wordCount: [2500, 3200, 4100, 3800, 5200][i - 1],
        status: i <= 2 ? "final" : "draft",
      });
    }

    this.createCharacter({
      projectId: project1.id,
      name: "林远航",
      role: "protagonist",
      description: "前地球联邦宇航员，因时空异常流落到未知星系",
      traits: ["勇敢", "好奇", "固执"],
      backstory: "出生在地球轨道空间站，从小梦想探索星辰大海",
    });

    this.createCharacter({
     projectId: project1.id,
      name: "艾拉",
      role: "supporting",
      description: "神秘的外星种族少女，拥有心灵感应能力",
      traits: ["智慧", "善良", "神秘"],
    });

    this.createCharacter({
      projectId: project1.id,
      name: "指挥官凯恩",
      role: "antagonist",
      description: "地球联邦追捕部队指挥官，坚信林远航是叛徒",
      traits: ["冷酷", "执着", "正义感扭曲"],
    });

    this.createWorldSetting({
      projectId: project1.id,
      category: "location",
      name: "新地平线空间站",
      description: "故事开始的地方，位于银河系边缘的废弃空间站",
      details: { population: 5000, establishedYear: "2287" },
    });

    this.createWorldSetting({
      projectId: project1.id,
      category: "organization",
      name: "星际联盟",
      description: "统治已知宇宙的政治实体",
      details: { memberWorlds: 1200, capital: "地球" },
    });
  }
}

export const mockStore = new StoryTreeMockStore();

export function initializeMockStore(): void {
  mockStore.initialize();
}
