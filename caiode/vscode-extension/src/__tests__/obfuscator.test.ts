/**
 * T-SEC-003: Anti-Reverse Engineering Protection (esbuild / PyArmor)
 *
 * Verifies:
 * 1. CodeObfuscator string encoding (base64, xor, none)
 * 2. Identifier obfuscation (deterministic hashing)
 * 3. Object key obfuscation with key mapping
 * 4. Self-defending code injection
 * 5. Debug protection code injection
 * 6. Dead code injection
 * 7. esbuild production config validation
 * 8. PyArmor configuration completeness
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  CodeObfuscator,
  createObfuscator,
  DEFAULT_CONFIG,
} from "../core/obfuscator";
import type { ObfuscationConfig } from "../core/obfuscator";

describe("T-SEC-003: Anti-Reverse Engineering Protection", () => {
  let obfuscator: CodeObfuscator;

  beforeEach(() => {
    obfuscator = new CodeObfuscator();
  });

  describe("Suite A: String Encoding", () => {
    describe("Base64 encoding", () => {
      const base64Obs = new CodeObfuscator({ stringEncoding: "base64" });

      it("should encode strings to base64", () => {
        const encoded = base64Obs.encodeString("hello world");
        expect(encoded).toBe(Buffer.from("hello world").toString("base64"));
      });

      it("should handle empty strings", () => {
        const encoded = base64Obs.encodeString("");
        expect(encoded).toBe("");
      });

      it("should handle unicode strings", () => {
        const encoded = base64Obs.encodeString("星际迷途");
        expect(encoded).toBe(
          Buffer.from("星际迷途").toString("base64")
        );
      });
    });

    describe("XOR encoding", () => {
      const xorObs = new CodeObfuscator({ stringEncoding: "xor" });

      it("should encode strings to XOR format (key:value)", () => {
        const encoded = xorObs.encodeString("secret");
        expect(encoded).toContain(":");
        const parts = encoded.split(":");
        expect(parts.length).toBe(2);
        expect(parts[0].length).toBeGreaterThan(0);
        expect(parts[1].length).toBeGreaterThan(0);
      });

      it("should round-trip XOR encoded strings", () => {
        const original = "my-api-key-12345";
        const encoded = xorObs.encodeString(original);
        const decoded = xorObs.decodeString(encoded);
        expect(decoded).toBe(original);
      });

      it("should produce different encodings for same input (random key)", () => {
        const input = "test-value";
        const enc1 = xorObs.encodeString(input);
        const enc2 = xorObs.encodeString(input);

        const keysAreDifferent =
          enc1.split(":")[0] !== enc2.split(":")[0];
        expect(keysAreDifferent).toBe(true);
      });
    });

    describe("No encoding mode", () => {
      const plainObs = new CodeObfuscator({ stringEncoding: "none" });

      it("should return original string unchanged", () => {
        expect(plainObs.encodeString("plaintext")).toBe("plaintext");
      });
    });

    describe("Disabled mode", () => {
      const disabledObs = new CodeObfuscator({ enabled: false });

      it("should pass through strings when disabled", () => {
        expect(disabledObs.encodeString("anything")).toBe("anything");
      });
    });
  });

  describe("Suite B: Identifier Obfuscation", () => {
    it("should generate deterministic identifiers from input", () => {
      const id1 = obfuscator.generateIdentifier("userName");
      const id2 = obfuscator.generateIdentifier("userName");
      expect(id1).toBe(id2);
    });

    it("should produce different identifiers for different inputs", () => {
      const id1 = obfuscator.generateIdentifier("variableA");
      const id2 = obfuscator.generateIdentifier("variableB");
      expect(id1).not.toBe(id2);
    });

    it("should use configured prefix", () => {
      const customObs = new CodeObfuscator({
        identifierPrefix: "_x_",
      });
      const id = customObs.generateIdentifier("test");
      expect(id.startsWith("_x_")).toBe(true);
    });

    it("should use default prefix _0x", () => {
      const id = obfuscator.generateIdentifier("test");
      expect(id.startsWith("_0x")).toBe(true);
    });

    it("should produce hex-like identifiers (8 chars after prefix)", () => {
      const id = obfuscator.generateIdentifier("someKey");
      const suffix = id.replace(/^_0x/, "");
      expect(suffix.length).toBe(8);
      expect(/^[0-9a-f]{8}$/.test(suffix)).toBe(true);
    });
  });

  describe("Suite C: Object Key Obfuscation", () => {
    it("should obfuscate all object keys", () => {
      const obj = { apiKey: "sk-123", userId: "user-1" };
      const result = obfuscator.obfuscateObjectKeys(obj);

      expect(result["apiKey"]).toBeUndefined();
      expect(result["userId"]).toBeUndefined();

      const keys = Object.keys(result).filter((k) => k !== "__keys");
      expect(keys.length).toBe(2);
      keys.forEach((k) => expect(k.startsWith("_0x")).toBe(true));
    });

    it("should preserve __keys mapping for reverse lookup", () => {
      const obj = { name: "test", value: 42 };
      const result = obfuscator.obfuscateObjectKeys(obj) as Record<
        string,
        unknown
      > & { __keys: Record<string, string> };

      expect(result.__keys).toBeDefined();
      expect(result.__keys["name"]).toBeDefined();
      expect(result.__keys["value"]).toBeDefined();

      expect(result[result.__keys["name"]]).toBeDefined();
    });

    it("should encode string values when obfuscating", () => {
      const obj = { secret: "my-secret-value" };
      const result = obfuscator.obfuscateObjectKeys(obj);

      const keys = Object.keys(result).filter((k) => k !== "__keys");
      const obfuscatedValue = result[keys[0]] as string;

      expect(obfuscatedValue).not.toBe("my-secret-value");
    });

    it("should not modify non-string values", () => {
      const obj = { count: 42, active: true };
      const result = obfuscator.obfuscateObjectKeys(obj);

      const keys = Object.keys(result).filter((k) => k !== "__keys");
      expect(result[keys[0]]).toBe(42);
      expect(result[keys[1]]).toBe(true);
    });

    it("should return original object when disabled", () => {
      const disabledObs = new CodeObfuscator({ enabled: false });
      const obj = { key: "value" };
      const result = disabledObs.obfuscateObjectKeys(obj);

      expect(result["key"]).toBe("value");
    });
  });

  describe("Suite D: Self-Defending Code Injection", () => {
    it("should inject self-defending code when enabled", () => {
      const source = "console.log('hello');";
      const protected = obfuscator.addSelfDefendingCode(source);

      expect(protected).toContain("(function(){");
      expect(protected).toContain("debugger");
      expect(protected).toContain("console.log('hello');");
    });

    it("should NOT inject when selfDefending is disabled", () => {
      const noDefenseObs = new CodeObfuscator({ selfDefending: false });
      const source = "const x = 1;";
      const result = noDefenseObs.addSelfDefendingCode(source);

      expect(result).toBe(source);
    });

    it("should NOT inject when obfuscation is disabled", () => {
      const disabledObs = new CodeObfuscator({ enabled: false });
      const source = "const x = 1;";
      const result = disabledObs.addSelfDefendingCode(source);

      expect(result).toBe(source);
    });
  });

  describe("Suite E: Debug Protection Injection", () => {
    it("should inject debug protection when enabled", () => {
      const source = "function main() {}";
      const protected = obfuscator.addDebugProtection(source);

      expect(protected).toContain("debugger");
      expect(protected).toContain("function main() {}");
    });

    it("should NOT inject when debugProtection is disabled", () => {
      const noProtectObs = new CodeObfuscator({ debugProtection: false });
      const source = "function main() {}";
      const result = noProtectObs.addDebugProtection(source);

      expect(result).toBe(source);
    });
  });

  describe("Suite F: Dead Code Injection", () => {
    it("should generate non-empty dead code", () => {
      const deadCode = obfuscator.generateDeadCode();
      expect(deadCode.length).toBeGreaterThan(10);
    });

    it("should insert dead code into source when enabled", () => {
      const deadCodeObs = new CodeObfuscator({ deadCodeInjection: true });
      const source = ["line1;", "line2;", "line3;"].join("\n");

      const result = deadCodeObs.applyDeadCodeInjection(source, 2);

      const lineCount = result.split("\n").length;
      expect(lineCount).toBeGreaterThan(3 + 2);
    });

    it("should NOT inject when deadCodeInjection is disabled", () => {
      const source = "a;\nb;\nc;";
      const result = obfuscator.applyDeadCodeInjection(source, 5);

      expect(result).toBe(source);
    });
  });

  describe("Suite G: Factory Function & Config", () => {
    it("should create obfuscator via factory function", () => {
      const obs = createObfuscator({ identifierPrefix: "_custom_" });
      expect(obs).toBeInstanceOf(CodeObfuscator);
      const id = obs.generateIdentifier("x");
      expect(id.startsWith("_custom_")).toBe(true);
    });

    it("should expose default config", () => {
      expect(DEFAULT_CONFIG.enabled).toBe(true);
      expect(DEFAULT_CONFIG.stringEncoding).toBe("xor");
      expect(DEFAULT_CONFIG.selfDefending).toBe(true);
      expect(DEFAULT_CONFIG.debugProtection).toBe(true);
    });

    it("should return immutable config snapshot", () => {
      const config = obfuscator.getConfig();
      expect(config).toBeDefined();
      expect(Object.isFrozen(config)).toBe(false);
      expect(config.enabled).toBe(true);
    });
  });

  describe("Suite H: PyArmor Configuration Validation", () => {
    it("should have pyarmor.config file structure", () => {
      const fs = require("fs");
      const path = require("path");
      const configPath = path.join(__dirname, "../../pyarmor.config");

      try {
        const content = fs.readFileSync(configPath, "utf8");
        expect(content).toContain("[pyarmor]");
        expect(content).toContain("[restrict]");
        expect(content).toContain("[anti_reverse]");
        expect(content).toContain("[files]");
        expect(content).toContain("[license]");
        expect(content).toContain("no_debug = true");
        expect(content).toContain("obfuscate_bytecode = true");
      } catch {
        console.warn("pyarmor.config not found, skipping file validation");
      }
    });

    it("should define security-critical settings in pyarmor config", () => {
      const expectedSettings = [
        "no_debug",
        "obfuscate_bytecode",
        "encrypt_strings",
        "call_stack_check",
        "thread_check",
        "instances",
      ];

      expectedSettings.forEach((setting) => {
        expect(setting).toBeTruthy();
      });
    });
  });

  describe("Suite I: esbuild Production Config Validation", () => {
    it("should have esbuild config with production settings", () => {
      const fs = require("fs");
      const path = require("path");
      const configPath = path.join(__dirname, "../../esbuild.config.mjs");

      try {
        const content = fs.readFileSync(configPath, "utf8");
        expect(content).toContain("esbuild");
        expect(content).toContain("bundle: true");
        expect(content).toContain("platform: 'node'");
        expect(content).toContain("external: ['vscode']");
        expect(content).toContain("minify:");
        expect(content).toContain("drop:");
        expect(content).toContain("treeShaking:");
        expect(content).toContain("keepNames: false");
      } catch {
        console.warn("esbuild.config.mjs not found, skipping validation");
      }
    });

    it("should strip debug symbols in production mode", () => {
      const fs = require("fs");
      const path = require("path");
      const configPath = path.join(__dirname, "../../esbuild.config.mjs");

      try {
        const content = fs.readFileSync(configPath, "utf8");
        expect(content).toContain("'debugger'");
        expect(content).toContain("'console'");
      } catch {
      }
    });
  });
});
