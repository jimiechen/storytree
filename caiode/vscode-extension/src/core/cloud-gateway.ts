import * as crypto from "crypto";
import * as https from "https";
import * as http from "http";

export interface GatewayConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
  scope: string[];
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
}

export interface LicenseInfo {
  userId: string;
  licenseKey: string;
  plan: string;
  validFrom: string;
  validUntil: string;
  features: string[];
  maxProjects: number;
  isActive: boolean;
}

export interface GatewayResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
  timestamp: string;
}

const DEFAULT_CONFIG: Partial<GatewayConfig> = {
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
};

export class CloudGateway implements AsyncDisposable {
  private config: GatewayConfig;
  private authToken: AuthToken | null = null;
  private currentUser: UserInfo | null = null;
  private license: LicenseInfo | null = null;

  constructor(config: GatewayConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async authenticateWithToken(
    accessToken: string,
    refreshToken?: string
  ): Promise<AuthToken> {
    const response = await this.request<AuthToken>("POST", "/auth/verify", {
      token: accessToken,
    });

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || "Token verification failed"
      );
    }

    this.authToken = response.data;
    return this.authToken;
  }

  async loginWithEmailPassword(
    email: string,
    password: string
  ): Promise<AuthToken> {
    const response = await this.request<AuthToken>("POST", "/auth/login", {
      email,
      password: this.hashPassword(password),
    });

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || "Login failed"
      );
    }

    this.authToken = response.data;
    return this.authToken;
  }

  async refreshAccessToken(): Promise<AuthToken> {
    if (!this.authToken?.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await this.request<AuthToken>(
      "POST",
      "/auth/refresh",
      { refreshToken: this.authToken.refreshToken }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Token refresh failed");
    }

    this.authToken = response.data;
    return this.authToken;
  }

  async getCurrentUser(): Promise<UserInfo> {
    if (this.currentUser) return this.currentUser;

    const response = await this.request<UserInfo>("GET", "/user/me");

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Failed to fetch user info");
    }

    this.currentUser = response.data;
    return this.currentUser;
  }

  async verifyLicense(licenseKey?: string): Promise<LicenseInfo> {
    const key =
      licenseKey ||
      process.env.STORYTREE_LICENSE_KEY ||
      "";

    const response = await this.request<LicenseInfo>(
      "POST",
      "/license/verify",
      { licenseKey: key, machineId: this.getMachineId() }
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || "License verification failed"
      );
    }

    this.license = response.data;
    return this.license;
  }

  async fetchGlobalConfig(): Promise<Record<string, unknown>> {
    const response = await this.request<Record<string, unknown>>(
      "GET",
      "/config/global"
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch global config");
    }

    return response.data;
  }

  async checkForUpdates(currentVersion: string): Promise<{
    hasUpdate: boolean;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
  }> {
    try {
      const response = await this.request<{
        latestVersion: string;
        downloadUrl: string;
        releaseNotes: string;
        mandatory: boolean;
      }>("GET", "/updates/check", { currentVersion });

      if (!response.success || !response.data) {
        return { hasUpdate: false };
      }

      const data = response.data;
      const hasUpdate = this.compareVersions(
        currentVersion,
        data.latestVersion
      ) < 0;

      return {
        hasUpdate,
        latestVersion: data.latestVersion,
        downloadUrl: data.downloadUrl,
        releaseNotes: data.releaseNotes,
      };
    } catch {
      return { hasUpdate: false };
    }
  }

  async reportError(error: {
    type: string;
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  }): Promise<void> {
    await this.request("POST", "/errors/report", error).catch(() => {});
  }

  submitFeedback(feedback: {
    type: "bug" | "feature" | "general";
    subject: string;
    body: string;
    email?: string;
  }): Promise<{ ticketId: string }> {
    const response = await this.request<{ ticketId: string }>(
      "POST",
      "/feedback/submit",
      feedback
    );

    if (!response.success || !response.data) {
      throw new Error("Feedback submission failed");
    }

    return response.data;
  }

  isAuthenticated(): boolean {
    if (!this.authToken) return false;
    return Date.now() < this.authToken.expiresAt;
  }

  isLicenseValid(): boolean {
    if (!this.license) return false;
    if (!this.license.isActive) return false;
    return new Date(this.license.validUntil) > new Date();
  }

  getAuthToken(): AuthToken | null {
    return this.authToken;
  }

  getUserInfo(): UserInfo | null {
    return this.currentUser;
  }

  getLicenseInfo(): LicenseInfo | null {
    return this.license;
  }

  logout(): void {
    this.authToken = null;
    this.currentUser = null;
    this.license = null;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Request-ID": crypto.randomUUID(),
      "X-Machine-ID": this.getMachineId(),
      "X-Extension-Version": "1.0.0",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    if (this.authToken?.accessToken) {
      headers["Authorization"] = `Bearer ${this.authToken.accessToken}`;
    }

    return headers;
  }

  getConfig(): Readonly<GatewayConfig> {
    return { ...this.config };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<GatewayResponse<T>> {
    const url = new URL(path, this.config.baseUrl);

    const options: https.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: this.getAuthHeaders(),
      timeout: this.config.timeout,
    };

    return new Promise((resolve, reject) => {
      const req = (url.protocol === "https:" ? https : http).request(
        options,
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              resolve(json as GatewayResponse<T>);
            } catch {
              resolve({
                success: false,
                error: {
                  code: "PARSE_ERROR",
                  message: "Invalid JSON response",
                },
                requestId: "",
                timestamp: new Date().toISOString(),
              });
            }
          });
        }
      );

      req.on("error", (e) => {
        reject(new Error(`Gateway request failed: ${(e as Error).message}`));
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Gateway request timed out"));
      });

      if (body && method !== "GET") {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  private hashPassword(password: string): string {
    return crypto
      .createHash("sha256")
      .update(password + ":storytree-salt")
      .digest("hex");
  }

  private getMachineId(): string {
    const os = require("os") as typeof import("os");
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();

    const raw = `${hostname}-${platform}-${arch}`;
    return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);
    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] ?? 0;
      const p2 = parts2[i] ?? 0;
      if (p1 !== p2) return p1 - p2;
    }

    return 0;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.logout();
  }
}

export function createCloudGateway(
  config: Partial<GatewayConfig>
): CloudGateway {
  return new CloudGateway({
    ...DEFAULT_CONFIG,
    baseUrl: "https://api.storytree.dev",
    ...config,
  } as GatewayConfig);
}
