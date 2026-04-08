import * as crypto from "crypto";

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
}

const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: "aes-256-gcm",
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
};

export interface EncryptedPayload {
  iv: string;
  tag: string;
  ciphertext: string;
  authData?: string;
}

export class DataEncryption {
  private config: EncryptionConfig;
  private masterKey: Buffer;

  constructor(masterKey: string | Buffer, config?: Partial<EncryptionConfig>) {
    this.config = { ...DEFAULT_ENCRYPTION_CONFIG, ...config };

    if (typeof masterKey === "string") {
      this.masterKey = Buffer.from(
        masterKey.padEnd(this.config.keyLength, "0").slice(0, this.config.keyLength),
        "utf8"
      );
    } else {
      this.masterKey = Buffer.from(masterKey);
    }
  }

  static generateKey(): string {
    return crypto.randomBytes(this.DEFAULT_ENCRYPTION_CONFIG.keyLength).toString("hex");
  }

  static generateKeyBuffer(): Buffer {
    return crypto.randomBytes(DEFAULT_ENCRYPTION_CONFIG.keyLength);
  }

  encrypt(plaintext: string, aad?: string): EncryptedPayload {
    const iv = crypto.randomBytes(this.config.ivLength);
    const cipher = crypto.createCipheriv(
      this.config.algorithm,
      this.masterKey,
      iv,
      { authTagLength: this.config.tagLength }
    );

    if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      ciphertext: encrypted,
      authData: aad,
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const iv = Buffer.from(payload.iv, "base64");
    const tag = Buffer.from(payload.tag, "base64");

    const decipher = crypto.createDecipheriv(
      this.config.algorithm,
      this.masterKey,
      iv,
      { authTagLength: this.config.tagLength }
    );

    if (payload.authData) {
      decipher.setAAD(Buffer.from(payload.authData, "utf8"));
    }

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(payload.ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  encryptJSON<T>(data: T, aad?: string): EncryptedPayload {
    const plaintext = JSON.stringify(data);
    return this.encrypt(plaintext, aad);
  }

  decryptJSON<T>(payload: EncryptedPayload): T {
    const plaintext = this.decrypt(payload);
    return JSON.parse(plaintext) as T;
  }

  hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  hmac(data: string, key?: string): string {
    const hmacKey = key
      ? Buffer.from(key.padEnd(this.config.keyLength, "0").slice(0, this.config.keyLength))
      : this.masterKey;
    return crypto.createHmac("sha256", hmacKey).update(data).digest("hex");
  }

  verifyIntegrity(data: string, expectedHash: string): boolean {
    const computedHash = this.hash(data);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  }

  deriveKey(password: string, salt: string, iterations: number = 100000): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      this.config.keyLength,
      "sha256"
    );
  }

  getConfig(): Readonly<EncryptionConfig> {
    return { ...this.config };
  }
}

export function createEncryption(
  masterKey: string | Buffer,
  config?: Partial<EncryptionConfig>
): DataEncryption {
  return new DataEncryption(masterKey, config);
}
