/**
 * T-SEC-002: File Isolation (Sandbox Mechanism)
 *
 * Verifies the FileSandbox module enforces:
 * 1. Path containment within .storytree directory
 * 2. Blacklist pattern blocking (path traversal, sensitive files)
 * 3. Whitelist extension filtering
 * 4. File size limits
 * 5. Read/Write/Delete/List operations with validation
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { FileSandbox } from "../core/file-sandbox";
import type { SandboxConfig } from "../core/file-sandbox";

describe("T-SEC-002: File Sandbox Security", () => {
  let sandbox: FileSandbox;
  let testDir: string;

  beforeEach(() => {
    testDir = `/tmp/storytree-sandbox-test-${Date.now()}`;
    fs.mkdirSync(testDir, { recursive: true });
    sandbox = new FileSandbox(testDir);
    sandbox.ensureSandboxDir();
  });

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe("Suite A: Path Containment", () => {
    it("should resolve relative paths inside .storytree", () => {
      const result = sandbox.validatePath("data/test.json");
      expect(result.allowed).toBe(true);
      expect(result.resolvedPath).toContain(".storytree");
      expect(result.resolvedPath).toContain("data");
    });

    it("should block path traversal attempts (../)", () => {
      const result = sandbox.validatePath("../../etc/passwd");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("越界");
    });

    it("should block absolute paths outside sandbox", () => {
      const result = sandbox.validatePath("/etc/shadow");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("越界");
    });

    it("should allow nested paths within sandbox", () => {
      const result = sandbox.validatePath("projects/my-novel/chapters/ch1.md");
      expect(result.allowed).toBe(true);
    });

    it("should block encoded traversal attempts", () => {
      const result = sandbox.validatePath("..%2F..%2Fetc%2Fpasswd");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Suite B: Blacklist Pattern Blocking", () => {
    it("should block /etc/ system paths", () => {
      const result = sandbox.validatePath("/etc/hosts");
      expect(result.allowed).toBe(false);
    });

    it("should block .env files", () => {
      const result = sandbox.validatePath(".env");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("黑名单");
    });

    it("should block .pem certificate files", () => {
      const result = sandbox.validatePath("certs/id.pem");
      expect(result.allowed).toBe(false);
    });

    it("should block .key private key files", () => {
      const result = sandbox.validatePath("keys/private.key");
      expect(result.allowed).toBe(false);
    });

    it("should block node_modules access", () => {
      const result = sandbox.validatePath("node_modules/package/index.js");
      expect(result.allowed).toBe(false);
    });

    it("should block .git directory access", () => {
      const result = sandbox.validatePath(".git/config");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Suite C: Extension Whitelist", () => {
    it("should allow .json files", () => {
      const result = sandbox.validatePath("data/config.json");
      expect(result.allowed).toBe(true);
    });

    it("should allow .md files", () => {
      const result = sandbox.validatePath("chapters/ch1.md");
      expect(result.allowed).toBe(true);
    });

    it("should allow .txt files", () => {
      const result = sandbox.validatePath("notes.txt");
      expect(result.allowed).toBe(true);
    });

    it("should allow .sqlite database files", () => {
      const result = sandbox.validatePath("db/storytree.sqlite");
      expect(result.allowed).toBe(true);
    });

    it("should block .exe files by default", () => {
      const result = sandbox.validatePath("malware.exe");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("文件类型不被允许");
    });

    it("should block .sh script files by default", () => {
      const result = sandbox.validatePath("run.sh");
      expect(result.allowed).toBe(false);
    });

    it("should block files without extension", () => {
      const result = sandbox.validatePath("noextension");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Suite D: Read/Write Operations", () => {
    it("should write and read a file within sandbox", async () => {
      await sandbox.writeFile("test-data.json", '{"hello": "world"}');
      const content = await sandbox.readFile("test-data.json");
      expect(content).toBe('{"hello": "world"}');
    });

    it("should reject writing to blocked path", async () => {
      await expect(sandbox.writeFile("../etc/bad", "data")).rejects.toThrow(
        "被拒绝"
      );
    });

    it("should reject reading from blocked path", async () => {
      await expect(sandbox.readFile("../../etc/passwd")).rejects.toThrow(
        "被拒绝"
      );
    });

    it("should create parent directories on write", async () => {
      await sandbox.writeFile("deep/nested/dir/file.json", "{}");
      const exists = await sandbox.exists("deep/nested/dir/file.json");
      expect(exists).toBe(true);
    });

    it("should delete a file within sandbox", async () => {
      await sandbox.writeFile("to-delete.json", "data");
      await sandbox.deleteFile("to-delete.json");
      const exists = await sandbox.exists("to-delete.json");
      expect(exists).toBe(false);
    });

    it("should reject deleting outside sandbox", async () => {
      await expect(sandbox.deleteFile("/etc/hosts")).rejects.toThrow();
    });
  });

  describe("Suite E: File Size Limits", () => {
    it("should enforce max file size on read (default 10MB)", async () => {
      const largeContent = "x".repeat(11 * 1024 * 1024);
      await sandbox.writeFile("large-file.json", largeContent);

      await expect(
        sandbox.readFile("large-file.json")
      ).rejects.toThrow("文件过大");
    });

    it("should accept files under size limit", async () => {
      const content = "x".repeat(1000);
      await sandbox.writeFile("small-file.json", content);
      const read = await sandbox.readFile("small-file.json");
      expect(read.length).toBe(1000);
    });

    it("should support custom size limit via config", () => {
      const strictSandbox = new FileSandbox(testDir, {
        maxFileSize: 100,
      });
      expect(strictSandbox.getConfig().maxFileSize).toBe(100);
    });
  });

  describe("Suite F: List Files", () => {
    it("should list all files in sandbox root", async () => {
      await sandbox.writeFile("a.json", "{}");
      await sandbox.writeFile("b.md", "# test");

      const files = await sandbox.listFiles();
      expect(files.length).toBe(2);
      expect(files.some((f) => f.endsWith("a.json"))).toBe(true);
      expect(files.some((f) => f.endsWith("b.md"))).toBe(true);
    });

    it("should list nested files recursively", async () => {
      await sandbox.writeFile("proj/ch1.md", "");
      await sandbox.writeFile("proj/ch2.md", "");

      const files = await sandbox.listFiles();
      expect(files.length).toBe(2);
    });

    it("should reject listing outside sandbox", async () => {
      await expect(sandbox.listFiles("/etc")).rejects.toThrow();
    });
  });

  describe("Suite G: Exists Check", () => {
    it("should return true for existing file", async () => {
      await sandbox.writeFile("exists.json", "{}");
      expect(await sandbox.exists("exists.json")).toBe(true);
    });

    it("should return false for non-existing file", async () => {
      expect(await sandbox.exists("ghost.json")).toBe(false);
    });

    it("should return false for blocked path", async () => {
      expect(await sandbox.exists("/etc/passwd")).toBe(false);
    });
  });

  describe("Suite H: Configuration & Initialization", () => {
    it("should return immutable config snapshot", () => {
      const config = sandbox.getConfig();
      expect(config.workspaceRoot).toBeDefined();
      expect(config.maxFileSize).toBeDefined();
      expect(config.blockedPatterns.length).toBeGreaterThan(0);
      expect(config.allowedExtensions.length).toBeGreaterThan(0);
    });

    it("should create .storytree directory on ensureSandboxDir()", () => {
      const fresh = new FileSandbox(`/tmp/fresh-${Date.now()}`);
      fresh.ensureSandboxDir();

      const exists = fs.existsSync(fresh.getSandboxRoot());
      expect(exists).toBe(true);

      try {
        fs.rmSync(path.dirname(fresh.getSandboxRoot()), {
          recursive: true,
          force: true,
        });
      } catch {}
    });

    it("should use custom allowed directories", () => {
      const custom = new FileSandbox(testDir, {
        allowedDirs: ["custom-dir"],
      });

      const config = custom.getConfig();
      expect(config.allowedDirs).toContain("custom-dir");
    });

    it("should use custom allowed extensions", () => {
      const custom = new FileSandbox(testDir, {
        allowedExtensions: [".custom"],
      });

      const check = custom.validatePath("file.custom");
      expect(check.allowed).toBe(true);

      const blocked = custom.validatePath("file.json");
      expect(blocked.allowed).toBe(false);
    });
  });

  describe("Suite I: Edge Cases", () => {
    it("should handle empty filename gracefully", () => {
      const result = sandbox.validatePath("");
      expect(result.resolvedPath).toBeDefined();
    });

    it("should handle unicode filenames", () => {
      const result = sandbox.validatePath("星际迷途_章节1.md");
      expect(result.allowed).toBe(true);
    });

    it("should handle very long filenames", () => {
      const longName = "a".repeat(200) + ".json";
      const result = sandbox.validatePath(longName);
      expect(result.resolvedPath).toBeDefined();
    });

    it("should handle dotfiles that are not blacklisted", () => {
      const result = sandbox.validatePath(".config");
      expect(result.allowed).toBe(true);
    });
  });
});
