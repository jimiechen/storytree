/**
 * @file llm/generation-result-validator.ts
 * @description 章节生成结果校验器 — P3-C
 *
 * P3-C 把真实 LLM 用于章节生成后，必须对输出做基础质量保护：
 * 空结果、过短、格式异常、前言后缀等都需要被识别并提示用户，
 * 避免用户直接采纳低质量内容覆盖正文。
 */

/**
 * 校验问题类型。
 */
export type GenerationIssueCode =
  | 'EMPTY_RESPONSE'
  | 'RESULT_TOO_SHORT'
  | 'FORMAT_ISSUE'
  | 'PREAMBLE_POSTAMBLE';

/**
 * 校验结果。
 */
export interface GenerationValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 清理后的文本 */
  text: string;
  /** 问题列表 */
  issues: GenerationIssue[];
  /** 字数 */
  wordCount: number;
}

export interface GenerationIssue {
  code: GenerationIssueCode;
  message: string;
}

/**
 * 校验选项。
 */
export interface GenerationValidationOptions {
  /** 绝对最小字数 */
  minWordCount?: number;
  /** 相对目标字数比例 */
  minRatioOfTarget?: number;
  /** 最大字数 */
  maxWordCount?: number;
}

/**
 * 默认绝对最小字数。
 */
const DEFAULT_MIN_WORD_COUNT = 100;

/**
 * 默认相对目标字数比例。
 */
const DEFAULT_MIN_RATIO = 0.5;

/**
 * 清理文本首尾空白与常见前言后缀。
 */
function cleanGeneratedText(text: string): string {
  return text
    .replace(/^\s+/, '')
    .replace(/\s+$/, '')
    .replace(/^(以下是|下面是|这是)(?:续写|生成|正文)?[：:]\s*/i, '')
    .replace(/\s*(结束|完)$/, '');
}

/**
 * 检测是否包含 Markdown 结构或列表。
 */
function hasFormatIssue(text: string): boolean {
  return /```|[\*\#\-\+]{1,2}\s+|\[.*?\]\(.*?\)|^\s*\d+\./m.test(text);
}

/**
 * 检测是否存在未清理掉的前言或后缀。
 */
function hasPreambleOrPostamble(text: string): boolean {
  const preamble = /^(以下是|下面是|这是)(?:续写|生成|正文)?[：:]/i;
  const postamble = /\s*(希望|以上)(对你)?(有|能)?(所)?(帮助|用)?[。！]?\s*$/i;
  return preamble.test(text) || postamble.test(text);
}

/**
 * 计算中文字数。
 *
 * 规则：中文字符 + 连续非空白西文单词各算 1 字。
 */
function countWords(text: string): number {
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (text.match(/[a-zA-Z0-9_]+/g) ?? []).length;
  return chinese + words;
}

/**
 * 校验章节生成结果。
 *
 * @param rawText 模型原始输出
 * @param targetWordCount 目标字数
 * @param options 校验选项
 */
export function validateGenerationResult(
  rawText: string,
  targetWordCount: number,
  options: GenerationValidationOptions = {},
): GenerationValidationResult {
  const hadPreambleOrPostamble = hasPreambleOrPostamble(rawText);
  const text = cleanGeneratedText(rawText);
  const wordCount = countWords(text);
  const issues: GenerationIssue[] = [];

  if (wordCount === 0) {
    issues.push({ code: 'EMPTY_RESPONSE', message: '生成结果为空，请重试。' });
  }

  const minWordCount = options.minWordCount ?? DEFAULT_MIN_WORD_COUNT;
  const minRatio = options.minRatioOfTarget ?? DEFAULT_MIN_RATIO;
  const effectiveMin = Math.max(minWordCount, Math.floor(targetWordCount * minRatio));

  if (wordCount > 0 && wordCount < effectiveMin) {
    issues.push({
      code: 'RESULT_TOO_SHORT',
      message: `生成结果过短（${wordCount} 字），低于目标字数 ${targetWordCount} 字的 ${Math.round(minRatio * 100)}%。`,
    });
  }

  if (options.maxWordCount !== undefined && wordCount > options.maxWordCount) {
    // 过长一般不是错误，只做提示，不标记为 invalid
    issues.push({
      code: 'RESULT_TOO_SHORT', // 复用类型占位，P3-D 可拆分
      message: `生成结果较长（${wordCount} 字），超过预期上限。`,
    });
  }

  if (hasFormatIssue(text)) {
    issues.push({
      code: 'FORMAT_ISSUE',
      message: '生成结果包含 Markdown 或列表格式，建议检查后再采纳。',
    });
  }

  if (hadPreambleOrPostamble) {
    issues.push({
      code: 'PREAMBLE_POSTAMBLE',
      message: '生成结果包含前言或后缀，建议清理后再采纳。',
    });
  }

  return {
    valid: issues.every((issue) => issue.code === 'RESULT_TOO_SHORT' && wordCount > effectiveMin) || issues.length === 0,
    text,
    issues,
    wordCount,
  };
}
