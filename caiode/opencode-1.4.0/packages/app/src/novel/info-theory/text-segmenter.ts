/**
 * @file info-theory/text-segmenter.ts
 * @description 将中文文本切分为句子 / 片段 — P2-C
 */

export function splitTextIntoSegments(text: string): string[] {
  if (!text) return [];

  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const raw = normalized.split(/([。！？；\n]+)/);
  const segments: string[] = [];
  let buffer = '';

  for (const part of raw) {
    if (/^[。！？；\n]+$/.test(part)) {
      buffer += part;
      const trimmed = buffer.trim();
      if (trimmed) segments.push(trimmed);
      buffer = '';
    } else {
      buffer += part;
    }
  }

  const last = buffer.trim();
  if (last) segments.push(last);

  return segments.filter((s) => s.length > 0);
}
