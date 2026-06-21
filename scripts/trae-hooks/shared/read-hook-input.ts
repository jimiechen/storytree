/**
 * @file scripts/trae-hooks/shared/read-hook-input.ts
 * @description 从 stdin 读取 Trae Hook 输入 JSON
 *
 * P2-E：所有 Trae Hook 脚本共享此辅助函数，按协议解析 stdin 中的 JSON。
 * 如果解析失败，返回空对象并附加解析错误信息，避免 Hook 脚本因输入异常而崩溃。
 */

export interface HookInput {
  hookEventName?: string;
  sessionId?: string;
  projectPath?: string;
  prompt?: string;
  tool?: {
    name: string;
    input: unknown;
    output?: unknown;
  };
  filesChanged?: string[];
  output?: string;
}

export async function readHookInput(): Promise<{ input: HookInput; parseError?: string }> {
  const chunks: Buffer[] = [];

  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) {
        resolve({ input: {} });
        return;
      }
      try {
        resolve({ input: JSON.parse(raw) as HookInput });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        resolve({ input: {}, parseError: message });
      }
    });
    process.stdin.on('error', (error) => {
      resolve({ input: {}, parseError: error.message });
    });
  });
}
