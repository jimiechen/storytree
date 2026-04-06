'use client';

import { useState } from 'react';

interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const activities = [
  { id: 'outline', icon: 'menu_book', title: '大纲' },
  { id: 'branches', icon: 'account_tree', title: '分支' },
  { id: 'knowledge', icon: 'library_books', title: '知识库' },
  { id: 'ai', icon: 'smart_toy', title: 'AI助手' },
  { id: 'stats', icon: 'bar_chart', title: '统计' },
];

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <aside className="w-[48px] bg-surface-container-lowest border-r border-outline-variant/10 flex flex-col items-center py-4 z-40 flex-shrink-0">
      {/* Logo */}
      <div className="text-xl font-bold text-[#75d1ff] mb-8 font-headline cursor-pointer hover:scale-110 transition-transform">
        织
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-6 items-center flex-1 w-full">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => onViewChange(activity.id)}
            className={`relative group transition-all ${
              activeView === activity.id
                ? 'text-[#75d1ff] before:content-[""] before:absolute before:left-0 before:w-[2px] before:h-6 before:bg-[#75d1ff] before:shadow-[0_0_8px_#75d1ff]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={activity.title}
          >
            <span className="material-symbols-outlined text-[20px]">{activity.icon}</span>
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="flex flex-col gap-6 items-center pb-4">
        <button
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="设置"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </aside>
  );
}
