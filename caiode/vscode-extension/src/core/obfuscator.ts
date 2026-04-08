import * as crypto from "crypto";

export interface ObfuscationConfig {
  enabled: boolean;
  stringEncoding: "base64" | "xor" | "none";
  identifierPrefix: string;
  deadCodeInjection: boolean;
  selfDefending: boolean;
  debugProtection: boolean;
}

const DEFAULT_CONFIG: ObfuscationConfig = {
  enabled: true,
  stringEncoding: "xor",
  identifierPrefix: "_0x",
  deadCodeInjection: false,
  selfDefending: true,
  debugProtection: true,
};

export class CodeObfuscator {
  private config: ObfuscationConfig;

  constructor(config?: Partial<ObfuscationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  encodeString(value: string): string {
    if (!this.config.enabled || this.config.stringEncoding === "none") {
      return value;
    }

    switch (this.config.stringEncoding) {
      case "base64":
        return Buffer.from(value).toString("base64");

      case "xor": {
        const key = this.getXorKey();
        const encoded = Array.from(value)
          .map((ch, i) =>
            String.fromCharCode(ch.charCodeAt(0) ^ key.charCodeAt(i % key.length))
          )
          .join("");
        const keyB64 = Buffer.from(key).toString("base64");
        const valB64 = Buffer.from(encoded).toString("base64");
        return `${keyB64}:${valB64}`;
      }

      default:
        return value;
    }
  }

  decodeString(encoded: string): string {
    if (this.config.stringEncoding === "none" || !encoded.includes(":")) {
      return encoded;
    }

    const [keyB64, valB64] = encoded.split(":");
    if (!keyB64 || !valB64) return encoded;

    try {
      const key = Buffer.from(keyB64, "base64").toString("utf8");
      const encodedVal = Buffer.from(valB64, "base64").toString("utf8");

      return Array.from(encodedVal)
        .map((ch, i) =>
          String.fromCharCode(
            ch.charCodeAt(0) ^ key.charCodeAt(i % key.length)
          )
        )
        .join("");
    } catch {
      return encoded;
    }
  }

  generateIdentifier(original: string): string {
    const hash = crypto
      .createHash("sha256")
      .update(original)
      .digest("hex")
      .slice(0, 8);
    return `${this.config.identifierPrefix}${hash}`;
  }

  obfuscateObjectKeys<T extends Record<string, unknown>>(
    obj: T
  ): Record<string, unknown> {
    if (!this.config.enabled) return obj as Record<string, unknown>;

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const obfuscatedKey = this.generateIdentifier(key);
      result[obfuscatedKey] =
        typeof value === "string"
          ? this.encodeString(value)
          : value;
    }

    result.__keys = Object.keys(obj).reduce<Record<string, string>>(
      (acc, original) => {
        acc[original] = this.generateIdentifier(original);
        return acc;
      },
      {}
    );

    return result;
  }

  addSelfDefendingCode(sourceCode: string): string {
    if (!this.config.selfDefending || !this.config.enabled) {
      return sourceCode;
    }

    const defendingCode = `
(function(){
  var _sd=(function(){try{var _t=Date.now();return function(){if(Date.now()-_t<100){throw new Error('Debugging detected');}_t=Date.now();};}catch(e){return function(){};}})();
  setInterval(_sd,50);
  if(typeof module!=='undefined'){var _orig=module.require;module.req=function(){_sd();return _orig.apply(this,arguments);};}
})();
`;

    return defendingCode + "\n" + sourceCode;
  }

  addDebugProtection(sourceCode: string): string {
    if (!this.config.debugProtection || !this.config.enabled) {
      return sourceCode;
    }

    const protectionCode = `
(function(){
  var _dp=function(){};
  try{Object.defineProperty(_dp,'name',{get:function(){debugger;}});}catch(e){}
  try{setInterval(function(){(function(){}).constructor('debugger')();},3000);}catch(e){}
})();
`;

    return protectionCode + "\n" + sourceCode;
  }

  generateDeadCode(): string {
    const patterns = [
      `var _dc_${Math.random().toString(36).slice(2)}=Math.random()>0.5?true:false;if(_dc_${Math.random().toString(36).slice(2)}){void 0;}`,
      `(function(){if(false){var x=[1,2,3].map(n=>n*2);}})();`,
      `void(function(){var _t=typeof undefined==='undefined'?null:void 0;})();`,
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  applyDeadCodeInjection(sourceCode: string, count: number = 3): string {
    if (!this.config.deadCodeInjection || !this.config.enabled) {
      return sourceCode;
    }

    let result = sourceCode;
    for (let i = 0; i < count; i++) {
      const insertionPoint = Math.floor(Math.random() * (result.split("\n").length - 1));
      const lines = result.split("\n");
      lines.splice(insertionPoint, 0, this.generateDeadCode());
      result = lines.join("\n");
    }

    return result;
  }

  getConfig(): Readonly<ObfuscationConfig> {
    return { ...this.config };
  }

  private getXorKey(): string {
    return crypto
      .randomBytes(16)
      .toString("hex")
      .slice(0, 16);
  }
}

export function createObfuscator(
  config?: Partial<ObfuscationConfig>
): CodeObfuscator {
  return new CodeObfuscator(config);
}

export { DEFAULT_CONFIG };
