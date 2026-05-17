import type { PromptParseResult } from './types';

/**
 * Mock Prompt Parser - 解析用户输入生成 3D 场景参数
 * 基于关键词匹配，不接真实 LLM
 */

export function parsePrompt(prompt: string): PromptParseResult {
  const result: PromptParseResult = {
    rows: 5,
    cols: 4,
    spacingX: 2.2,
    spacingZ: 2.2,
    baseRadius: 0.45,
    baseHeight: 1.8,
    centerHeroCylinder: true,
    cameraPreset: 'godotPerspective',
    fov: 60
  };

  const lowerPrompt = prompt.toLowerCase();

  // 解析行列数 (如 5x4, 3行4列)
  const gridMatch = prompt.match(/(\d+)\s*[x×]\s*(\d+)/) ||
                    prompt.match(/(\d+)\s*行\s*(\d+)\s*列/);
  if (gridMatch) {
    result.rows = parseInt(gridMatch[1], 10);
    result.cols = parseInt(gridMatch[2], 10);
  }

  // 解析间距
  const spacingMatch = prompt.match(/间距\s*(\d+\.?\d*)/);
  if (spacingMatch) {
    result.spacingX = parseFloat(spacingMatch[1]);
    result.spacingZ = parseFloat(spacingMatch[1]);
  }

  // 解析半径
  const radiusMatch = prompt.match(/半径\s*(\d+\.?\d*)/);
  if (radiusMatch) {
    result.baseRadius = parseFloat(radiusMatch[1]);
  }

  // 解析高度
  const heightMatch = prompt.match(/高度\s*(\d+\.?\d*)/);
  if (heightMatch) {
    result.baseHeight = parseFloat(heightMatch[1]);
  }

  // 低机位
  if (lowerPrompt.includes('低机位') || lowerPrompt.includes('低角度')) {
    result.cameraPreset = 'lowAngleLeft';
    result.fov = 70;
  }

  // 广角
  if (lowerPrompt.includes('广角')) {
    result.fov = Math.max(result.fov, 65);
  }

  // 左前方
  if (lowerPrompt.includes('左前方') || lowerPrompt.includes('左前')) {
    result.cameraPreset = 'lowAngleLeft';
  }

  // 右前方
  if (lowerPrompt.includes('右前方') || lowerPrompt.includes('右前')) {
    result.cameraPreset = 'frontWide';
  }

  // 俯视
  if (lowerPrompt.includes('俯视') || lowerPrompt.includes('顶视')) {
    result.cameraPreset = 'topDown';
  }

  // 正面
  if (lowerPrompt.includes('正面')) {
    result.cameraPreset = 'frontWide';
  }

  // 中心更高
  if (lowerPrompt.includes('中心更高') || lowerPrompt.includes('中心高')) {
    result.centerHeroCylinder = true;
  }

  // 发光
  if (lowerPrompt.includes('发光') || lowerPrompt.includes('glow')) {
    result.centerHeroCylinder = true;
  }

  return result;
}
