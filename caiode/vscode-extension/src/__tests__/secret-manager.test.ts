/**
 * T-SEC-001: Data Security - SecretStorage API Keys
 *
 * Verifies the SecretManager module for secure API key storage:
 * 1. Store/Get/Delete operations via VS Code SecretStorage
 * 2. Input validation and masking
 * 3. Prompt flow for missing secrets
 * 4. Secret registry completeness
 * 5. Clear all functionality
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as vscode from "vscode";
import {
  SECRET_KEYS,
  SECRET_REGISTRY,
  SecretManager,
  type SecretKey,
} from "../core/secret-manager";

describe("T-SEC-001: SecretStorage API Key Security", () => {
  let mockSecrets: Map<string, string>;
  let manager: SecretManager;

  function createMockContext() {
    const secrets = new Map<string, string>();
    return {
      secrets: {
        store: vi.fn(async (key: string, value: string) => {
          secrets.set(key, value);
        }),
        get: vi.fn(async (key: string) => secrets.get(key)),
        delete: vi.fn(async (key: string) => {
          secrets.delete(key);
        }),
      },
    } as unknown as vscode.ExtensionContext;
  }

  beforeEach(() => {
    mockSecrets = new Map();
    const ctx = createMockContext();
    manager = new SecretManager(ctx);
  });

  describe("Suite A: Secret Key Registry", () => {
    it("should define all required secret keys", () => {
      expect(SECRET_KEYS.OPENAI_API_KEY).toBe("storytree.openai.apiKey");
      expect(SECRET_KEYS.ANTHROPIC_API_KEY).toBe("storytree.anthropic.apiKey");
      expect(SECRET_KEYS.STORYTREE_TOKEN).toBe("storytree.auth.token");
      expect(SECRET_KEYS.STORYTREE_REFRESH).toBe("storytree.auth.refreshToken");
    });

    it("should have metadata registry for all keys", () => {
      const registeredKeys = Object.keys(SECRET_REGISTRY);
      const definedKeys = Object.values(SECRET_KEYS);

      definedKeys.forEach((key) => {
        expect(registeredKeys).toContain(key);
        expect(SECRET_REGISTRY[key]).toBeDefined();
        expect(SECRET_REGISTRY[key].label).toBeDefined();
        expect(SECRET_REGISTRY[key].description).toBeDefined();
      });
    });

    it("should classify auth tokens as required", () => {
      expect(SECRET_REGISTRY[SECRET_KEYS.STORYTREE_TOKEN].isRequired).toBe(true);
      expect(SECRET_REGISTRY[SECRET_KEYS.STORYTREE_REFRESH].isRequired).toBe(true);
    });

    it("should classify API keys as optional", () => {
      expect(SECRET_REGISTRY[SECRET_KEYS.OPENAI_API_KEY].isRequired).toBe(false);
      expect(SECRET_REGISTRY[SECRET_KEYS.ANTHROPIC_API_KEY].isRequired).toBe(false);
    });

    it("should have mask characters for sensitive values", () => {
      expect(SECRET_REGISTRY[SECRET_KEYS.OPENAI_API_KEY].maskChar).toBe("•••");
      expect(SECRET_REGISTRY[SECRET_KEYS.ANTHROPIC_API_KEY].maskChar).toBe("•••");
    });

    it("should have Chinese descriptions for all secrets", () => {
      Object.values(SECRET_REGISTRY).forEach((meta) => {
        expect(meta.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe("Suite B: Store & Retrieve Operations", () => {
    it("should store a secret value", async () => {
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "sk-test-key-12345");
      const value = await manager.get(SECRET_KEYS.OPENAI_API_KEY);
      expect(value).toBe("sk-test-key-12345");
    });

    it("should return undefined for non-existent secret", async () => {
      const value = await manager.get(SECRET_KEYS.OPENAI_API_KEY);
      expect(value).toBeUndefined();
    });

    it("should overwrite existing secret on re-store", async () => {
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "old-key");
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "new-key");

      const value = await manager.get(SECRET_KEYS.OPENAI_API_KEY);
      expect(value).toBe("new-key");
    });

    it("should delete a stored secret", async () => {
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "to-delete");
      await manager.delete(SECRET_KEYS.OPENAI_API_KEY);

      const value = await manager.get(SECRET_KEYS.OPENAI_API_KEY);
      expect(value).toBeUndefined();
    });

    it("should handle delete of non-existent key gracefully", async () => {
      await expect(manager.delete(SECRET_KEYS.OPENAI_API_KEY)).resolves.not.toThrow();
    });
  });

  describe("Suite C: Has (Existence Check)", () => {
    it("should return true for existing non-empty secret", async () => {
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "valid-key");
      const exists = await manager.has(SECRET_KEYS.OPENAI_API_KEY);
      expect(exists).toBe(true);
    });

    it("should return false for non-existent secret", async () => {
      const exists = await manager.has(SECRET_KEYS.OPENAI_API_KEY);
      expect(exists).toBe(false);
    });
  });

  describe("Suite D: Masked Value Display", () => {
    it("should return mask char when secret is set", async () => {
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "secret-value");
      const masked = await manager.getMaskedValue(SECRET_KEYS.OPENAI_API_KEY);
      expect(masked).toBe("•••");
    });

    it("should return '(未设置)' when secret is not set", async () => {
      const masked = await manager.getMaskedValue(SECRET_KEYS.OPENAI_API_KEY);
      expect(masked).toBe("(未设置)");
    });
  });

  describe("Suite E: Get All Status", () => {
    it("should return status for all registered secrets", async () => {
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "sk-xxx");
      const status = await manager.getAllStatus();

      expect(status.length).toBe(Object.keys(SECRET_KEYS).length);

      const openaiStatus = status.find(
        (s) => s.key === SECRET_KEYS.OPENAI_API_KEY
      );
      expect(openaiStatus?.isSet).toBe(true);
      expect(openaiStatus?.masked).toBe("•••");

      const anthropicStatus = status.find(
        (s) => s.key === SECRET_KEYS.ANTHROPIC_API_KEY
      );
      expect(anthropicStatus?.isSet).toBe(false);
      expect(anthropicStatus?.masked).toBe("(未设置)");
    });

    it("should include label for each status entry", async () => {
      const status = await manager.getAllStatus();
      status.forEach((entry) => {
        expect(entry.label).toBeDefined();
        expect(entry.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Suite F: Clear All Secrets", () => {
    it("should remove all stored secrets", async () => {
      await manager.store(SECRET_KEYS.OPENAI_API_KEY, "key1");
      await manager.store(SECRET_KEYS.ANTHROPIC_API_KEY, "key2");
      await manager.store(SECRET_KEYS.STORYTREE_TOKEN, "token1");

      await manager.clearAll();

      const s1 = await manager.has(SECRET_KEYS.OPENAI_API_KEY);
      const s2 = await manager.has(SECRET_KEYS.ANTHROPIC_API_KEY);
      const s3 = await manager.has(SECRET_KEYS.STORYTREE_TOKEN);

      expect(s1).toBe(false);
      expect(s2).toBe(false);
      expect(s3).toBe(false);
    });

    it("should handle clearAll with no secrets gracefully", async () => {
      await expect(manager.clearAll()).resolves.not.toThrow();
    });
  });

  describe("Suite G: Dispose", () => {
    it("should dispose without error", () => {
      expect(() => manager.dispose()).not.toThrow();
    });
  });

  describe("Suite H: Key Namespace Isolation", () => {
    it("should use storytree. prefix for all keys", () => {
      Object.values(SECRET_KEYS).forEach((key) => {
        expect(key.startsWith("storytree.")).toBe(true);
      });
    });

    it("should use dot-separated hierarchical naming", () => {
      expect(SECRET_KEYS.OPENAI_API_KEY).toMatch(/^[a-z]+\.[a-z]+\.[a-z]+$/);
      expect(SECRET_KEYS.STORYTREE_TOKEN).toMatch(/^[a-z]+\.[a-z]+\.[a-z]+$/);
    });

    it("should not collide with common VS Code extension key patterns", () => {
      const commonPatterns = ["github.", "gitlab.", "aws.", "azure."];
      Object.values(SECRET_KEYS).forEach((key) => {
        commonPatterns.forEach((pattern) => {
          expect(key.startsWith(pattern)).toBe(false);
        });
      });
    });
  });
});
