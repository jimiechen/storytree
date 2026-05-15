'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Volume {
  id: string;
  name: string;
  chapters: Chapter[];
}

export default function OutlinePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const result = await api.get<{ result: { data: Chapter[] } }>(`/api/projects/${projectId}/chapters`);
        const chapters = result?.result?.data || [];
        setVolumes([{
          id: 'v1',
          name: '第一卷：初入江湖',
          chapters: chapters
        }]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-white/50">加载大纲中...</div>;
  }

  return (
    <div className="flex h-full w-full bg-[#11111a] text-white overflow-hidden">
      {/* Middle Column: Outline Management */}
      <div className="flex-1 flex flex-col border-r border-white/5">
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold font-serif text-[#75d1ff]">织梦笔</h1>
            <p className="text-xs text-white/40 italic font-serif mt-1">DreamWeaver Outline</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Expand All</button>
            <button className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Collapse All</button>
            <button className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Focus Mode</button>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-white/30">search</span>
              <input type="text" placeholder="Search outlines..." className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:border-[#75d1ff]/50 w-48 transition-colors" />
            </div>
            <button className="bg-[#75d1ff] text-black px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-[#5cc0f9] transition-colors">
              Sync to Cloud
            </button>
            <button className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <img src="/avatar.png" alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors">
                <span className="material-symbols-outlined text-[16px] text-[#75d1ff]">add_circle</span>
                新建章节
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                批量状态更新
              </button>
            </div>
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button className="px-4 py-1.5 text-xs font-medium text-white/50 hover:text-white rounded-md transition-colors">卡片视图</button>
              <button className="px-4 py-1.5 text-xs font-medium bg-[#75d1ff] text-black rounded-md shadow-sm">列表视图</button>
            </div>
          </div>

          <div className="space-y-6">
            {volumes.map(vol => (
              <div key={vol.id} className="border border-white/10 rounded-xl overflow-hidden bg-[#1a1a24]">
                <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-white/30 cursor-pointer">drag_indicator</span>
                    <span className="material-symbols-outlined text-[#75d1ff]">book</span>
                    <h2 className="text-lg font-bold">{vol.name}</h2>
                  </div>
                  <span className="text-xs text-white/40 uppercase tracking-widest">{vol.chapters.length} CHAPTERS</span>
                </div>
                <div className="divide-y divide-white/5">
                  {vol.chapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 pl-12 hover:bg-white/5 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-white/90">{chapter.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 flex items-center gap-1 border border-green-500/20">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          定稿
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-white/30 font-mono">{chapter.wordCount} 字</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <button className="text-white/40 hover:text-white"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          <button className="text-white/40 hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Details Panel */}
      <div className="w-[400px] bg-[#151520] flex flex-col h-full flex-shrink-0">
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75d1ff]">Selected Chapter</span>
            <h2 className="text-2xl font-serif font-bold mt-2">第三章：命运的转折</h2>
          </div>

          <div className="space-y-8">
            {/* Plot Summary */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  Plot Summary
                </h3>
                <button className="text-white/30 hover:text-[#75d1ff]"><span className="material-symbols-outlined text-[16px]">edit</span></button>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-sm text-white/80 leading-relaxed border border-white/5">
                主角在酒馆意外听到了关于自己身世的秘密，随即遭遇了一群黑衣人的围攻。这是全书第一个重大转折点，主角必须在逃亡中觉醒体内的潜能。
              </div>
            </section>

            {/* Key Characters */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[16px]">group</span>
                Key Characters
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  林青云 (主角)
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                  黑衣首领
                </span>
                <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </section>

            {/* AI Suggestion */}
            <section className="bg-gradient-to-b from-[#75d1ff]/10 to-transparent border border-[#75d1ff]/20 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#75d1ff]/10 blur-3xl rounded-full"></div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#75d1ff] flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                AI Creative Suggestion
              </h3>
              <p className="text-sm text-white/80 leading-relaxed mb-4 relative z-10">
                检测到本章节奏较快，建议在冲突爆发前增加一段环境描写，以加深夜幕降临时的压抑感。
              </p>
              <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border border-white/10 relative z-10">
                APPLY SUGGESTION
              </button>
            </section>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 font-medium uppercase tracking-widest">
          <span>Last Saved</span>
          <span>2 mins ago</span>
        </div>
      </div>
    </div>
  );
}
