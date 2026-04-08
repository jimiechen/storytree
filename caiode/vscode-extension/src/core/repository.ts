import { SQLiteDatabaseManager } from "./sqlite-db";

export interface Project {
  id: string;
  name: string;
  description: string;
  genre: string;
  status: "draft" | "in_progress" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  content: string;
  order_num: number;
  word_count: number;
  status: "outline" | "draft" | "review" | "final";
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  description: string;
  traits: string;
  created_at: string;
  updated_at: string;
}

export interface WorldSetting {
  id: string;
  project_id: string;
  name: string;
  category: "location" | "organization" | "magic_system" | "technology" | "culture" | "other";
  description: string;
  details: string;
  created_at: string;
  updated_at: string;
}

export interface OutlineNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  type: "root" | "volume" | "arc" | "chapter" | "scene" | "note";
  order_num: number;
  content: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export class StoryTreeRepository {
  constructor(private db: SQLiteDatabaseManager) {}

  getProjects(): Project[] {
    return this.db.all<Project>(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
  }

  getProjectById(id: string): Project | undefined {
    return this.db.get<Project>("SELECT * FROM projects WHERE id = ?", [id]);
  }

  createProject(data: {
    id?: string;
    name: string;
    description?: string;
    genre?: string;
    status?: Project["status"];
  }): Project {
    const id = data.id || `proj-${Date.now()}`;
    this.db
      .prepare(
        `INSERT INTO projects (id, name, description, genre, status) VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, data.name, data.description || "", data.genre || "", data.status || "draft");

    return this.getProjectById(id)!;
  }

  updateProject(
    id: string,
    data: Partial<Omit<Project, "id" | "created_at">>
  ): Project | undefined {
    const existing = this.getProjectById(id);
    if (!existing) return undefined;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name); }
    if (data.description !== undefined) { sets.push("description = ?"); params.push(data.description); }
    if (data.genre !== undefined) { sets.push("genre = ?"); params.push(data.genre); }
    if (data.status !== undefined) { sets.push("status = ?"); params.push(data.status); }

    sets.push("updated_at = datetime('now')");
    params.push(id);

    this.db
      .prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`)
      .run(...params);

    return this.getProjectById(id);
  }

  deleteProject(id: string): boolean {
    const result = this.db.run("DELETE FROM projects WHERE id = ?", [id]);
    return result.changes > 0;
  }

  getChaptersByProject(projectId: string): Chapter[] {
    return this.db.all<Chapter>(
      "SELECT * FROM chapters WHERE project_id = ? ORDER BY order_num ASC",
      [projectId]
    );
  }

  getChapterById(id: string): Chapter | undefined {
    return this.db.get<Chapter>("SELECT * FROM chapters WHERE id = ?", [id]);
  }

  createChapter(data: {
    id?: string;
    project_id: string;
    title: string;
    content?: string;
    order_num?: number;
    word_count?: number;
    status?: Chapter["status"];
  }): Chapter {
    const id = data.id || `ch-${Date.now()}`;
    this.db
      .prepare(
        `INSERT INTO chapters (id, project_id, title, content, order_num, word_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.project_id,
        data.title,
        data.content || "",
        data.order_num ?? 0,
        data.word_count ?? 0,
        data.status || "outline"
      );

    return this.getChapterById(id)!;
  }

  updateChapter(
    id: string,
    data: Partial<Omit<Chapter, "id" | "project_id" | "created_at">>
  ): Chapter | undefined {
    const existing = this.getChapterById(id);
    if (!existing) return undefined;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) { sets.push("title = ?"); params.push(data.title); }
    if (data.content !== undefined) { sets.push("content = ?"); params.push(data.content); }
    if (data.order_num !== undefined) { sets.push("order_num = ?"); params.push(data.order_num); }
    if (data.word_count !== undefined) { sets.push("word_count = ?"); params.push(data.word_count); }
    if (data.status !== undefined) { sets.push("status = ?"); params.push(data.status); }

    sets.push("updated_at = datetime('now')");
    params.push(id);

    this.db
      .prepare(`UPDATE chapters SET ${sets.join(", ")} WHERE id = ?`)
      .run(...params);

    return this.getChapterById(id);
  }

  deleteChapter(id: string): boolean {
    const result = this.db.run("DELETE FROM chapters WHERE id = ?", [id]);
    return result.changes > 0;
  }

  getCharactersByProject(projectId: string): Character[] {
    return this.db.all<Character>(
      "SELECT * FROM characters WHERE project_id = ? ORDER BY name ASC",
      [projectId]
    );
  }

  getCharacterById(id: string): Character | undefined {
    return this.db.get<Character>("SELECT * FROM characters WHERE id = ?", [id]);
  }

  createCharacter(data: {
    id?: string;
    project_id: string;
    name: string;
    role?: Character["role"];
    description?: string;
    traits?: string[];
  }): Character {
    const id = data.id || `char-${Date.now()}`;
    this.db
      .prepare(
        `INSERT INTO characters (id, project_id, name, role, description, traits) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.project_id,
        data.name,
        data.role || "supporting",
        data.description || "",
        JSON.stringify(data.traits || [])
      );

    return this.getCharacterById(id)!;
  }

  updateCharacter(
    id: string,
    data: Partial<Omit<Character, "id" | "project_id" | "created_at">>
  ): Character | undefined {
    const existing = this.getCharacterById(id);
    if (!existing) return undefined;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name); }
    if (data.role !== undefined) { sets.push("role = ?"); params.push(data.role); }
    if (data.description !== undefined) { sets.push("description = ?"); params.push(data.description); }
    if (data.traits !== undefined) { sets.push("traits = ?"); params.push(JSON.stringify(data.traits)); }

    sets.push("updated_at = datetime('now')");
    params.push(id);

    this.db
      .prepare(`UPDATE characters SET ${sets.join(", ")} WHERE id = ?`)
      .run(...params);

    return this.getCharacterById(id);
  }

  deleteCharacter(id: string): boolean {
    const result = this.db.run("DELETE FROM characters WHERE id = ?", [id]);
    return result.changes > 0;
  }

  getWorldSettingsByProject(projectId: string): WorldSetting[] {
    return this.db.all<WorldSetting>(
      "SELECT * FROM world_settings WHERE project_id = ? ORDER BY category, name",
      [projectId]
    );
  }

  getOutlineNodesByProject(projectId: string): OutlineNode[] {
    return this.db.all<OutlineNode>(
      "SELECT * FROM outline_nodes WHERE project_id = ? ORDER BY order_num ASC",
      [projectId]
    );
  }

  search(query: string): Array<{ type: string; item: unknown }> {
    const likePattern = `%${query}%`;
    const results: Array<{ type: string; item: unknown }> = [];

    const projects = this.db.all<Project>(
      "SELECT * FROM projects WHERE name LIKE ? OR description LIKE ? OR genre LIKE ?",
      [likePattern, likePattern, likePattern]
    );
    projects.forEach((p) => results.push({ type: "project", item: p }));

    const chapters = this.db.all<Chapter>(
      "SELECT * FROM chapters WHERE title LIKE ? OR content LIKE ?",
      [likePattern, likePattern]
    );
    chapters.forEach((c) => results.push({ type: "chapter", item: c }));

    const characters = this.db.all<Character>(
      "SELECT * FROM characters WHERE name LIKE ? OR description LIKE ?",
      [likePattern, likePattern]
    );
    characters.forEach((c) => results.push({ type: "character", item: c }));

    const worldSettings = this.db.all<WorldSetting>(
      "SELECT * FROM world_settings WHERE name LIKE ? OR description LIKE ?",
      [likePattern, likePattern]
    );
    worldSettings.forEach((w) => results.push({ type: "world_setting", item: w }));

    return results;
  }

  getMockStats(): {
    projects: number;
    chapters: number;
    characters: number;
    worldSettings: number;
    outlineNodes: number;
  } {
    return {
      projects: this.db.get<{ c: number }>("SELECT COUNT(*) as c FROM projects")?.c ?? 0,
      chapters: this.db.get<{ c: number }>("SELECT COUNT(*) as c FROM chapters")?.c ?? 0,
      characters: this.db.get<{ c: number }>("SELECT COUNT(*) as c FROM characters")?.c ?? 0,
      worldSettings: this.db.get<{ c: number }>("SELECT COUNT(*) as c FROM world_settings")?.c ?? 0,
      outlineNodes: this.db.get<{ c: number }>("SELECT COUNT(*) as c FROM outline_nodes")?.c ?? 0,
    };
  }
}
