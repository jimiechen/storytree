/**
 * @file use-name-generator.ts
 * @description PAGE-14 名字生成器 Hook — localStorage 持久化 + 生成逻辑
 */

import { createSignal } from 'solid-js';
import type {
  GeneratorMode,
  GeneratedName,
  NameGender,
  NameStyle,
} from '../types/name-generator';
import { generateRandomName } from '../components/name-generator/name-bank';
import { useFeatureGates } from './use-feature-gates';

const STORAGE_KEY = 'novel:name-generator:history';
const MAX_HISTORY = 10;

const DEFAULT_CONFIG = {
  mode: 'random' as GeneratorMode,
  gender: 'male' as NameGender,
  style: 'minimal' as NameStyle,
  length: 3,
};

function loadHistory(): GeneratedName[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GeneratedName[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: GeneratedName[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function useNameGenerator() {
  const gates = useFeatureGates();
  const [mode, setMode] = createSignal<GeneratorMode>(DEFAULT_CONFIG.mode);
  const [gender, setGender] = createSignal<NameGender>(DEFAULT_CONFIG.gender);
  const [style, setStyle] = createSignal<NameStyle>(DEFAULT_CONFIG.style);
  const [length, setLength] = createSignal<number>(DEFAULT_CONFIG.length);
  const [result, setResult] = createSignal<string>('');
  const [history, setHistory] = createSignal<GeneratedName[]>(loadHistory());
  const [generating, setGenerating] = createSignal(false);
  const [notice, setNotice] = createSignal<string>('');

  /** AI 模式是否可用 */
  const aiAvailable = () => gates.realLLMEnabled && gates.targetLLMAdapterEnabled;

  /** 生成名字 */
  async function generate(): Promise<void> {
    setGenerating(true);
    setNotice('');

    try {
      const effectiveMode: GeneratorMode = mode() === 'ai' && !aiAvailable() ? 'random' : mode();
      if (mode() === 'ai' && !aiAvailable()) {
        setNotice('AI 模式未启用，已使用随机生成');
      }

      // PAGE-14: 随机生成为主，AI 模式作为占位（真实 LLM 调用待后续 phase）
      const text = generateRandomName(gender(), style(), length());
      setResult(text);

      const entry: GeneratedName = {
        text,
        config: {
          mode: effectiveMode,
          gender: gender(),
          style: style(),
          length: length(),
        },
        createdAt: new Date().toISOString(),
      };
      const next = [entry, ...history()].slice(0, MAX_HISTORY);
      setHistory(next);
      saveHistory(next);
    } finally {
      setGenerating(false);
    }
  }

  /** 复制到剪贴板 */
  async function copyResult(): Promise<boolean> {
    if (!result()) return false;
    try {
      await navigator.clipboard.writeText(result());
      return true;
    } catch {
      return false;
    }
  }

  /** 清空历史 */
  function clearHistory(): void {
    setHistory([]);
    saveHistory([]);
  }

  return {
    mode,
    setMode,
    gender,
    setGender,
    style,
    setStyle,
    length,
    setLength,
    result,
    history,
    generating,
    notice,
    aiAvailable,
    generate,
    copyResult,
    clearHistory,
  };
}
