import * as crypto from "crypto";
import * as fs from "fs";
import { DataEncryption, type EncryptedPayload } from "./data-encryption";

export interface EncryptedDBConfig {
  dbPath: string;
  encryption: DataEncryption;
  autoSaveInterval?: number;
}

interface EncryptedRecord {
  id: string;
  key: string;
  payload: EncryptedPayload;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

type TableData = Map<string, EncryptedRecord>;

export class EncryptedDatabase {
  private config: EncryptedDBConfig;
  private tables: Map<string, TableData> = new Map();
  private dirty = false;

  constructor(config: EncryptedDBConfig) {
    this.config = config;
    this.tables.set("default", new Map());
  }

  getTable(name: string): TableData {
    if (!this.tables.has(name)) {
      this.tables.set(name, new Map());
    }
    return this.tables.get(name)!;
  }

  put(table: string, key: string, value: unknown, aad?: string): string {
    const id = this.generateId();
    const tableData = this.getTable(table);
    const serialized = JSON.stringify(value);

    const payload = this.config.encryption.encrypt(serialized, aad);
    const hash = this.config.encryption.hash(serialized);

    const record: EncryptedRecord = {
      id,
      key,
      payload,
      hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tableData.set(key, record);
    this.dirty = true;

    return id;
  }

  get<T>(table: string, key: string): T | undefined {
    const tableData = this.getTable(table);
    const record = tableData.get(key);

    if (!record) return undefined;

    try {
      const decrypted = this.config.encryption.decrypt(record.payload);
      const computedHash = this.config.encryption.hash(decrypted);

      if (!this.config.encryption.verifyIntegrity(decrypted, record.hash)) {
        console.warn(`[EncryptedDB] Integrity check failed for ${table}:${key}`);
        return undefined;
      }

      return JSON.parse(decrypted) as T;
    } catch (e) {
      console.error(`[EncryptedDB] Decryption error for ${table}:${key}:`, e);
      return undefined;
    }
  }

  has(table: string, key: string): boolean {
    return this.getTable(table).has(key);
  }

  delete(table: string, key: string): boolean {
    const tableData = this.getTable(table);
    const existed = tableData.delete(key);
    if (existed) this.dirty = true;
    return existed;
  }

  keys(table: string): string[] {
    return Array.from(this.getTable(table).keys());
  }

  size(table: string): number {
    return this.getTable(table).size;
  }

  entries<T>(table: string): Array<{ key: string; value: T }> {
    const results: Array<{ key: string; value: T }> = [];
    for (const [key] of this.getTable(table)) {
      const value = this.get<T>(table, key);
      if (value !== undefined) {
        results.push({ key, value });
      }
    }
    return results;
  }

  clear(table?: string): void {
    if (table) {
      this.getTable(table).clear();
    } else {
      this.tables.forEach((t) => t.clear());
    }
    this.dirty = true;
  }

  async saveToFile(): Promise<void> {
    const data: Record<string, Array<EncryptedRecord>> = {};

    for (const [tableName, tableData] of this.tables) {
      data[tableName] = Array.from(tableData.values());
    }

    const serialized = JSON.stringify(data, null, 2);
    const encrypted = this.config.encryption.encrypt(
      serialized,
      `storytree-db-${new Date().toISOString()}`
    );

    const output = {
      version: "1.0",
      encryptedAt: new Date().toISOString(),
      tables: Object.keys(data),
      ...encrypted,
    };

    const dirPath = this.config.dbPath.substring(
      0,
      this.config.dbPath.lastIndexOf("/")
    );

    await fs.promises.mkdir(dirPath, { recursive: true });
    await fs.promises.writeFile(
      this.config.dbPath,
      JSON.stringify(output),
      "utf8"
    );

    this.dirty = false;
  }

  async loadFromFile(): Promise<boolean> {
    try {
      const raw = await fs.promises.readFile(this.config.dbPath, "utf8");
      const stored = JSON.parse(raw);

      if (!stored.iv || !stored.tag || !stored.ciphertext) {
        console.warn("[EncryptedDB] Invalid database file format");
        return false;
      }

      const decrypted = this.config.encryption.decrypt({
        iv: stored.iv,
        tag: stored.tag,
        ciphertext: stored.ciphertext,
        authData: stored.authData,
      });

      const data = JSON.parse(decrypted) as Record<string, Array<EncryptedRecord>>;

      for (const [tableName, records] of Object.entries(data)) {
        const tableData = this.getTable(tableName);
        for (const record of records) {
          tableData.set(record.key, record);
        }
      }

      this.dirty = false;
      return true;
    } catch (e) {
      console.warn("[EncryptedDB] Could not load database:", (e as Error).message);
      return false;
    }
  }

  isDirty(): boolean {
    return this.dirty;
  }

  getStats(): {
    tables: number;
    totalRecords: number;
    dirty: boolean;
    dbPath: string;
  } {
    let totalRecords = 0;
    this.tables.forEach((t) => (totalRecords += t.size));

    return {
      tables: this.tables.size,
      totalRecords,
      dirty: this.dirty,
      dbPath: this.config.dbPath,
    };
  }

  private generateId(): string {
    return `rec_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  }
}
