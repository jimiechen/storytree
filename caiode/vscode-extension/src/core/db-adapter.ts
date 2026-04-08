import { SQLiteDatabaseManager } from "./sqlite-db";
import { StoryTreeRepository } from "./repository";

export interface DatabaseAdapter {
  getProjects(): Array<{ id: string; name: string; description?: string; genre?: string; status: string; createdAt?: string }>;
  getProjectById(id: string): unknown;
  createProject(data: { name: string; description?: string; genre?: string; status?: string }): unknown;
  getChaptersByProject(projectId: string): Array<unknown>;
  getChapterById(id: string): unknown;
  getCharactersByProject(projectId: string): Array<unknown>;
  getCharacterById(id: string): unknown;
  createCharacter(data: { project_id: string; name: string; role: string; description?: string; traits?: string[] }): unknown;
  getWorldSettingsByProject(projectId: string): Array<unknown>;
  getOutlineByProject(projectId: string): Array<unknown>;
  search(query: string): Array<{ type: string; item: unknown }>;
  getStats(): Record<string, number>;
}

class SQLiteAdapter implements DatabaseAdapter {
  private repo: StoryTreeRepository;

  constructor(dbManager: SQLiteDatabaseManager) {
    this.repo = new StoryTreeRepository(dbManager);
  }

  getProjects() {
    return this.repo.getProjects().map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      genre: p.genre || undefined,
      status: p.status,
      createdAt: p.created_at,
    }));
  }

  getProjectById(id: string) {
    return this.repo.getProjectById(id);
  }

  createProject(data) {
    return this.repo.createProject(data);
  }

  getChaptersByProject(projectId: string) {
    return this.repo.getChaptersByProject(projectId);
  }

  getChapterById(id: string) {
    return this.repo.getChapterById(id);
  }

  getCharactersByProject(projectId: string) {
    return this.repo.getCharactersByProject(projectId).map((c) => ({
      id: c.id,
      projectId: c.project_id,
      name: c.name,
      role: c.role,
      description: c.description || undefined,
      traits: JSON.parse(c.traits || "[]"),
    }));
  }

  getCharacterById(id: string) {
    return this.repo.getCharacterById(id);
  }

  createCharacter(data) {
    return this.repo.createCharacter(data);
  }

  getWorldSettingsByProject(projectId: string) {
    return this.repo.getWorldSettingsByProject(projectId).map((ws) => ({
      id: ws.id,
      projectId: ws.project_id,
      name: ws.name,
      category: ws.category,
      description: ws.description || undefined,
      details: JSON.parse(ws.details || "{}"),
    }));
  }

  getOutlineByProject(projectId: string) {
    return this.repo.getOutlineNodesByProject(projectId);
  }

  search(query: string) {
    return this.repo.search(query);
  }

  getStats() {
    return this.repo.getMockStats();
  }
}

export function createSQLiteAdapter(
  dbManager: SQLiteDatabaseManager
): DatabaseAdapter {
  return new SQLiteAdapter(dbManager);
}
