import * as fs from "fs";
import * as path from "path";

export interface DatabaseConfig {
  dbPath: string;
  WALMode?: boolean;
  foreignKeys?: boolean;
  journalMode?: string;
}

interface Migration {
  version: number;
  name: string;
  up: (db: unknown) => void;
  down: (db: unknown) => void;
}

const SCHEMA_VERSION = 1;

export class SQLiteDatabaseManager implements AsyncDisposable {
  private config: DatabaseConfig;
  private db: unknown = null;
  private initialized = false;

  constructor(config: DatabaseConfig) {
    this.config = {
      journalMode: "WAL",
      foreignKeys: true,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const Database = await this.importDriver();
    const dirPath = path.dirname(this.config.dbPath);

    await fs.promises.mkdir(dirPath, { recursive: true });

    this.db = new (Database as new (path: string) => unknown)(this.config.dbPath);

    this.initialized = true;

    this.pragma("journal_mode = " + (this.config.journalMode || "WAL"));

    if (this.config.foreignKeys !== false) {
      this.pragma("foreign_keys = ON");
    }

    this.runMigrations();
  }

  private async importDriver(): Promise<unknown> {
    try {
      const betterSqlite3 = await import("better-sqlite3");
      return betterSqlite3.default || betterSqlite3;
    } catch {
      throw new Error(
        "better-sqlite3 is required. Install with: npm install better-sqlite3"
      );
    }
  }

  getDb(): unknown {
    if (!this.initialized) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  pragma(sql: string): unknown {
    const db = this.getDb() as {
      pragma: (sql: string) => unknown;
    };
    return db.pragma(sql);
  }

  prepare(sql: string): {
    run: (...args: unknown[]) => { changes: number; lastInsertRowid: number };
    get: <T>(...args: unknown[]) => T | undefined;
    all: <T>(...args: unknown[]) => T[];
  } {
    const db = this.getDb() as {
      prepare: (sql: string) => {
        run: (...args: unknown[]) => { changes: number; lastInsertRowid: number };
        get: <T>(...args: unknown[]) => T | undefined;
        all: <T>(...args: unknown[]) => T[];
      };
    };
    return db.prepare(sql);
  }

  run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number } {
    const stmt = this.prepare(sql) as {
      run: (...args: unknown[]) => { changes: number; lastInsertRowid: number };
    };
    return stmt.run(...(params || []));
  }

  get<T>(sql: string, params?: unknown[]): T | undefined {
    const stmt = this.prepare(sql) as {
      get: (...args: unknown[]) => T | undefined;
    };
    return stmt.get(...(params || []));
  }

  all<T>(sql: string, params?: unknown[]): T[] {
    const stmt = this.prepare(sql) as {
      all: (...args: unknown[]) => T[];
    };
    return stmt.all(...(params || []));
  }

  exec(sql: string): void {
    const db = this.getDb() as { exec: (sql: string) => void };
    db.exec(sql);
  }

  transaction<T>(fn: () => T): T {
    const db = this.getDb() as {
      transaction: <T>(fn: () => T) => T;
    };
    return db.transaction(fn);
  }

  private runMigrations(): void {
    this.exec(`
      CREATE TABLE IF NOT EXISTS __schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const currentVersion =
      this.get<{ version: number }>(
        "SELECT MAX(version) as version FROM __schema_migrations"
      )?.version ?? 0;

    if (currentVersion >= SCHEMA_VERSION) return;

    const migrations = this.getMigrations();

    for (const migration of migrations) {
      if (migration.version <= currentVersion) continue;

      this.exec("BEGIN");
      try {
        migration.up(this.db);
        this.prepare(
          "INSERT INTO __schema_migrations (version, name) VALUES (?, ?)"
        ).run(migration.version, migration.name);
        this.exec("COMMIT");
      } catch (e) {
        this.exec("ROLLBACK");
        throw e;
      }
    }
  }

  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: "initial_schema",
        up: (db: unknown) => {
          const d = db as { exec: (sql: string) => void };

          d.exec(`
            CREATE TABLE IF NOT EXISTS projects (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT DEFAULT '',
              genre TEXT DEFAULT '',
              status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'in_progress', 'completed', 'archived')),
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
          `);

          d.exec(`
            CREATE TABLE IF NOT EXISTS chapters (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              title TEXT NOT NULL,
              content TEXT DEFAULT '',
              order_num INTEGER NOT NULL DEFAULT 0,
              word_count INTEGER DEFAULT 0,
              status TEXT DEFAULT 'outline' CHECK(status IN ('outline', 'draft', 'review', 'final')),
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              updated_at TEXT NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
          `);

          d.exec(`
            CREATE TABLE IF NOT EXISTS characters (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              name TEXT NOT NULL,
              role TEXT DEFAULT 'supporting' CHECK(role IN ('protagonist', 'antagonist', 'supporting', 'minor')),
              description TEXT DEFAULT '',
              traits TEXT DEFAULT '[]',
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              updated_at TEXT NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
          `);

          d.exec(`
            CREATE TABLE IF NOT EXISTS world_settings (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              name TEXT NOT NULL,
              category TEXT DEFAULT 'other' CHECK(category IN ('location', 'organization', 'magic_system', 'technology', 'culture', 'other')),
              description TEXT DEFAULT '',
              details TEXT DEFAULT '{}',
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              updated_at TEXT NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
          `);

          d.exec(`
            CREATE TABLE IF NOT EXISTS outline_nodes (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              parent_id TEXT,
              title TEXT NOT NULL,
              type TEXT DEFAULT 'chapter' CHECK(type IN ('root', 'volume', 'arc', 'chapter', 'scene', 'note')),
              order_num INTEGER DEFAULT 0,
              content TEXT DEFAULT '',
              metadata TEXT DEFAULT '{}',
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              updated_at TEXT NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
              FOREIGN KEY (parent_id) REFERENCES outline_nodes(id) ON DELETE SET NULL
            )
          `);

          d.exec(`
            CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id)
          `);
          d.exec(`
            CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id)
          `);
          d.exec(`
            CREATE INDEX IF NOT EXISTS idx_world_settings_project ON world_settings(project_id)
          `);
          d.exec(`
            CREATE INDEX IF NOT EXISTS idx_outline_nodes_project ON outline_nodes(project_id)
          `);
          d.exec(`
            CREATE INDEX IF NOT EXISTS idx_outline_nodes_parent ON outline_nodes(parent_id)
          `);
        },
        down: (_db: unknown) => {},
      },
    ];
  }

  seedSampleData(): void {
    const projectId = "proj-001";

    const existing = this.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM projects"
    );

    if (existing && existing.count > 0) return;

    this.transaction(() => {
      this.prepare(
        `INSERT INTO projects (id, name, description, genre, status) VALUES (?, ?, ?, ?, ?)`
      ).run(
        projectId,
        "星际迷途：归乡",
        "在遥远的未来，人类文明散落在银河系的各个角落。一名年轻飞行员在执行例行任务时，意外发现了一个改变命运的坐标。",
        "科幻",
        "in_progress"
      );

      const chapterData = [
        ["ch-001", projectId, "第一章：启程", "故事从这里开始...", 1, 0, "draft"],
        ["ch-002", projectId, "第二章：暗流", "黑暗中潜伏着未知的威胁。", 2, 1500, "draft"],
        ["ch-003", projectId, "第三章：发现", "他们发现了古老的遗迹。", 3, 3200, "draft"],
        ["ch-004", projectId, "第四章：抉择", "面对艰难的抉择，林远航必须做出决定。", 4, 5800, "outline"],
        ["ch-005", projectId, "第五章：回归", "最终，回家的路就在眼前。", 5, 12000, "outline"],
      ];

      const insertChapter = this.prepare(
        `INSERT INTO chapters (id, project_id, title, content, order_num, word_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      for (const ch of chapterData) {
        insertChapter.run(...ch);
      }

      const characterData = [
        ["char-001", projectId, "林远航", "protagonist", "年轻的飞船驾驶员，勇敢而好奇。", JSON.stringify(["勇敢", "好奇", "正义感"])],
        ["char-002", projectId, "艾拉", "antagonist", "神秘的反抗军领袖，目的不明。", JSON.stringify(["神秘", "智慧", "冷酷"])],
        ["char-003", projectId, "老陈", "supporting", "经验丰富的工程师，林远航的导师。", JSON.stringify(["经验丰富", "幽默", "可靠"])],
      ];

      const insertCharacter = this.prepare(
        `INSERT INTO characters (id, project_id, name, role, description, traits) VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (const ch of characterData) {
        insertCharacter.run(...ch);
      }

      const worldData = [
        ["ws-001", projectId, "新地平线空间站", "location", "一座废弃的大型空间站，曾是人类的希望灯塔。", JSON.stringify({ population: 5000, yearBuilt: 2287 })],
        ["ws-002", projectId, "星际联盟", "organization", "统治已知宇宙大部分区域的联合政府组织。", JSON.stringify({ headquarters: "地球轨道", memberWorlds: 127 })],
      ];

      const insertWorld = this.prepare(
        `INSERT INTO world_settings (id, project_id, name, category, description, details) VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (const ws of worldData) {
        insertWorld.run(...ws);
      }
    });
  }

  getStats(): {
    tables: Array<{ name: string; rows: number }>;
    totalRows: number;
    version: number;
    dbPath: string;
  } {
    const tables = this.all<{ name: string; rows: number }>(
      "SELECT name, (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as rows FROM sqlite_master m WHERE type='table' AND name NOT LIKE '__%' ORDER BY name"
    );

    const totalRows = tables.reduce((sum, t) => sum + t.rows, 0);

    const version = this.get<{ version: number }>(
      "SELECT MAX(version) as version FROM __schema_migrations"
    )?.version ?? 0;

    return {
      tables: tables || [],
      totalRows,
      version,
      dbPath: this.config.dbPath,
    };
  }

  close(): void {
    if (this.db) {
      const d = this.db as { close: () => void };
      d.close();
      this.db = null;
      this.initialized = false;
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.close();
  }
}
