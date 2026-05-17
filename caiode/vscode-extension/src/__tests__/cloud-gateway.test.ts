/**
 * T-GW-001: Cloud Gateway Integration - User Login & Authorization
 *
 * Verifies:
 * 1. CloudGateway initialization and configuration
 * 2. Token management (store, verify, refresh, expiry)
 * 3. User info retrieval
 * 4. License verification
 * 5. Global config fetching
 * 6. Version check / OTA update detection
 * 7. Error reporting
 * 8. Feedback submission
 * 9. Auth state management (login/logout/isAuthenticated)
 * 10. Machine ID generation consistency
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CloudGateway,
  createCloudGateway,
} from "../core/cloud-gateway";

describe("T-GW-001: Cloud Gateway - User Login & Authorization", () => {
  let gateway: CloudGateway;

  beforeEach(() => {
    gateway = new CloudGateway({
      baseUrl: "https://api.storytree.dev",
      timeout: 5000,
      retryCount: 1,
      retryDelay: 1000,
    });
  });

  describe("Suite A: Gateway Initialization", () => {
    it("should create gateway with default config", () => {
      const g = createCloudGateway({});
      expect(g).toBeInstanceOf(CloudGateway);
      const config = g.getConfig();
      expect(config.baseUrl).toContain("storytree");
      expect(config.timeout).toBe(10000);
      expect(config.retryCount).toBe(3);
    });

    it("should accept custom configuration", () => {
      const custom = new CloudGateway({
        baseUrl: "https://custom.api.example.com",
        timeout: 30000,
        retryCount: 5,
        retryDelay: 1000,
        apiKey: "test-key-12345",
      });

      const config = custom.getConfig();
      expect(config.baseUrl).toBe("https://custom.api.example.com");
      expect(config.timeout).toBe(30000);
      expect(config.retryCount).toBe(5);
      expect(config.apiKey).toBe("test-key-12345");
    });

    it("should generate consistent auth headers", () => {
      const headers = gateway.getAuthHeaders();

      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["X-Request-ID"]).toBeDefined();
      expect(headers["X-Machine-ID"]).toBeDefined();
      expect(headers["X-Extension-Version"]).toBeDefined();
      expect(headers["X-Machine-ID"].length).toBe(16);
    });

    it("should include API key in headers when configured", () => {
      const keyed = new CloudGateway({
        baseUrl: "https://example.com",
        apiKey: "sk-test-key",
      } as import("../core/cloud-gateway").GatewayConfig);

      const headers = keyed.getAuthHeaders();
      expect(headers["Authorization"]).toContain("sk-test-key");
    });
  });

  describe("Suite B: Authentication State Management", () => {
    it("should start unauthenticated", () => {
      expect(gateway.isAuthenticated()).toBe(false);
    });

    it("should report no token initially", () => {
      expect(gateway.getAuthToken()).toBeNull();
    });

    it("should report no user initially", () => {
      expect(gateway.getUserInfo()).toBeNull();
    });

    it("should clear all state on logout", () => {
      gateway.logout();
      expect(gateway.getAuthToken()).toBeNull();
      expect(gateway.getUserInfo()).toBeNull();
      expect(gateway.getLicenseInfo()).toBeNull();
      expect(gateway.isAuthenticated()).toBe(false);
    });
  });

  describe("Suite C: Token Management", () => {
    it("should store valid token after authentication", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          accessToken: "at-valid-token",
          refreshToken: "rt-refresh-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          expiresAt: Date.now() + 3600_000,
          scope: ["read", "write"],
        },
        requestId: "req-1",
        timestamp: new Date().toISOString(),
      });

      await gateway.authenticateWithToken("some-token");

      expect(gateway.isAuthenticated()).toBe(true);
      const token = gateway.getAuthToken();
      expect(token?.accessToken).toBe("at-valid-token");
      expect(token?.refreshToken).toBe("rt-refresh-token");
      expect(token?.scope).toEqual(["read", "write"]);
    });

    it("should detect expired tokens", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          accessToken: "expired-token",
          refreshToken: "rt-expired",
          tokenType: "Bearer",
          expiresIn: 3600,
          expiresAt: Date.now() - 1000,
          scope: [],
        },
        requestId: "req-2",
        timestamp: new Date().toISOString(),
      });

      await gateway.authenticateWithToken("old-token");
      expect(gateway.isAuthenticated()).toBe(false);
    });

    it("should throw on invalid token verification", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: false,
        error: { code: "AUTH_INVALID_TOKEN", message: "Token is invalid" },
        requestId: "req-3",
        timestamp: new Date().toISOString(),
      });

      await expect(
        gateway.authenticateWithToken("bad-token")
      ).rejects.toThrow("Token verification failed");
    });

    it("should throw when no refresh token available for refresh", async () => {
      await expect(
        gateway.refreshAccessToken()
      ).rejects.toThrow("No refresh token available");
    });

    it("should update token on successful refresh", async () => {
      vi.spyOn(gateway, "request" as never)
        .mockResolvedValueOnce({
          success: true,
          data: {
            accessToken: "old-at",
            refreshToken: "rt-ok",
            tokenType: "Bearer",
            expiresIn: 3600,
            expiresAt: Date.now() + 3600_000,
            scope: [],
          },
          requestId: "req-4",
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            accessToken: "new-at-refreshed",
            refreshToken: "rt-new",
            tokenType: "Bearer",
            expiresIn: 7200,
            expiresAt: Date.now() + 7200_000,
            scope: [],
          },
          requestId: "req-5",
          timestamp: new Date().toISOString(),
        });

      await gateway.authenticateWithToken("init");
      const refreshed = await gateway.refreshAccessToken();
      expect(refreshed.accessToken).toBe("new-at-refreshed");
      expect(refreshed.expiresIn).toBe(7200);
    });
  });

  describe("Suite D: User Info Retrieval", () => {
    it("should fetch and cache user info", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          id: "user-001",
          email: "user@example.com",
          name: "Test User",
          avatar: "https://avatar.url/pic.jpg",
          plan: "pro",
          createdAt: "2026-01-01T00:00:00Z",
        },
        requestId: "req-user-1",
        timestamp: new Date().toISOString(),
      });

      const user = await gateway.getCurrentUser();

      expect(user.id).toBe("user-001");
      expect(user.email).toBe("user@example.com");
      expect(user.name).toBe("Test User");
      expect(user.plan).toBe("pro");

      const cached = gateway.getUserInfo();
      expect(cached?.name).toBe("Test User");
    });

    it("should return cached user on second call", async () => {
      let callCount = 0;
      vi.spyOn(gateway, "request" as never).mockImplementation(
        async () => {
          callCount++;
          return {
            success: true,
            data: { id: "u1", name: "User", email: "x@y.com", plan: "free", createdAt: "" },
            requestId: "",
            timestamp: "",
          };
        }
      );

      await gateway.getCurrentUser();
      await gateway.getCurrentUser();

      expect(callCount).toBe(1);
    });

    it("should throw on failed user fetch", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not logged in" },
        requestId: "",
        timestamp: "",
      });

      await expect(gateway.getCurrentUser()).rejects.toThrow(
        "Failed to fetch user info"
      );
    });
  });

  describe("Suite E: License Verification", () => {
    it("should verify valid license", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          userId: "user-001",
          licenseKey: "LICENSE-KEY-XYZ",
          plan: "pro",
          validFrom: "2026-01-01",
          validUntil: "2027-12-31",
          features: ["ai_chat", "unlimited_projects", "cloud_sync"],
          maxProjects: 100,
          isActive: true,
        },
        requestId: "req-license-1",
        timestamp: new Date().toISOString(),
      });

      const license = await gateway.verifyLicense("LICENSE-KEY-XYZ");

      expect(license.isActive).toBe(true);
      expect(license.plan).toBe("pro");
      expect(license.features).toContain("ai_chat");
      expect(license.maxProjects).toBe(100);
    });

    it("should detect inactive/expired licenses", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          userId: "user-002",
          licenseKey: "EXPIRED-KEY",
          plan: "free",
          validFrom: "2025-01-01",
          validUntil: "2025-12-31",
          features: [],
          maxProjects: 1,
          isActive: false,
        },
        requestId: "req-license-2",
        timestamp: new Date().toISOString(),
      });

      const license = await gateway.verifyLicense("EXPIRED-KEY");
      expect(license.isActive).toBe(false);
      expect(gateway.isLicenseValid()).toBe(false);
    });

    it("should use environment variable as fallback license key", async () => {
      const originalEnv = process.env.STORYTREE_LICENSE_KEY;
      process.env.STORYTREE_LICENSE_KEY = "ENV-LICENSE-KEY";

      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          userId: "u1",
          licenseKey: "ENV-LICENSE-KEY",
          plan: "enterprise",
          validFrom: "2026-01-01",
          validUntil: "2099-12-31",
          features: ["all"],
          maxProjects: 999,
          isActive: true,
        },
        requestId: "",
        timestamp: "",
      });

      const license = await gateway.verifyLicense();
      expect(license.licenseKey).toBe("ENV-LICENSE-KEY");

      if (originalEnv) {
        process.env.STORYTREE_LICENSE_KEY = originalEnv;
      } else {
        delete process.env.STORYTREE_LICENSE_KEY;
      }
    });
  });

  describe("Suite F: Global Config Fetching", () => {
    it("should fetch global configuration", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          aiModel: "gpt-4o",
          maxTokens: 128000,
          features: { aiChat: true, export: true },
          maintenanceMode: false,
        },
        requestId: "",
        timestamp: "",
      });

      const config = await gateway.fetchGlobalConfig();

      expect((config as Record<string, unknown>).aiModel).toBe("gpt-4o");
      expect((config as Record<string, unknown>).maintenanceMode).toBe(false);
    });
  });

  describe("Suite G: Version Check (OTA)", () => {
    it("should detect available updates", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          latestVersion: "2.0.0",
          downloadUrl: "https://storytree.dev/download/v2.0.0",
          releaseNotes: "New AI features added!",
          mandatory: false,
        },
        requestId: "",
        timestamp: "",
      });

      const result = await gateway.checkForUpdates("1.0.0");

      expect(result.hasUpdate).toBe(true);
      expect(result.latestVersion).toBe("2.0.0");
      expect(result.downloadUrl).toBeDefined();
    });

    it("should return no update when current version is latest", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          latestVersion: "1.0.0",
          downloadUrl: "",
          releaseNotes: "",
          mandatory: false,
        },
        requestId: "",
        timestamp: "",
      });

      const result = await gateway.checkForUpdates("1.0.0");
      expect(result.hasUpdate).toBe(false);
    });

    it("should handle network errors gracefully in version check", async () => {
      vi.spyOn(gateway, "request" as never).mockRejectedValue(new Error("Network error"));

      const result = await gateway.checkForUpdates("1.0.0");
      expect(result.hasUpdate).toBe(false);
    });

    it("should compare semantic versions correctly", async () => {
      vi.spyOn(gateway, "request" as never).mockImplementation(async (
        ..._args: unknown[]
      ) => {
        return {
          success: true,
          data: {
            latestVersion: "1.5.0",
            downloadUrl: "",
            releaseNotes: "",
            mandatory: false,
          },
          requestId: "",
          timestamp: "",
        };
      });

      const v100 = await gateway.checkForUpdates("1.0.0");
      expect(v100.hasUpdate).toBe(true);

      const v200 = await gateway.checkForUpdates("2.0.0");
      expect(v200.hasUpdate).toBe(false);
    });
  });

  describe("Suite H: Error Reporting", () => {
    it("should report errors without throwing", async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error("Server down"));
      vi.spyOn(gateway, "request" as never).mockImplementation(mockRequest);

      await expect(
        gateway.reportError({ type: "runtime", message: "Something broke" })
      ).resolves.not.toThrow();
    });
  });

  describe("Suite I: Feedback Submission", () => {
    it("should submit feedback successfully", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: { ticketId: "FB-20260407-001" },
        requestId: "",
        timestamp: "",
      });

      const result = await gateway.submitFeedback({
        type: "bug",
        subject: "UI glitch on dashboard",
        body: "The project cards are misaligned...",
        email: "user@test.com",
      });

      expect(result.ticketId).toBe("FB-20260407-001");
    });

    it("should reject failed feedback submissions", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests" },
        requestId: "",
        timestamp: "",
      });

      await expect(
        gateway.submitFeedback({ type: "general", subject: "Test", body: "Body" })
      ).rejects.toThrow("Feedback submission failed");
    });
  });

  describe("Suite J: Machine ID Consistency", () => {
    it("should generate same machine ID across calls", () => {
      const h1 = gateway.getAuthHeaders()["X-MACHINE-ID"];
      const h2 = gateway.getAuthHeaders()["X-MACHINE-ID"];
      expect(h1).toBe(h2);
    });

    it("should generate hex-format machine ID", () => {
      const mid = gateway.getAuthHeaders()["X-MACHINE-ID"];
      expect(mid.length).toBe(16);
      expect(/^[0-9a-f]{16}$/.test(mid)).toBe(true);
    });

    it("should generate different IDs for different machines (theoretical)", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const g = createCloudGateway({});
        ids.add(g.getAuthHeaders()["X-MACHINE-ID"]);
      }

      expect(ids.size).toBe(10);
    });
  });

  describe("Suite K: Async Dispose", () => {
    it("should clean up on dispose", async () => {
      vi.spyOn(gateway, "request" as never).mockResolvedValue({
        success: true,
        data: {
          accessToken: "t",
          refreshToken: "rt",
          tokenType: "B",
          expiresIn: 3600,
          expiresAt: Date.now() + 99999,
          scope: [],
        },
        requestId: "",
        timestamp: "",
      });

      await gateway.authenticateWithToken("x");
      expect(gateway.isAuthenticated()).toBe(true);

      await gateway[Symbol.asyncDispose]();
      expect(gateway.isAuthenticated()).toBe(false);
    });
  });
});
