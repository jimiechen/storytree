import { createSignal, Show } from 'solid-js';
import type { Chapter, ChapterStatus } from '../../types';
import { NovelIcon } from '../layout/novel-icon';

interface ChapterInfoPanelProps {
  chapter: Chapter;
  onReExtract?: () => void;
}

const STATUS_MAP: Record<ChapterStatus, { label: string; bg: string; text: string }> = {
  draft: { label: '草稿', bg: 'bg-[#fff8e1]', text: 'text-[#8c6d1f]' },
  revising: { label: '修订中', bg: 'bg-[#e8f0fe]', text: 'text-[#1967d2]' },
  completed: { label: '已完成', bg: 'bg-[#e6f4ea]', text: 'text-[#137333]' },
  published: { label: '已发布', bg: 'bg-green-50', text: 'text-green-700' },
};

/** AI 提取信息 Mock（Phase 2.2 接入真实 Provider） */
const MOCK_EXTRACTED = {
  summary: '主角参加门派比武大会，在决赛中与宿敌交锋，最终凭借惊人的悟性领悟了剑意...',
  characters: [
    { name: '李云轩 (主角)', style: 'bg-[#e8f0fe]/50 text-[#0058be] border-[#adc6ff]/40' },
    { name: '林清风 (对手)', style: 'bg-[#ffdad6]/40 text-[#ba1a1a] border-[#ffdad6]/50' },
    { name: '执事长老', style: 'bg-[#d5e3fd]/50 text-[#494454] border-[#cbc3d7]/40' },
    { name: '赵雷', style: 'bg-[#d5e3fd]/50 text-[#494454] border-[#cbc3d7]/40' },
  ],
  protagonistState: [
    { label: '位置', value: '比武场' },
    { label: '情绪', value: '紧张、坚定' },
    { label: '实力', value: '金丹期' },
  ],
  items: '霜寒剑 (林清风)、普通铁剑 (李云轩)',
  prediction: '主角获胜，获得进入秘境资格',
};

export function ChapterInfoPanel(props: ChapterInfoPanelProps) {
  const [reExtracting, setReExtracting] = createSignal(false);
  const ch = () => props.chapter;
  const status = () => STATUS_MAP[ch().status];

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
        <div>
          <h3 class="text-xs text-[#6b38d4] uppercase tracking-wider mb-2 flex items-center font-semibold">
            <NovelIcon name="memory" size={14} class="mr-1" />
            AI提取信息
          </h3>
          <div class="space-y-2">
            {/* Summary */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-1">章节摘要</span>
              <p class="text-xs text-[#0d1c2f] leading-relaxed">{MOCK_EXTRACTED.summary}</p>
            </div>

            {/* Characters */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-2">登场角色</span>
              <div class="flex flex-wrap gap-1.5">
                {MOCK_EXTRACTED.characters.map((c) => (
                  <span class={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${c.style}`}>
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Protagonist State */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-2">主角当前状态</span>
              <ul class="text-xs text-[#0d1c2f] space-y-1">
                {MOCK_EXTRACTED.protagonistState.map((s) => (
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
              <p class="text-xs text-[#0d1c2f]">{MOCK_EXTRACTED.items}</p>
            </div>

            {/* Prediction */}
            <div class="bg-[#f8f9ff] rounded-lg border border-[#cbc3d7] p-3">
              <span class="text-xs text-[#7b7486] block mb-1">重要事件预测</span>
              <p class="text-xs text-[#0d1c2f]">{MOCK_EXTRACTED.prediction}</p>
            </div>
          </div>
        </div>
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
