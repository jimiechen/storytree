import type { Component } from 'solid-js';
import { Show, createSignal } from 'solid-js';
import type { Project } from '../../types';
import { NovelIcon } from '../layout/novel-icon';

interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  /** 该卡片是否处于删除中 */
  isDeleting: boolean;
}

/** 类型 → 渐变 + 标签颜色映射 */
const GENRE_STYLE: Record<string, { from: string; to: string; text: string; border: string; bg: string }> = {
  玄幻: { from: '#6b38d4', to: '#8455ef', text: '#6b38d4', border: '#6b38d4', bg: 'rgba(107,56,212,0.1)' },
  奇幻: { from: '#0058be', to: '#2170e4', text: '#0058be', border: '#0058be', bg: 'rgba(0,88,190,0.1)' },
  仙侠: { from: '#059669', to: '#34d399', text: '#059669', border: '#059669', bg: 'rgba(5,150,105,0.1)' },
  科幻: { from: '#7c3aed', to: '#a78bfa', text: '#7c3aed', border: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  古言: { from: '#be185d', to: '#f472b6', text: '#be185d', border: '#be185d', bg: 'rgba(190,24,93,0.1)' },
  都市: { from: '#0369a1', to: '#38bdf8', text: '#0369a1', border: '#0369a1', bg: 'rgba(3,105,161,0.1)' },
  悬疑: { from: '#4338ca', to: '#818cf8', text: '#4338ca', border: '#4338ca', bg: 'rgba(67,56,202,0.1)' },
  穿越: { from: '#c2410c', to: '#fb923c', text: '#c2410c', border: '#c2410c', bg: 'rgba(194,65,12,0.1)' },
};
const DEFAULT_STYLE = GENRE_STYLE['玄幻'];

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

function formatWordCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return count.toLocaleString();
}

/**
 * 项目卡片 — Stitch 02 风格
 *
 * 含封面渐变 + 首字 + 类型标签 + 章数/字数 + 时间 + 悬停操作层（编辑/删除）
 * 删除按钮触发二次确认弹层（由父组件渲染统一 Modal）
 */
export const ProjectCard: Component<ProjectCardProps> = (props) => {
  const p = props.project;
  const c = () => GENRE_STYLE[p.genre] ?? DEFAULT_STYLE;
  const [hovered, setHovered] = createSignal(false);

  return (
    <div
      data-testid="bookshelf-project-card"
      class="bg-white rounded-xl border border-[#cbc3d7] shadow-sm hover:shadow-[0_8px_24px_rgba(107,56,212,0.12)] hover:border-[#e9ddff] transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={() => props.onSelect(p.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div class="flex gap-4 p-4">
        {/* 封面 */}
        <div
          class="w-24 h-32 rounded-lg shadow-inner shrink-0 flex items-center justify-center relative overflow-hidden"
          style={{ background: `linear-gradient(to bottom right, ${c().from}, ${c().to})` }}
        >
          <div class="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-white opacity-10" />
          <span class="text-white font-bold text-3xl opacity-90 select-none">{p.name.charAt(0)}</span>
        </div>

        {/* 信息区 */}
        <div class="flex flex-col flex-1 py-1 min-w-0">
          <div class="flex justify-between items-start gap-2 mb-1">
            <h3
              class="text-base font-bold text-[#0d1c2f] group-hover:text-[#6b38d4] transition-colors truncate"
              title={p.name}
              style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
            >
              {p.name}
            </h3>
            <span
              class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border whitespace-nowrap"
              style={{ color: c().text, 'border-color': c().border, background: c().bg }}
            >
              {p.genre}
            </span>
          </div>

          <p class="text-xs text-[#494454] mb-auto flex items-center gap-1">
            <NovelIcon name="menu_book" size={14} />
            共 {p.chapterCount} 章
          </p>

          <div class="flex items-center justify-between mt-3 pt-3 border-t border-[#eff4ff]">
            <div class="text-xs text-[#494454] flex items-center gap-1">
              <NovelIcon name="text_snippet" size={14} />
              {formatWordCount(p.totalWordCount)} 字
            </div>
            <div class="text-xs text-[#7b7486] flex items-center gap-1">
              <NovelIcon name="history" size={12} />
              {formatTimeAgo(p.lastUpdated)}
            </div>
          </div>
        </div>
      </div>

      {/* 悬停操作层 */}
      <Show when={hovered() || props.isDeleting}>
        <div class="flex items-center justify-end gap-2 px-4 pb-3 pt-0 border-t border-[#eff4ff] bg-[#fafbff]">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-md bg-[#eff4ff] text-[#6b38d4] hover:bg-[#e9ddff] transition-colors"
            onClick={(e) => { e.stopPropagation(); props.onSelect(p.id); }}
          >
            打开
          </button>
          <button
            type="button"
            disabled={props.isDeleting}
            class="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-[#ba1a1a] hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => { e.stopPropagation(); props.onDelete(p.id); }}
          >
            <Show when={!props.isDeleting} fallback="删除中…">删除</Show>
          </button>
        </div>
      </Show>
    </div>
  );
}
