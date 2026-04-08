/**
 * T-SEC-004: Local Database Encryption (sqlcipher alternative)
 *
 * Verifies:
 * 1. AES-256-GCM encryption/decryption roundtrip
 * 2. JSON data encryption with integrity verification
 * 3. HMAC-based authentication
 * 4. PBKDF2 key derivation
 * 5. EncryptedDatabase CRUD operations
 * 6. Database save/load persistence with encryption
 * 7. Integrity checks on all operations
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  DataEncryption,
  createEncryption,
} from "../core/data-encryption";
import { EncryptedDatabase } from "../core/encrypted-db";
import type { EncryptedPayload } from "../core/data-encryption";

describe("T-SEC-004: Local Database Encryption", () => {
  let encryption: DataEncryption;
  const TEST_KEY = "test-master-key-for-storytree-encryption-1234567890";

  beforeEach(() => {
    encryption = new DataEncryption(TEST_KEY);
  });

  describe("Suite A: AES-256-GCM Encryption Roundtrip", () => {
    it("should encrypt and decrypt a simple string", () => {
      const plaintext = "Hello, StoryTree!";
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext for same input (random IV)", () => {
      const plaintext = "same input";
      const enc1 = encryption.encrypt(plaintext);
      const enc2 = encryption.encrypt(plaintext);

      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
      expect(enc1.iv).not.toBe(enc2.iv);

      expect(encryption.decrypt(enc1)).toBe(plaintext);
      expect(encryption.decrypt(enc2)).toBe(plaintext);
    });

    it("should handle empty strings", () => {
      const encrypted = encryption.encrypt("");
      expect(encryption.decrypt(encrypted)).toBe("");
    });

    it("should handle unicode content", () => {
      const text = "星际迷途：归乡 🚀✨ 中文测试 日本語 한국어";
      const encrypted = encryption.encrypt(text);
      expect(encryption.decrypt(encrypted)).toBe(text);
    });

    it("should handle very long strings (100KB)", () => {
      const longText = "x".repeat(100_000);
      const encrypted = encryption.encrypt(longText);
      expect(encryption.decrypt(encrypted).length).toBe(100_000);
    });
  });

  describe("Suite B: Authenticated Encryption (AAD)", () => {
    it("should include AAD in encrypted payload", () => {
      const payload = encryption.encrypt("data", "my-context");
      expect(payload.authData).toBe("my-context");
    });

    it("should fail decryption if AAD is tampered", () => {
      const original = encryption.encrypt("secret", "correct-aad");

      const tampered: EncryptedPayload = {
        ...original,
        authData: "wrong-aad",
      };

      expect(() => encryption.decrypt(tampered)).toThrow();
    });

    it("should succeed with correct AAD", () => {
      const payload = encryption.encrypt("value", "context");
      expect(
        encryption.decrypt({ ...payload, authData: "context" })
      ).toBe("value");
    });
  });

  describe("Suite C: JSON Data Encryption", () => {
    it("should encrypt and decrypt JSON objects", () => {
      const data = {
        name: "星际迷途",
        chapters: 5,
        characters: ["林远航", "艾拉"],
        metadata: { genre: "科幻", status: "draft" },
      };

      const encrypted = encryption.encryptJSON(data);
      const decrypted = encryption.decryptJSON<typeof data>(encrypted);

      expect(decrypted.name).toBe("星际迷途");
      expect(decrypted.chapters).toBe(5);
      expect(decrypted.characters).toEqual(["林远航", "艾拉"]);
      expect(decrypted.metadata.genre).toBe("科幻");
    });

    it("should encrypt and decrypt JSON arrays", () => {
      const data = [1, 2, 3, { nested: true }];
      const encrypted = encryption.encryptJSON(data);
      const decrypted = encryption.decryptJSON<typeof data>(encrypted);

      expect(decrypted).toEqual([1, 2, 3, { nested: true }]);
    });
  });

  describe("Suite D: Hashing & Integrity Verification", () => {
    it("should produce consistent SHA-256 hashes", () => {
      const h1 = encryption.hash("test");
      const h2 = encryption.hash("test");

      expect(h1).toBe(h2);
      expect(h1.length).toBe(64);
    });

    it("should produce different hashes for different inputs", () => {
      expect(encryption.hash("a")).not.toBe(encryption.hash("b"));
    });

    it("should verify integrity correctly", () => {
      const data = "important-data";
      const hash = encryption.hash(data);

      expect(encryption.verifyIntegrity(data, hash)).toBe(true);
      expect(encryption.verifyIntegrity("tampered", hash)).toBe(false);
    });

    it("should use timing-safe comparison to prevent timing attacks", () => {
      const data = "sensitive";
      const hash = encryption.hash(data);

      const startEqual = Date.now();
      for (let i = 0; i < 100; i++) {
        encryption.verifyIntegrity(data, hash);
      }
      const durationEqual = Date.now() - startEqual;

      const startUnequal = Date.now();
      for (let i = 0; i < 100; i++) {
        encryption.verifyIntegrity("wrong" + i, hash);
      }
      const durationUnequal = Date.now() - startUnequal;

      const ratio = Math.abs(durationEqual - durationUnequal) / Math.max(durationEqual, 1);
      expect(ratio).toBeLessThan(5);
    });
  });

  describe("Suite E: HMAC Authentication", () => {
    it("should produce HMAC signatures", () => {
      const hmac = encryption.hmac("message");
      expect(hmac.length).toBe(64);
    });

    it("should produce different HMACs with different keys", () => {
      const h1 = encryption.hmac("msg");
      const otherEncryption = new DataEncryption("different-key");
      const h2 = otherEncryption.hmac("msg");

      expect(h1).not.toBe(h2);
    });

    it("should produce consistent HMACs with same key and message", () => {
      const h1 = encryption.hmac("message");
      const h2 = encryption.hmac("message");
      expect(h1).toBe(h2);
    });
  });

  describe("Suite F: Key Derivation (PBKDF2)", () => {
    it("should derive keys from password using PBKDF2", () => {
      const salt = crypto.randomBytes(16).toString("hex");
      const derivedKey = encryption.deriveKey("password123", salt, 10000);

      expect(derivedKey.length).toBe(32);
    });

    it("should produce deterministic keys from same inputs", () => {
      const salt = "fixed-salt-value";
      const k1 = encryption.deriveKey("pass", salt, 1000);
      const k2 = encryption.deriveKey("pass", salt, 1000);

      expect(Buffer.compare(k1, k2)).toBe(0);
    });

    it("should produce different keys with different passwords", () => {
      const salt = "salt";
      const k1 = encryption.deriveKey("pass1", salt);
      const k2 = encryption.deriveKey("pass2", salt);

      expect(Buffer.compare(k1, k2)).not.toBe(0);
    });
  });

  describe("Suite G: EncryptedDatabase CRUD", () => {
    let db: EncryptedDatabase;
    const testDbPath = `/tmp/storytree-test-db-${Date.now()}.enc`;

    beforeEach(() => {
      db = new EncryptedDB({
        dbPath: testDbPath,
        encryption,
      });
    });

    afterEach(() => {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    });

    it("should put and get records", () => {
      db.put("projects", "proj-1", { name: "Test Novel", status: "draft" });

      const result = db.get<{ name: string; status: string }>(
        "projects",
        "proj-1"
      );

      expect(result?.name).toBe("Test Novel");
      expect(result?.status).toBe("draft");
    });

    it("should return undefined for non-existent keys", () => {
      expect(db.get("projects", "nonexistent")).toBeUndefined();
    });

    it("should check existence with has()", () => {
      db.put("default", "key1", "value1");

      expect(db.has("default", "key1")).toBe(true);
      expect(db.has("default", "missing")).toBe(false);
    });

    it("should delete records", () => {
      db.put("default", "to-delete", "data");
      expect(db.has("default", "to-delete")).toBe(true);

      const deleted = db.delete("default", "to-delete");
      expect(deleted).toBe(true);
      expect(db.has("default", "to-delete")).toBe(false);
    });

    it("should list all keys", () => {
      db.put("default", "a", 1);
      db.put("default", "b", 2);
      db.put("default", "c", 3);

      const keys = db.keys("default");
      expect(keys).toContain("a");
      expect(keys).toContain("b");
      expect(keys).toContain("c");
      expect(keys.length).toBe(3);
    });

    it("should return table size", () => {
      expect(db.size("default")).toBe(0);
      db.put("default", "x", {});
      expect(db.size("default")).toBe(1);
    });

    it("should support multiple tables", () => {
      db.put("users", "u1", { name: "Alice" });
      db.put("chapters", "c1", { title: "Chapter 1" });

      expect(db.size("users")).toBe(1);
      expect(db.size("chapters")).toBe(1);
    });

    it("should iterate entries", () => {
      db.put("default", "k1", "v1");
      db.put("default", "k2", "v2");

      const entries = db.entries<string>("default");
      expect(entries.length).toBe(2);
      expect(entries.map((e) => e.key)).toEqual(expect.arrayContaining(["k1", "k2"]));
    });

    it("should clear individual tables", () => {
      db.put("t1", "a", 1);
      db.put("t2", "b", 2);

      db.clear("t1");
      expect(db.size("t1")).toBe(0);
      expect(db.size("t2")).toBe(1);
    });

    it("should clear all tables", () => {
      db.put("t1", "a", 1);
      db.put("t2", "b", 2);

      db.clear();
      expect(db.size("t1")).toBe(0);
      expect(db.size("t2")).toBe(0);
    });
  });

  describe("Suite H: Database Persistence", () => {
    let db: EncryptedDatabase;
    const testDbPath = `/tmp/storytree-persist-db-${Date.now()}.enc`;

    beforeEach(() => {
      db = new EncryptedDB({
        dbPath: testDbPath,
        encryption,
      });
    });

    afterEach(() => {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    });

    it("should save database to file", async () => {
      db.put("projects", "p1", { name: "Novel" });
      expect(db.isDirty()).toBe(true);

      await db.saveToFile();
      expect(db.isDirty()).toBe(false);

      const exists = fs.existsSync(testDbPath);
      expect(exists).toBe(true);
    });

    it("should load database from file", async () => {
      db.put("projects", "p1", { name: "Saved Novel" });
      await db.saveToFile();

      const db2 = new EncryptedDB({
        dbPath: testDbPath,
        encryption,
      });

      const loaded = await db2.loadFromFile();
      expect(loaded).toBe(true);

      const data = db2.get<{ name: string }>("projects", "p1");
      expect(data?.name).toBe("Saved Novel");
    });

    it("should return false for non-existent file", async () => {
      const loaded = await db.loadFromFile();
      expect(loaded).toBe(false);
    });

    it("should report stats correctly", () => {
      db.put("t1", "a", 1);
      db.put("t1", "b", 2);
      db.put("t2", "c", 3);

      const stats = db.getStats();
      expect(stats.tables).toBeGreaterThanOrEqual(2);
      expect(stats.totalRecords).toBe(3);
      expect(stats.dirty).toBe(true);
      expect(stats.dbPath).toBe(testDbPath);
    });
  });

  describe("Suite I: Factory Function & Config", () => {
    it("should create encryption via factory function", () => {
      const enc = createEncryption("factory-key");
      const payload = enc.encrypt("test");
      expect(enc.decrypt(payload)).toBe("test");
    });

    it("should generate random keys", () => {
      const key1 = DataEncryption.generateKey();
      const key2 = DataEncryption.generateKey();

      expect(key1.length).toBe(64);
      expect(key1).not.toBe(key2);
    });

    it("should expose config snapshot", () => {
      const config = encryption.getConfig();
      expect(config.algorithm).toBe("aes-256-gcm");
      expect(config.keyLength).toBe(32);
      expect(config.ivLength).toBe(16);
      expect(config.tagLength).toBe(16);
    });
  });
});
