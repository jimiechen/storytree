import * as vscode from "vscode";

export const SECRET_KEYS = {
  OPENAI_API_KEY: "storytree.openai.apiKey",
  ANTHROPIC_API_KEY: "storytree.anthropic.apiKey",
  STORYTREE_TOKEN: "storytree.auth.token",
  STORYTREE_REFRESH: "storytree.auth.refreshToken",
} as const;

export type SecretKey = (typeof SECRET_KEYS)[keyof typeof SECRET_KEYS];

export interface SecretMetadata {
  key: SecretKey;
  label: string;
  description: string;
  isRequired: boolean;
  maskChar?: string;
}

export const SECRET_REGISTRY: Record<SecretKey, SecretMetadata> = {
  [SECRET_KEYS.OPENAI_API_KEY]: {
    key: SECRET_KEYS.OPENAI_API_KEY,
    label: "OpenAI API Key",
    description:
      "用于 AI 聊天、大纲生成、角色对话等功能的 OpenAI API 密钥。存储于 VS Code 安全存储中，不会明文写入配置文件。",
    isRequired: false,
    maskChar: "•••",
  },
  [SECRET_KEYS.ANTHROPIC_API_KEY]: {
    key: SECRET_KEYS.ANTHROPIC_API_KEY,
    label: "Anthropic (Claude) API Key",
    description:
      "用于 Claude 模型的备选 API 密钥。",
    isRequired: false,
    maskChar: "•••",
  },
  [SECRET_KEYS.STORYTREE_TOKEN]: {
    key: SECRET_KEYS.STORYTREE_TOKEN,
    label: "StoryTree 访问令牌",
    description:
      "用户登录后获取的访问令牌，用于云端服务认证。",
    isRequired: true,
  },
  [SECRET_KEYS.STORYTREE_REFRESH]: {
    key: SECRET_KEYS.STORYTREE_REFRESH,
    label: "StoryTree 刷新令牌",
    description:
      "用于在访问令牌过期时自动获取新令牌的刷新凭证。",
    isRequired: true,
  },
};

export class SecretManager implements vscode.Disposable {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async store(key: SecretKey, value: string): Promise<void> {
    await this.context.secrets.store(key, value);
  }

  async get(key: SecretKey): Promise<string | undefined> {
    return await this.context.secrets.get(key);
  }

  async delete(key: SecretKey): Promise<void> {
    await this.context.secrets.delete(key);
  }

  async has(key: SecretKey): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined && value.length > 0;
  }

  async getOrPrompt(
    key: SecretKey,
    options?: { placeholder?: string; ignoreFocusOut?: boolean }
  ): Promise<string | undefined> {
    const existing = await this.get(key);
    if (existing) return existing;

    const meta = SECRET_REGISTRY[key];
    if (!meta) throw new Error(`Unknown secret key: ${key}`);

    const input = await vscode.window.showInputBox({
      prompt: meta.description,
      password: true,
      placeHolder: options?.placeholder || `输入${meta.label}`,
      ignoreFocusOut: options?.ignoreFocusOut ?? true,
      title: `StoryTree - ${meta.label}`,
      validateInput: (value) => {
        if (meta.isRequired && (!value || value.trim().length === 0)) {
          return `${meta.label} 为必填项`;
        }
        if (value && value.trim().length < 8) {
          return `${meta.label} 长度不能少于 8 个字符`;
        }
        return undefined;
      },
    });

    if (input && input.trim().length > 0) {
      await this.store(key, input.trim());
      return input.trim();
    }

    return undefined;
  }

  async getMaskedValue(key: SecretKey): Promise<string> {
    const exists = await this.has(key);
    const meta = SECRET_REGISTRY[key];
    return exists ? (meta?.maskChar || "****") : "(未设置)";
  }

  async getAllStatus(): Promise<
    Array<{ key: SecretKey; label: string; isSet: boolean; masked: string }>
  > {
    const results = [];
    for (const key of Object.values(SECRET_KEYS)) {
      const meta = SECRET_REGISTRY[key];
      const isSet = await this.has(key);
      results.push({
        key,
        label: meta?.label || key,
        isSet,
        masked: isSet ? (meta?.maskChar || "****") : "(未设置)",
      });
    }
    return results;
  }

  async clearAll(): Promise<void> {
    for (const key of Object.values(SECRET_KEYS)) {
      await this.delete(key);
    }
  }

  dispose(): void {}
}
