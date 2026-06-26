/**
 * @file use-ai-model-settings.ts
 * @description PAGE-11 AI 模型设置 Hook — localStorage 持久化
 *
 * 行为：
 * - 初始化时从 localStorage 读取（无则用默认值）
 * - updateSettings 更新内存信号
 * - saveSettings 写入 localStorage，设置 saved=true，2 秒后清除
 * - resetSettings 恢复默认值并写入 localStorage
 */

import { createSignal } from 'solid-js'
import type { AIModelSettings } from '../types/profile'

const STORAGE_KEY = 'novel:ai-model-settings'

const DEFAULT_AI_MODEL_SETTINGS: AIModelSettings = {
  modelProfileId: 'deepseek-flash',
  apiKey: '',
  baseURL: 'https://api.deepseek.com',
  temperature: 0.7,
  maxTokens: 2048,
  updatedAt: new Date().toISOString(),
}

function loadSettings(): AIModelSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_AI_MODEL_SETTINGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_AI_MODEL_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AIModelSettings>
    return { ...DEFAULT_AI_MODEL_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_AI_MODEL_SETTINGS }
  }
}

function persistSettings(settings: AIModelSettings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function useAiModelSettings() {
  const [settings, setSettings] = createSignal<AIModelSettings>(loadSettings())
  const [saving, setSaving] = createSignal(false)
  const [saved, setSaved] = createSignal(false)

  let savedTimer: ReturnType<typeof setTimeout> | undefined

  const updateSettings = (patch: Partial<AIModelSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const saveSettings = async () => {
    setSaving(true)
    const toSave = { ...settings(), updatedAt: new Date().toISOString() }
    persistSettings(toSave)
    setSettings(toSave)
    setSaving(false)
    setSaved(true)
    if (savedTimer) clearTimeout(savedTimer)
    savedTimer = setTimeout(() => setSaved(false), 2000)
  }

  const resetSettings = () => {
    const reset = { ...DEFAULT_AI_MODEL_SETTINGS, updatedAt: new Date().toISOString() }
    persistSettings(reset)
    setSettings(reset)
    setSaved(false)
  }

  return {
    settings,
    updateSettings,
    saveSettings,
    resetSettings,
    saving,
    saved,
  }
}
