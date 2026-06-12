import type { Component } from 'solid-js';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
}

/** 首字映射 — 用于封面大字显示 */
function getInitial(name: string): string {
  return name.charAt(0);
}

/** 封面渐变映射 — 按类型分配不同渐变 */
const genreGradients: Record<string, string> = {
  '奇幻': 'linear-gradient(135deg, #6b38d4, #a855f7)',
  '玄幻': 'linear-gradient(135deg, #3b82f6, #6366f1)',
  '古言': 'linear-gradient(135deg, #ec4899, #f472b6)',
  '科幻': 'linear-gradient(135deg, #06b6d4, #22d3ee)',
  '都市': 'linear-gradient(135deg, #f97316, #fb923c)',
  '穿越': 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  '仙侠': 'linear-gradient(135deg, #10b981, #34d399)',
  '悬疑': 'linear-gradient(135deg, #475569, #64748b)',
};
const defaultGradient = 'linear-gradient(135deg, #6b38d4, #8455ef)';

/** 类型标签颜色 */
const genreTagStyles: Record<string, string> = {
  '奇幻': 'bg-[#e9ddff] text-[#6b38d4]',
  '玄幻': 'bg-[#dbeafe] text-[#2563eb]',
  '古言': 'bg-[#fce7f3] text-[#be185d]',
  '科幻': 'bg-[#cffafe] text-[#0e7490]',
  '都市': 'bg-[#ffedd5] text-[#c2410c]',
  '穿越': 'bg-[#ede9fe] text-[#7c3aed]',
  '仙侠': 'bg-[#d1fae5] text-[#059669]',
  '悬疑': 'bg-[#f1f5f9] text-[#334155]',
};

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
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
 * 项目卡片 — Stitch 原型 02 风格
 *
 * 视觉特征:
 * - 渐变封面区(128px高) + 大字首字母(48px白色半透明)
 * - 信息区: 书名(16px semibold) + 类型标签(pill) + 章节/字数行 + 时间行
 * - 悬停: 阴影加深 + 边框变紫 + 底部操作按钮浮现
 */
export const ProjectCard: Component<ProjectCardProps> = (props) => {
  const p = props.project;
  const initial = getInitial(p.name);
  const gradient = genreGradients[p.genre] || defaultGradient;
  const tagStyle = genreTagStyles[p.genre] || 'bg-gray-100 text-gray-700';

  return (
    <div
      class="group bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-[0_8px_24px_rgba(107,56,212,0.12)] border border-transparent hover:border-[#e9ddff]"
      data-testid="bookshelf-project-card"
      onClick={() => props.onSelect(p.id)}
    >
      {/* 封面区域 — 渐变背景 + 大字首字母 */}
      <div
        class="h-32 flex items-center justify-center relative overflow-hidden"
        style={{ background: gradient }}
      >
        {/* 装饰性背景圆 */}
        <div class="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-white opacity-8" />
        <div class="absolute bottom-[-15px] left-[-15px] w-24 h-24 rounded-full bg-white opacity-5" />
        {/* 大字首字母 */}
        <span
          class="text-[48px] font-bold leading-none text-white opacity-90"
          style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
        >
          {initial}
        </span>
      </div>

      {/* 信息区域 */}
      <div class="p-4 space-y-2.5">
        {/* 书名 + 类型标签 */}
        <div class="flex items-start justify-between gap-2">
          <h3
            class="font-semibold text-sm leading-tight line-clamp-2 text-[#0d1c2f]"
            style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
          >
            {p.name}
          </h3>
          <span class={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${tagStyle}`}>
            {p.genre}
          </span>
        </div>

        {/* 统计信息行 */}
        <div
          class="flex items-center gap-2.5 text-xs text-[#7b7486]"
          style={{ 'font-family': "'Work Sans', sans-serif" }}
        >
          <span>共{p.chapterCount}章</span>
          <span class="w-px h-3 bg-[#cbc3d7]" />
          <span>{formatWordCount(p.totalWordCount)}字</span>
        </div>

        {/* 最后编辑时间 */}
        <div
          class="text-xs text-[#999]"
          style={{ 'font-family': "'Work Sans', sans-serif" }}
        >
          最后编辑：{formatTimeAgo(p.lastUpdated)}
        </div>
      </div>

      {/* 悬停操作层 */}
      <div class="hidden group-hover:flex items-center justify-end gap-2 px-4 pb-3 pt-0 border-t border-[#eff4ff]">
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-[#eff4ff] text-[#6b38d4] hover:bg-[#e9ddff] transition-colors duration-150"
          onClick={(e) => { e.stopPropagation(); props.onSelect(p.id); }}
        >
          编辑
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-[#ba1a1a] hover:bg-red-100 transition-colors duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          删除
        </button>
      </div>
    </div>
  );
};
