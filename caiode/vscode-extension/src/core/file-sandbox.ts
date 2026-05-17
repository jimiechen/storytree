import * as fs from "fs";
import * as path from "path";

export interface SandboxConfig {
  workspaceRoot: string;
  allowedDirs: string[];
  blockedPatterns: RegExp[];
  maxFileSize: number;
  allowedExtensions: string[];
}

export interface FileAccessResult {
  allowed: boolean;
  reason?: string;
  resolvedPath?: string;
}

const DEFAULT_CONFIG: Partial<SandboxConfig> = {
  maxFileSize: 10 * 1024 * 1024,
  blockedPatterns: [
    /\.\./,
    /^\/(etc|var|tmp|usr|opt|sys|proc|dev)\//i,
    /\.env(\.|$)/i,
    /\.pem$/i,
    /\.key$/i,
    /node_modules\//,
    /\.git\//,
  ],
};

export class FileSandbox {
  private config: SandboxConfig;

  constructor(workspaceRoot: string, options?: Partial<SandboxConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...options,
      workspaceRoot: path.resolve(workspaceRoot),
      allowedDirs: [
        ".storytree",
        "projects",
        "data",
        ...(options?.allowedDirs || []),
      ].map((d) => d),
      allowedExtensions: [
        ".json",
        ".md",
        ".txt",
        ".storytree",
        ".sqlite",
        ".db",
        ".csv",
        ...(options?.allowedExtensions || []),
      ],
    } as SandboxConfig;
  }

  getSandboxRoot(): string {
    return path.join(this.config.workspaceRoot, ".storytree");
  }

  resolvePath(relativePath: string): string {
    const sandboxRoot = this.getSandboxRoot();
    const resolved = path.resolve(sandboxRoot, relativePath);
    return resolved;
  }

  validatePath(filePath: string): FileAccessResult {
    let resolvedPath: string;

    if (path.isAbsolute(filePath)) {
      resolvedPath = path.resolve(filePath);
    } else {
      resolvedPath = this.resolvePath(filePath);
    }

    const sandboxRoot = this.getSandboxRoot();

    if (!resolvedPath.startsWith(sandboxRoot)) {
      return {
        allowed: false,
        reason: `路径越界: 访问目标位于沙箱目录之外 (${resolvedPath})`,
        resolvedPath,
      };
    }

    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(resolvedPath) || pattern.test(filePath)) {
        return {
          allowed: false,
          reason: `路径被安全策略阻止: 匹配黑名单模式 ${pattern}`,
          resolvedPath,
        };
      }
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    if (
      this.config.allowedExtensions.length > 0 &&
      !this.config.allowedExtensions.includes(ext)
    ) {
      return {
        allowed: false,
        reason: `文件类型不被允许: .${ext} (允许: ${this.config.allowedExtensions.join(", ")})`,
        resolvedPath,
      };
    }

    return { allowed: true, resolvedPath };
  }

  async readFile(
    filePath: string,
    encoding: BufferEncoding = "utf-8"
  ): Promise<string> {
    const check = this.validatePath(filePath);
    if (!check.allowed) {
      throw new Error(check.reason || "文件访问被拒绝");
    }

    const stat = await fs.promises.stat(check.resolvedPath!);
    if (stat.size > this.config.maxFileSize) {
      throw new Error(
        `文件过大: ${(stat.size / 1024 / 1024).toFixed(1)}MB 超过限制 ${this.config.maxFileSize / 1024 / 1024}MB`
      );
    }

    return await fs.promises.readFile(check.resolvedPath!, encoding);
  }

  async writeFile(
    filePath: string,
    content: string | Buffer,
    encoding: BufferEncoding = "utf-8"
  ): Promise<void> {
    const check = this.validatePath(filePath);
    if (!check.allowed) {
      throw new Error(check.reason || "文件写入被拒绝");
    }

    const dir = path.dirname(check.resolvedPath!);
    await fs.promises.mkdir(dir, { recursive: true });

    await fs.promises.writeFile(check.resolvedPath!, content, encoding);
  }

  async deleteFile(filePath: string): Promise<void> {
    const check = this.validatePath(filePath);
    if (!check.allowed) {
      throw new Error(check.reason || "文件删除被拒绝");
    }

    await fs.promises.unlink(check.resolvedPath!);
  }

  async listFiles(dirPath?: string): Promise<string[]> {
    const targetDir = dirPath
      ? this.resolvePath(dirPath)
      : this.getSandboxRoot();

    const check = this.validatePath(targetDir);
    if (!check.allowed) {
      throw new Error(check.reason || "目录访问被拒绝");
    }

    const entries = await fs.promises.readdir(check.resolvedPath!, {
      withFileTypes: true,
    });

    const results: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(check.resolvedPath!, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.listFiles(
          path.relative(this.getSandboxRoot(), fullPath)
        );
        results.push(...subFiles);
      } else {
        results.push(fullPath);
      }
    }

    return results;
  }

  async exists(filePath: string): Promise<boolean> {
    const check = this.validatePath(filePath);
    if (!check.allowed) return false;

    try {
      await fs.promises.access(check.resolvedPath!);
      return true;
    } catch {
      return false;
    }
  }

  ensureSandboxDir(): void {
    const root = this.getSandboxRoot();
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
  }

  getConfig(): Readonly<SandboxConfig> {
    return { ...this.config };
  }
}
