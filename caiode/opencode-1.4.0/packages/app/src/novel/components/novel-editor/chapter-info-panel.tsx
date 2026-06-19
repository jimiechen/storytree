import { createSignal, Show } from 'solid-js';
import type { Chapter, ChapterStatus, ChapterInformationState, ChapterExtractedInfo } from '../../types';
import { NovelIcon } from '../layout/novel-icon';

interface ChapterInfoPanelProps {
  chapter: Chapter;
  /** Info-Lite 信息审计状态（AI 操作后由外部注入） */
  informationState?: ChapterInformationState;
  onReExtract?: () => void;
}

const STATUS_MAP: Record<ChapterStatus, { label: string; bg: string; text: string }> = {
  draft: { label: '草稿', bg: 'bg-[#fff8e1]', text: 'text-[#8c6d1f]' },
  revising: { label: '修订中', bg: 'bg-[#e8f0fe]', text: 'text-[#1967d2]' },
  completed: { label: '已完成', bg: 'bg-[#e6f4ea]', text: 'text-[#137333]' },
  published: { label: '已发布', bg: 'bg-green-50', text: 'text-green-700' },
};

/** AI 提取信息 Mock（仅当 chapter.extractedInfo 不存在时兜底显示） */
const MOCK_EXTRACTED: ChapterExtractedInfo = {
  summary: '主角参加门派比武大会，在决赛中与宿敌交锋，最终凭借惊人的悟性领悟了剑意...',
  characters: ['李云轩 (主角)', '林清风 (对手)', '执事长老', '赵雷'],
  worldItems: ['霜寒剑 (林清风)', '普通铁剑 (李云轩)'],
  keyEvents: '主角获胜，获得进入秘境资格',
  protagonistState: '位置：比武场，情绪：紧张、坚定，实力：金丹期',
};

export function ChapterInfoPanel(props: ChapterInfoPanelProps) {
  const [reExtracting, setReExtracting] = createSignal(false);
  const [auditExpanded, setAuditExpanded] = createSignal(false);
  const ch = () => props.chapter;
  const status = () => STATUS_MAP[ch().status];
  const infoState = () => props.informationState ?? ch().informationState;
  const extracted = () => ch().extractedInfo ?? MOCK_EXTRACTED;
  const protagonistStateItems = () => {
    const state = extracted().protagonistState;
    if (!state) return [];
    // 支持字符串或数组格式
    if (Array.isArray(state)) return state as { label: string; value: string }[];
    return state.split(/[,，、]/).map((s) => {
      const [label, value] = s.split(/[:：]/);
      return { label: label?.trim() || '状态', value: value?.trim() || s.trim() };
    });
  };

  const handleReExtract = async () => {
    setReExtracting(true);
    await props.onReExtract?.();
    setTimeout(() => setReExtracting(false), 1200);
  };

  const fmtDate = (d?: Date) => {
    if (!d) return '—';
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <aside class="w-[280px] bg-white border-l border-[#cbc3d7] flex flex-col shrink-0 h-full">
      {/* Panel Header */}
      <div class="px-4 py-2 border-b border-[#cbc3d7] flex items-center justify-between shrink-0">
        <h2 class="text-sm font-semibold text-[#0d1c2f]">章节属性</h2>
        <button class="w-8 h-8 flex items-center justify-center rounded-full text-[#494454] hover:bg-[#eff4ff] transition-colors">
          <NovelIcon name="more_horiz" size={18} />
        </button>
      </div>

      {/* Panel Content */}
      <div class="flex-1 overflow-y-auto p-4">
        {/* Chapter Info Section */}
        <div class="mb-6">
          <h3 class="text-xs text-[#7b7486] uppercase tracking-wider mb-2 flex items-center font-medium">
            <NovelIcon name="info" size={14} class="mr-1" />
            章节信息
          </h3>
          <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-[#7b7486]">状态</span>
              <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status().bg} ${status().text}`}>
                {status().label}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-[#7b7486]">创建时间</span>
              <span class="text-xs text-[#0d1c2f]">{fmtDate(ch().lastEditedAt)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-[#7b7486]">修改时间</span>
              <span class="text-xs text-[#0d1c2f]">{fmtDate(ch().lastEditedAt)}</span>
            </div>
          </div>
        </div>

        {/* AI Extracted Info Section */}
        <div class="mb-4">
          <h3 class="text-xs text-[#6b38d4] uppercase tracking-wider mb-2 flex items-center font-semibold">
            <NovelIcon name="memory" size={14} class="mr-1" />
            AI提取信息
          </h3>
          <div class="space-y-2">
            {/* Summary */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-1">章节摘要</span>
              <p class="text-xs text-[#0d1c2f] leading-relaxed">{extracted().summary}</p>
            </div>

            {/* Characters */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-2">登场角色</span>
              <div class="flex flex-wrap gap-1.5">
                {extracted().characters.map((name) => (
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium border bg-[#e8f0fe]/50 text-[#0058be] border-[#adc6ff]/40">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Protagonist State */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-2">主角当前状态</span>
              <ul class="text-xs text-[#0d1c2f] space-y-1">
                {protagonistStateItems().map((s) => (
                  <li class="flex items-start">
                    <span class="w-[40px] text-[#7b7486] shrink-0">{s.label}:</span>
                    <span>{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Items */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-1">涉及道具</span>
              <p class="text-xs text-[#0d1c2f]">{extracted().worldItems.join('、') || '—'}</p>
            </div>

            {/* Prediction */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-1">重要事件预测</span>
              <p class="text-xs text-[#0d1c2f]">{extracted().keyEvents || '—'}</p>
            </div>
          </div>
        </div>

        {/* ── Info-Lite 信息审计块（P1-A 新增） ── */}
        <Show when={infoState()}>
          {(state) => (
            <div class="border border-[#e0d4f0] rounded-lg overflow-hidden">
              {/* 审计块头部（可折叠） */}
              <button
                onClick={() => setAuditExpanded(!auditExpanded())}
                class="w-full flex items-center justify-between px-3 py-2 bg-[#f3efff] hover:bg-[#ebe0fa] transition-colors"
              >
                <h3 class="text-xs text-[#6b38d4] uppercase tracking-wider flex items-center font-semibold">
                  <NovelIcon name="assessment" size={14} class="mr-1" />
                  信息审计
                  <span class="ml-1.5 text-[10px] font-normal text-[#9b73d8] bg-white/60 px-1.5 py-0.5 rounded">
                    {state().newAtoms.length} 原子 / {state().newLinks.length} 链接
                  </span>
                </h3>
                <NovelIcon
                  name={auditExpanded() ? 'expand_less' : 'expand_more'}
                  size={16}
                  class="text-[#6b38d4]"
                />
              </button>

              {/* 审计指标详情（展开时显示） */}
              <Show when={auditExpanded()}>
                <div class="px-3 py-2.5 space-y-2 bg-white">
                  {/* 第 1 行：节拍 + 熵变化 */}
                  <div class="grid grid-cols-2 gap-2">
                    <div class="bg-[#f8f9ff] rounded border border-[#e8e0f0] p-2">
                      <span class="text-[10px] text-[#7b7486] block">STC 节拍</span>
                      <span class="text-xs font-medium text-[#0d1c2f]">{state().beatName || '—'}</span>
                    </div>
                    <div class="bg-[#f8f9ff] rounded border border-[#e8e0f0] p-2">
                      <span class="text-[10px] text-[#7b7486] block">熵变化 ΔH</span>
                      <span class="text-xs font-medium text-[#0d1c2f]">
                        {state().entropyDelta > 0 ? '+' : ''}{state().entropyDelta.toFixed(2)} bit
                      </span>
                    </div>
                  </div>

                  {/* 第 2 行：熵值前后对比 */}
                  <div class="grid grid-cols-2 gap-2">
                    <div class="bg-[#f8f9ff] rounded border border-[#e8e0f0] p-2">
                      <span class="text-[10px] text-[#7b7486] block">操作前熵 H₀</span>
                      <span class="text-xs font-medium text-[#0d1c2f]">{state().entropyBefore.toFixed(2)} bit</span>
                    </div>
                    <div class="bg-[#f8f9ff] rounded border border-[#e8e0f0] p-2">
                      <span class="text-[10px] text-[#7b7486] block">操作后熵 H₁</span>
                      <span class="text-xs font-medium text-[#0d1c2f]">{state().entropyAfter.toFixed(2)} bit</span>
                    </div>
                  </div>

                  {/* 第 3 行：自信息量 + 审计评分 */}
                  <div class="grid grid-cols-2 gap-2">
                    <div class="bg-[#f8f9ff] rounded border border-[#e8e0f0] p-2">
                      <span class="text-[10px] text-[#7b7486] block">自信息量 I(x)</span>
                      <span class="text-xs font-medium text-[#0d1c2f]">{state().selfInformationScore.toFixed(1)} bit</span>
                    </div>
                    <div class="bg-[#f8f9ff] rounded border border-[#e8e0f0] p-2">
                      <span class="text-[10px] text-[#7b7486] block">审计评分</span>
                      <span class="text-xs font-medium text-[#137333]">
                        {state().auditScore !== undefined ? `${state().auditScore!.toFixed(0)}/100` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* 信息原子列表（折叠摘要） */}
                  <Show when={state().newAtoms.length > 0}>
                    <div class="border-t border-[#e8e0f0] pt-2 mt-1">
                      <span class="text-[10px] text-[#7b7486] block mb-1">新增原子</span>
                      <div class="flex flex-wrap gap-1">
                        {state().newAtoms.slice(0, 6).map((atom) => (
                          <span
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                            classList={{
                              'bg-blue-50 text-blue-700 border-blue-200': atom.visibility === 'public',
                              'bg-gray-50 text-gray-600 border-gray-200': atom.visibility === 'author-only',
                              'bg-red-50 text-red-600 border-red-200': atom.type === 'mystery' || atom.type === 'foreshadow',
                            }}
                            title={`${atom.type}: ${atom.description}`}
                          >
                            {atom.title}
                          </span>
                        ))}
                        {state().newAtoms.length > 6 && (
                          <span class="text-[10px] text-[#7b7486] px-1">+{state().newAtoms.length - 6} 更多</span>
                        )}
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          )}
        </Show>
      </div>

      {/* Panel Footer */}
      <div class="p-4 border-t border-[#cbc3d7] bg-white shrink-0">
        <button
          onClick={handleReExtract}
          disabled={reExtracting()}
          class="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[#6b38d4] bg-white hover:bg-[#e9ddff] transition-colors text-sm font-medium border border-[#6b38d4] disabled:opacity-60"
        >
          <NovelIcon name="sync" size={16} class={reExtracting() ? 'animate-spin' : ''} />
          重新提取信息
        </button>
      </div>
    </aside>
  );
}
