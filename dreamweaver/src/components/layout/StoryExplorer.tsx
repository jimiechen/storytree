'use client';

import { useState } from 'react';

interface Chapter {
  id: string;
  title: string;
  order: number;
  status: 'draft' | 'writing' | 'completed' | 'published';
  wordCount?: number;
}

interface Volume {
  id: string;
  name: string;
  chapters: Chapter[];
}

interface StoryExplorerProps {
  volumes: Volume[];
  activeChapterId: string;
  onChapterSelect: (chapterId: string) => void;
  onAddChapter: () => void;
}

const statusConfig = {
  draft: { label: '草稿', color: 'bg-surface-variant text-on-surface-variant', icon: 'circle' },
  writing: { label: '写作中', color: 'bg-primary-container text-primary', icon: 'edit' },
  completed: { label: '定稿', color: 'bg-tertiary-container text-tertiary', icon: 'check_circle' },
  published: { label: '已发布', color: 'bg-secondary-container/20 text-secondary', icon: 'publish' },
};

export function StoryExplorer({
  volumes,
  activeChapterId,
  onChapterSelect,
  onAddChapter,
}: StoryExplorerProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<string[]>(volumes.map(v => v.id));

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes((prev) =>
      prev.includes(volumeId)
        ? prev.filter((id) => id !== volumeId)
        : [...prev, volumeId]
    );
  };

  const getVolumeColor = (index: number) => {
    const colors = ['border-primary', 'border-secondary/50', 'border-tertiary/50'];
    return colors[index % colors.length];
  };

  const getVolumeIconColor = (index: number) => {
    const colors = ['text-primary', 'text-secondary', 'text-tertiary'];
    return colors[index % colors.length];
  };

  return (
    <section className="w-[260px] bg-surface-container flex flex-col shrink-0 h-full">
      {/* Header */}
      <header className="p-6 pb-2">
        <h2 className="text-[11px] uppercase tracking-widest text-primary font-bold">
          Story Explorer
        </h2>
      </header>

      {/* Volume & Chapter List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {volumes.map((volume, volumeIndex) => (
          <div key={volume.id} className="group">
            {/* Volume Header */}
            <div
              onClick={() => toggleVolume(volume.id)}
              className={`flex items-center gap-3 py-3 px-4 bg-surface-container-high border-l-4 ${getVolumeColor(volumeIndex)} rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors`}
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">
                {expandedVolumes.includes(volume.id) ? 'expand_more' : 'chevron_right'}
              </span>
              <span className={`material-symbols-outlined text-[16px] ${getVolumeIconColor(volumeIndex)}`}>
                book
              </span>
              <h3 className="font-serif text-sm font-bold flex-1 truncate">{volume.name}</h3>
              <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
                {volume.chapters.length} Chapters
              </span>
            </div>

            {/* Chapters */}
            {expandedVolumes.includes(volume.id) && (
              <div className="mt-2 ml-4 space-y-1">
                {volume.chapters.map((chapter) => {
                  const status = statusConfig[chapter.status] || statusConfig.draft;
                  const isActive = activeChapterId === chapter.id;

                  return (
                    <div
                      key={chapter.id}
                      onClick={() => onChapterSelect(chapter.id)}
                      className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer group/item transition-all ${
                        isActive
                          ? 'bg-primary/5 border border-primary/20'
                          : chapter.status === 'draft'
                          ? 'opacity-50 hover:opacity-100 hover:bg-surface-container-high'
                          : 'hover:bg-surface-container-high'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] transition-opacity ${
                          isActive ? 'text-primary opacity-100' : 'text-on-surface-variant/20 opacity-0 group-hover/item:opacity-100'
                        }`}
                      >
                        {isActive ? 'drag_indicator' : 'description'}
                      </span>
                      <span
                        className={`font-serif text-sm flex-1 truncate ${
                          isActive ? 'text-primary font-bold' : 'text-on-surface'
                        }`}
                      >
                        {chapter.title}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] font-label text-on-surface-variant/60 w-12 text-right">
                        {chapter.wordCount ? `${(chapter.wordCount / 1000).toFixed(1)}k` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {volumes.length === 0 && (
          <div className="text-center py-8 text-on-surface-variant">
            <p className="text-sm">暂无卷章</p>
            <p className="text-[10px] mt-1">点击下方按钮创建</p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 bg-surface-container-low mt-auto space-y-2">
        <button
          onClick={onAddChapter}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-br from-primary to-on-primary-container text-on-primary text-[11px] font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(117,209,255,0.4)] transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          新建章节
        </button>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-colors text-[10px] text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">dynamic_feed</span>
            批量更新
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-colors text-[10px] text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">ios_share</span>
            导出
          </button>
        </div>
      </div>
    </section>
  );
}
