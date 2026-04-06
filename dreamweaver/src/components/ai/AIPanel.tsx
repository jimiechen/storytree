'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';

interface AIPanelProps {
  projectId: string;
  context?: {
    chapterContent?: string;
    chapterTitle?: string;
  };
}

const quickActions = [
  { id: 'continue', icon: 'edit_note', label: '续写', color: 'primary' },
  { id: 'expand', icon: 'unfold_more', label: '扩写', color: 'primary' },
  { id: 'rewrite', icon: 'auto_fix', label: '改写', color: 'primary' },
  { id: 'chat', icon: 'chat_bubble', label: '对话', color: 'secondary' },
  { id: 'describe', icon: 'palette', label: '描写', color: 'secondary' },
  { id: 'deduce', icon: 'account_tree', label: '推演', color: 'secondary' },
];

const characters = [
  { name: '李云', role: '主角' },
  { name: '苏婉', role: '女主' },
];

const foreshadowing = [
  { name: '玉佩秘密', status: 'active', desc: '关键线索' },
  { name: '已5章未回收', status: 'warning', desc: '' },
];

export function AIPanel({ projectId, context }: AIPanelProps) {
  const [selectedModel, setSelectedModel] = useState('Claude 4 Opus');
  const [activeTab, setActiveTab] = useState<'chat' | 'log' | 'report' | 'versions'>('chat');

  return (
    <section className="w-[320px] bg-surface-container border-l border-outline-variant/10 flex flex-col h-full overflow-hidden" data-testid="ai-panel">
      {/* Model Selection & Quick Actions */}
      <div className="p-6 flex flex-col gap-4">
        {/* Model Selector */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
              Selected Model
            </span>
            <div className="flex items-center gap-2 text-on-surface">
              <span className="font-bold text-sm">{selectedModel}</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold border border-primary/20">
            ⭐ 文学创作 9.2
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-surface-container-highest hover:bg-surface-bright transition-colors group`}
              data-testid={`quick-action-${action.id}`}
            >
              <span className={`material-symbols-outlined text-[18px] text-${action.color}`}>
                {action.icon}
              </span>
              <span className="text-[10px]">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Context Reference */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between cursor-pointer group">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-outline">
              Context Reference
            </h3>
            <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-on-surface">
              expand_less
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-3">
            {/* Characters */}
            <div>
              <span className="text-[10px] text-primary font-bold">Characters</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {characters.map((char) => (
                  <span
                    key={char.name}
                    className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px]"
                  >
                    {char.name} ({char.role})
                  </span>
                ))}
              </div>
            </div>

            {/* Foreshadowing */}
            <div>
              <span className="text-[10px] text-secondary font-bold">Foreshadowing</span>
              <div className="mt-1 space-y-1">
                {foreshadowing.map((item, index) => (
                  <div key={index} className="text-[10px] flex items-center gap-2">
                    <span
                      className={`w-1 h-1 rounded-full ${
                        item.status === 'active' ? 'bg-secondary' : 'bg-outline'
                      }`}
                    ></span>
                    <span className={item.status === 'warning' ? 'text-outline' : ''}>
                      {item.status === 'warning' ? '⚠️ ' : ''}
                      {item.name}
                      {item.desc && ` (${item.desc})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Consistency Check */}
        <div className="space-y-3 pb-8">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-outline">
            Consistency Check
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-tertiary/5 border-l-2 border-tertiary">
              <span className="text-[11px]">角色一致性</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-tertiary/5 border-l-2 border-tertiary">
              <span className="text-[11px]">时间线校对</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-secondary/5 border-l-2 border-secondary">
              <span className="text-[11px]">伏笔状态</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">warning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Chat / Log / Report / Versions */}
      <div className="h-[200px] border-t border-outline-variant/10 bg-surface-container-low flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant/10">
          {[
            { id: 'chat', label: 'CHAT' },
            { id: 'log', label: 'LOG' },
            { id: 'report', label: 'REPORT' },
            { id: 'versions', label: 'VERSIONS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 text-[10px] font-bold ${
                activeTab === tab.id
                  ? 'text-primary border-b border-primary'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatPanel projectId={projectId} context={context} compact />
          )}
          {activeTab === 'log' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px]">
              <div className="flex gap-2">
                <span className="text-primary shrink-0">[14:22:15]</span>
                <span className="text-on-surface-variant">Generation started using &apos;Claude 4 Opus&apos;...</span>
              </div>
              <div className="flex gap-2">
                <span className="text-tertiary shrink-0">[14:22:18]</span>
                <span className="text-on-surface-variant">Scene context updated: 38% stylistic alignment.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary shrink-0">[14:23:02]</span>
                <span className="text-on-surface-variant">Suggestion created: &quot;Add rain sound for tension&quot;.</span>
              </div>
            </div>
          )}
          {activeTab === 'report' && (
            <div className="p-4 text-center text-on-surface-variant text-sm">
              报告功能开发中...
            </div>
          )}
          {activeTab === 'versions' && (
            <div className="p-4 text-center text-on-surface-variant text-sm">
              版本历史开发中...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
