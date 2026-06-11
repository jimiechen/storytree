import type { Component } from 'solid-js';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
}

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
  return `${count.toLocaleString()}`;
}

/** 单个项目卡片 */
export const ProjectCard: Component<ProjectCardProps> = (props) => {
  const p = props.project;
  const genreColors: Record<string, string> = {
    '奇幻': 'bg-purple-100 text-purple-700',
    '玄幻': 'bg-blue-100 text-blue-700',
    '古言': 'bg-pink-100 text-pink-700',
    '科幻': 'bg-cyan-100 text-cyan-700',
  };
  const genreClass = genreColors[p.genre] || 'bg-gray-100 text-gray-700';

  return (
    <div
      class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-purple-200 transition-all"
      onClick={() => props.onSelect(p.id)}
    >
      {/* 封面占位 */}
      <div class="h-32 bg-gradient-to-br from-purple-100 to-pink-50 flex items-center justify-center">
        <span class="text-4xl opacity-50">📖</span>
      </div>

      {/* 信息区 */}
      <div class="p-4 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-semibold text-gray-800 text-sm line-clamp-1">{p.name}</h3>
          <span class={`shrink-0 px-2 py-0.5 text-xs rounded-full ${genreClass}`}>
            {p.genre}
          </span>
        </div>

        <div class="flex items-center gap-3 text-xs text-gray-500">
          <span>共 {p.chapterCount} 章</span>
          <span>·</span>
          <span>{formatWordCount(p.totalWordCount)} 字</span>
        </div>

        <div class="text-xs text-gray-400">
          最后编辑：{formatTimeAgo(p.lastUpdated)}
        </div>
      </div>

      {/* 悬停操作层 */}
      <div class="hidden group-hover:flex items-center justify-end gap-2 px-4 pb-3">
        <button
          class="px-3 py-1 text-xs rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100"
          onClick={(e) => { e.stopPropagation(); props.onSelect(p.id); }}
        >
          编辑
        </button>
        <button
          class="px-3 py-1 text-xs rounded-md bg-red-50 text-red-500 hover:bg-red-100"
          onClick={(e) => e.stopPropagation()}
        >
          删除
        </button>
      </div>
    </div>
  );
};
