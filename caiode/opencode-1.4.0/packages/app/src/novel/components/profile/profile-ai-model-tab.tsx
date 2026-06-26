/**
 * @file profile-ai-model-tab.tsx
 * @description PAGE-11 AI 模型设置 Tab 组件
 *
 * 功能：
 * - 模型选择（DeepSeek Flash / DeepSeek Chat）
 * - API Key 输入（密码框，可切换显示）
 * - API 端点输入
 * - 生成温度滑块（0-1）
 * - 最大 Tokens 输入（256-8192）
 * - 保存设置 / 重置默认按钮
 * - 配置摘要（脱敏显示 API Key）
 */

import type { Component } from 'solid-js'
import { createSignal, Show } from 'solid-js'
import type { AIModelSettings } from '../../types/profile'
import { NovelIcon } from '../layout/novel-icon'

interface Props {
  settings: AIModelSettings
  onChange: (patch: Partial<AIModelSettings>) => void
  onSave: () => void
  onReset: () => void
  saving: boolean
  saved: boolean
}

const MODEL_OPTIONS = [
  { value: 'deepseek-flash', label: 'DeepSeek Flash', desc: '快速生成（草稿/大纲/摘要）' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat', desc: '精细改写/批评' },
]

/** 脱敏 API Key：仅显示后 4 位 */
function maskApiKey(key: string): string {
  if (!key) return '未设置'
  if (key.length <= 4) return '****'
  return `${'****'.repeat(3)}...${key.slice(-4)}`
}

export const ProfileAiModelTab: Component<Props> = (props) => {
  const [showApiKey, setShowApiKey] = createSignal(false)

  const handleSave = () => {
    props.onSave()
  }

  const handleReset = () => {
    setShowApiKey(false)
    props.onReset()
  }

  return (
    <div class="space-y-6">
      {/* 模型选择 */}
      <div>
        <label class="block text-sm font-medium text-[#494454] mb-2">模型选择</label>
        <select
          value={props.settings.modelProfileId}
          onChange={(e) => props.onChange({ modelProfileId: e.currentTarget.value })}
          class="w-full px-4 py-2.5 rounded-lg border border-[#cbc3d7] bg-white text-[#0d1c2f] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20 transition-colors"
        >
          {MODEL_OPTIONS.map((opt) => (
            <option value={opt.value}>{opt.label} — {opt.desc}</option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label class="block text-sm font-medium text-[#494454] mb-2">API Key</label>
        <div class="flex gap-2">
          <input
            type={showApiKey() ? 'text' : 'password'}
            value={props.settings.apiKey}
            onInput={(e) => props.onChange({ apiKey: e.currentTarget.value })}
            placeholder="sk-..."
            class="flex-1 px-4 py-2.5 rounded-lg border border-[#cbc3d7] bg-white text-[#0d1c2f] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey())}
            class="px-4 py-2.5 rounded-lg border border-[#cbc3d7] bg-white text-[#494454] hover:bg-[#eff4ff] hover:text-[#6b38d4] transition-colors text-sm whitespace-nowrap"
          >
            {showApiKey() ? '隐藏' : '显示'}
          </button>
        </div>
        <p class="mt-1 text-xs text-[#7b7486]">API Key 存储在浏览器 localStorage，不会上传到服务器</p>
      </div>

      {/* API 端点 */}
      <div>
        <label class="block text-sm font-medium text-[#494454] mb-2">API 端点</label>
        <input
          type="text"
          value={props.settings.baseURL}
          onInput={(e) => props.onChange({ baseURL: e.currentTarget.value })}
          placeholder="https://api.deepseek.com"
          class="w-full px-4 py-2.5 rounded-lg border border-[#cbc3d7] bg-white text-[#0d1c2f] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20 transition-colors"
        />
      </div>

      {/* 生成温度 */}
      <div>
        <div class="flex justify-between items-center mb-2">
          <label class="text-sm font-medium text-[#494454]">生成温度</label>
          <span class="text-sm font-bold text-[#6b38d4]">{props.settings.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={props.settings.temperature}
          onInput={(e) => props.onChange({ temperature: parseFloat(e.currentTarget.value) })}
          class="w-full accent-[#6b38d4]"
        />
        <div class="flex justify-between text-xs text-[#7b7486] mt-1">
          <span>稳定 (0)</span>
          <span>创意 (1)</span>
        </div>
      </div>

      {/* 最大 Tokens */}
      <div>
        <div class="flex justify-between items-center mb-2">
          <label class="text-sm font-medium text-[#494454]">最大 Tokens</label>
          <span class="text-sm font-bold text-[#6b38d4]">{props.settings.maxTokens}</span>
        </div>
        <input
          type="number"
          min="256"
          max="8192"
          step="256"
          value={props.settings.maxTokens}
          onInput={(e) => props.onChange({ maxTokens: parseInt(e.currentTarget.value) || 2048 })}
          class="w-full px-4 py-2.5 rounded-lg border border-[#cbc3d7] bg-white text-[#0d1c2f] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20 transition-colors"
        />
      </div>

      {/* 操作按钮 */}
      <div class="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={handleReset}
          class="px-4 py-2.5 rounded-lg border border-[#cbc3d7] bg-white text-[#494454] hover:bg-[#eff4ff] hover:text-[#6b38d4] transition-colors text-sm font-medium"
        >
          重置默认
        </button>
        <div class="flex items-center gap-3">
          <Show when={props.saved}>
            <span class="text-sm text-green-600 flex items-center gap-1">
              <NovelIcon name="check" size={16} />
              已保存
            </span>
          </Show>
          <button
            type="button"
            onClick={handleSave}
            disabled={props.saving}
            class="px-6 py-2.5 rounded-lg bg-[#6b38d4] text-white text-sm font-bold hover:bg-[#6d3bd7] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {props.saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {/* 配置摘要 */}
      <div class="mt-6 p-4 rounded-lg bg-[#f8f9ff] border border-[#cbc3d7]">
        <h3 class="text-sm font-bold text-[#494454] mb-3">当前配置</h3>
        <div class="space-y-1.5 text-sm text-[#494454]">
          <div class="flex justify-between">
            <span class="text-[#7b7486]">模型</span>
            <span class="font-medium">{MODEL_OPTIONS.find((o) => o.value === props.settings.modelProfileId)?.label ?? props.settings.modelProfileId}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#7b7486]">API Key</span>
            <span class="font-mono text-xs">{maskApiKey(props.settings.apiKey)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#7b7486]">端点</span>
            <span class="font-mono text-xs">{props.settings.baseURL}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#7b7486]">温度 / 最大 Tokens</span>
            <span class="font-medium">{props.settings.temperature.toFixed(1)} / {props.settings.maxTokens}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
