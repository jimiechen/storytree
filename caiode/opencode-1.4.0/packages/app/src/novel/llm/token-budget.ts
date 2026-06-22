/**
 * @file llm/token-budget.ts
 * @description 章节生成 Token / 字符预算控制 — P3-C
 *
 * P3-C 把真实 LLM 扩展到完整章节生成，必须避免超长上下文导致：
 * 1. 费用失控；2. 模型上下文窗口溢出；3. 响应质量下降。
 * 本模块不依赖分词器，使用字符数作为 proxy，并保留语义尾部。
 */

/**
 * 字符预算配置。
 *
 * 中文场景下粗略估算：1 中文字符 ≈ 1 token，英文单词 ≈ 1.3 token。
 * 默认预算按中文字符留 3 倍余量，避免超出常见模型上下文窗口。
 */
export interface TokenBudget {
  /** prompt 最大字符数（含系统提示与用户输入） */
  maxPromptChars: number;
  /** 期望返回的最大字符数 */
  maxResponseChars: number;
  /** 为系统提示、指令模板预留的字符数 */
  reserveChars: number;
}

/**
 * 章节生成默认预算。
 *
 * - maxPromptChars=6000：约 2000 token，适配常见 8K/16K 模型。
 * - maxResponseChars=8000：给出生成内容充足空间。
 * - reserveChars=500：系统提示与格式指令占用。
 */
export const DEFAULT_CHAPTER_GENERATION_BUDGET: TokenBudget = {
  maxPromptChars: 6000,
  maxResponseChars: 8000,
  reserveChars: 500,
};

/**
 * 裁剪结果。
 */
export interface TrimContextResult {
  /** 裁剪后的文本 */
  text: string;
  /** 是否发生过裁剪 */
  wasTrimmed: boolean;
  /** 原始字符数 */
  originalLength: number;
  /** 裁剪后字符数 */
  trimmedLength: number;
}

/**
 * 根据预算裁剪上下文文本。
 *
 * 策略：
 * 1. 优先保留最近、最相关的尾部内容（用户当前章节正文）。
 * 2. 按段落边界截断，避免从句子中间断开。
 * 3. 头部被截断部分用省略占位符提示。
 * 4. 若文本本身在预算内，原样返回。
 *
 * @param contextText 原始上下文文本
 * @param budget 预算配置
 */
export function trimContextToBudget(
  contextText: string,
  budget: TokenBudget,
): TrimContextResult {
  const originalLength = contextText.length;
  const availableChars = budget.maxPromptChars - budget.reserveChars;

  if (originalLength <= availableChars) {
    return {
      text: contextText,
      wasTrimmed: false,
      originalLength,
      trimmedLength: originalLength,
    };
  }

  // 从尾部向前截取，优先保留最近内容
  let trimmed = contextText.slice(-availableChars);

  // 尝试在段落边界处截断，避免半截句子
  const paragraphBoundary = /[\n\r]{1,2}/;
  const firstBreakIndex = trimmed.search(paragraphBoundary);
  if (firstBreakIndex > 0 && firstBreakIndex < availableChars * 0.15) {
    // 如果开头附近能找到段落边界，从该边界后开始
    const match = trimmed.match(/[\n\r]{1,2}/);
    if (match && match.index !== undefined) {
      trimmed = trimmed.slice(match.index + match[0].length);
    }
  }

  const placeholder = '…（前文已裁剪，保留最近上下文）…\n\n';
  const finalText = placeholder + trimmed.trimStart();

  return {
    text: finalText,
    wasTrimmed: true,
    originalLength,
    trimmedLength: finalText.length,
  };
}

/**
 * 估算剩余可用 prompt 字符数。
 *
 * 用于 Context Assembler 在追加角色卡、世界观等辅助信息前做二次判断。
 */
export function availablePromptChars(budget: TokenBudget, usedChars: number): number {
  return Math.max(0, budget.maxPromptChars - budget.reserveChars - usedChars);
}
