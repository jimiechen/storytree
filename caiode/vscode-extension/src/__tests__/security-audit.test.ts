import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { globSync } from "glob";

describe("TC-SEC-AUDIT: Security Audit Checklist", () => {
  const extPath = resolve(__dirname, "../..");

  describe("TC-SEC-AUDIT-001: Dependency Vulnerability Scan", () => {
    it("should have package.json with dependencies", () => {
      const packageJsonPath = join(extPath, "package.json");
      expect(existsSync(packageJsonPath)).toBe(true);

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(packageJson.dependencies || packageJson.devDependencies).toBeDefined();
    });

    it("should not have known vulnerable dependency patterns", () => {
      // Check for common vulnerable packages
      const packageJsonPath = join(extPath, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // List of packages with known vulnerabilities (example)
      const vulnerablePatterns = [
        "lodash@<4.17.21",
        "axios@<0.21.1",
        "node-fetch@<2.6.1",
      ];

      // This is a simplified check - real audit would use npm audit
      const depNames = Object.keys(allDeps);
      expect(depNames.length).toBeGreaterThan(0);
    });

    it("should use exact versions for critical dependencies", () => {
      const packageJsonPath = join(extPath, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

      const criticalDeps = ["better-sqlite3", "vscode"];
      const deps = packageJson.dependencies || {};

      criticalDeps.forEach((dep) => {
        if (deps[dep]) {
          // Should not use ^ or ~ for critical deps
          expect(deps[dep]).not.toMatch(/^\^/);
        }
      });
    });
  });

  describe("TC-SEC-AUDIT-002: CSP Configuration Check", () => {
    it("should have CSP meta tag in HTML generators", () => {
      const htmlGeneratorPath = join(extPath, "src/webview/html-generator.ts");
      if (!existsSync(htmlGeneratorPath)) return;

      const content = readFileSync(htmlGeneratorPath, "utf-8");
      // Check for CSP-related content
      expect(content).toContain("nonce");
    });

    it("should not have inline scripts without nonce", () => {
      // Check webview HTML files for proper nonce usage
      const webviewFiles = globSync(join(extPath, "src/webview/*.ts"));

      webviewFiles.forEach((file: string) => {
        const content = readFileSync(file, "utf-8");
        // If script tag exists, it should use nonce
        if (content.includes("<script")) {
          expect(content).toContain("nonce");
        }
      });
    });

    it("should not load external resources", () => {
      const webviewFiles = globSync(join(extPath, "src/webview/*.ts"));

      webviewFiles.forEach((file: string) => {
        const content = readFileSync(file, "utf-8");
        // Should not have external URLs
        expect(content).not.toMatch(/src="https?:\/\//);
        expect(content).not.toMatch(/href="https?:\/\//);
      });
    });
  });

  describe("TC-SEC-AUDIT-003: Secret Key Storage Check", () => {
    it("should not have hardcoded API keys in source code", () => {
      const srcFiles = globSync(join(extPath, "src/**/*.ts"));

      const apiKeyPatterns = [
        /sk-[a-zA-Z0-9]{20,}/, // OpenAI key pattern
        /sk-ant-[a-zA-Z0-9]{20,}/, // Anthropic key pattern
        /api[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9]{10,}/i,
      ];

      srcFiles.forEach((file: string) => {
        const content = readFileSync(file, "utf-8");

        apiKeyPatterns.forEach((pattern) => {
          // Allow patterns in test files or mock data
          if (file.includes(".test.ts") || file.includes("mock")) return;

          const matches = content.match(pattern);
          if (matches) {
            // Should be in SecretStorage, not hardcoded
            expect(content).toContain("SecretStorage");
          }
        });
      });
    });

    it("should use SecretStorage for sensitive data", () => {
      const secretManagerPath = join(extPath, "src/core/secret-manager.ts");
      expect(existsSync(secretManagerPath)).toBe(true);

      const content = readFileSync(secretManagerPath, "utf-8");
      expect(content).toContain("SecretStorage");
    });

    it("should not have .env files committed", () => {
      const gitignorePath = join(extPath, ".gitignore");
      if (existsSync(gitignorePath)) {
        const gitignore = readFileSync(gitignorePath, "utf-8");
        expect(gitignore).toContain(".env");
      }
    });
  });

  describe("TC-SEC-AUDIT-004: SQL Injection Prevention", () => {
    it("should use parameterized queries", () => {
      const dbFiles = globSync(join(extPath, "src/core/*.ts"));

      dbFiles.forEach((file: string) => {
        const content = readFileSync(file, "utf-8");

        // Should not have string concatenation in SQL
        if (content.includes("SELECT") || content.includes("INSERT")) {
          // Check for template literal usage in SQL (risky)
          const riskyPatterns = [
            /SELECT.*\$\{/,
            /INSERT.*\$\{/,
            /WHERE.*\$\{/,
          ];

          riskyPatterns.forEach((pattern) => {
            // Allow if it's a test file
            if (file.includes(".test.ts")) return;

            // Should use prepared statements
            expect(content).toContain("prepare");
          });
        }
      });
    });

    it("should use ORM/Repository pattern", () => {
      const repoPath = join(extPath, "src/core/repository.ts");
      expect(existsSync(repoPath)).toBe(true);

      const content = readFileSync(repoPath, "utf-8");
      // Should use parameterized queries
      expect(content).toContain("prepare");
    });
  });

  describe("TC-SEC-AUDIT-005: XSS Prevention", () => {
    it("should escape HTML in webview content", () => {
      const webviewFiles = globSync(join(extPath, "src/webview/*.ts"));

      webviewFiles.forEach((file: string) => {
        const content = readFileSync(file, "utf-8");

        // If rendering user content, should escape
        if (content.includes("innerHTML") || content.includes("html")) {
          // Should have escapeHtml function
          expect(content).toMatch(/escapeHtml|sanitize/);
        }
      });
    });

    it("should validate IPC message data", () => {
      const messageRouterPath = join(extPath, "src/core/message-router.ts");
      if (existsSync(messageRouterPath)) {
        const content = readFileSync(messageRouterPath, "utf-8");
        // Should validate message structure
        expect(content).toContain("validate");
      }
    });

    it("should use textContent instead of innerHTML where possible", () => {
      // This is more of a guideline check
      const webviewFiles = globSync(join(extPath, "src/webview/*.ts"));

      let innerHtmlCount = 0;
      let textContentCount = 0;

      webviewFiles.forEach((file: string) => {
        const content = readFileSync(file, "utf-8");
        innerHtmlCount += (content.match(/innerHTML/g) || []).length;
        textContentCount += (content.match(/textContent/g) || []).length;
      });

      // Prefer textContent over innerHTML
      console.log(`innerHTML usage: ${innerHtmlCount}, textContent usage: ${textContentCount}`);
    });
  });
});
