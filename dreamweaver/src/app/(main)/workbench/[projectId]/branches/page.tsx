'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

interface BranchNode {
  id: string;
  code: string;
  title: string;
  description: string;
  status: 'main' | 'active' | 'archived' | 'if-line';
  wordCount: number;
  chapters: number;
  position: { x: number; y: number };
  parentId?: string;
}

const mockBranches: BranchNode[] = [
  {
    id: 'root-01',
    code: 'ROOT-01',
    title: '第一章：相遇',
    description: '主角在迷雾森林边缘的一座废弃驿站里，遇到了那个改变他一生的人...',
    status: 'main',
    wordCount: 15420,
    chapters: 5,
    position: { x: 160, y: 300 },
  },
  {
    id: 'br-a',
    code: 'BR-A',
    title: '分支A: 接受邀请',
    description: '既然未来不可知，不如随他而去。城堡的阴影正从地平线升起。',
    status: 'if-line',
    wordCount: 12450,
    chapters: 4,
    position: { x: 550, y: 150 },
    parentId: 'root-01',
  },
  {
    id: 'br-b',
    code: 'BR-B',
    title: '分支B: 拒绝邀请',
    description: '这种突如其来的好意背后定有阴谋。他转身离去，回到熟悉的小镇。',
    status: 'archived',
    wordCount: 3200,
    chapters: 1,
    position: { x: 550, y: 450 },
    parentId: 'root-01',
  },
  {
    id: 'sub-a1',
    code: 'SUB-A1',
    title: 'A1: 前往城堡',
    description: '古老的城门轰然打开，尘封百年的秘密即将揭晓。',
    status: 'active',
    wordCount: 8900,
    chapters: 3,
    position: { x: 920, y: 80 },
    parentId: 'br-a',
  },
  {
    id: 'sub-a2',
    code: 'SUB-A2',
    title: 'A2: 留在镇上',
    description: '也许平凡才是幸福。然而，不速之客当晚就敲开了房门。',
    status: 'active',
    wordCount: 5600,
    chapters: 2,
    position: { x: 920, y: 220 },
    parentId: 'br-a',
  },
];

const getStatusBadge = (status: BranchNode['status']) => {
  const configs = {
    main: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      icon: 'star',
      label: 'main',
      fill: true,
    },
    'if-line': {
      bg: 'bg-secondary/10',
      text: 'text-secondary',
      icon: 'auto_fix_high',
      label: 'IF-line',
      fill: true,
    },
    archived: {
      bg: 'bg-outline-variant/20',
      text: 'text-on-surface-variant',
      icon: 'archive',
      label: 'archived',
      fill: false,
    },
    active: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      icon: 'circle',
      label: 'active',
      fill: false,
    },
  };
  return configs[status];
};

const getBorderClass = (status: BranchNode['status']) => {
  switch (status) {
    case 'main':
      return 'border-2 border-primary/40';
    case 'if-line':
      return 'border border-secondary/40 ring-2 ring-secondary/20';
    case 'archived':
      return 'border border-outline-variant/30 opacity-60';
    default:
      return 'border border-primary/20';
  }
};

export default function BranchMapPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [selectedBranch, setSelectedBranch] = useState<BranchNode>(mockBranches[1]);
  const [viewMode, setViewMode] = useState<'tree' | 'timeline'>('tree');
  const [zoom, setZoom] = useState(100);

  const activeBranches = mockBranches.filter(b => b.status === 'active' || b.status === 'main' || b.status === 'if-line').length;
  const archivedBranches = mockBranches.filter(b => b.status === 'archived').length;
  const maxDepth = 3;

  return (
    <div className="fixed inset-0 bg-surface-container-lowest flex flex-col" data-testid="branch-map-page">
      {/* Top Navigation Bar */}
      <header className="h-16 flex items-center justify-between px-8 w-full bg-[#111125]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-8">
          <span className="text-lg font-black text-primary font-headline uppercase tracking-tighter">
            Branch Map
          </span>
          <nav className="flex items-center gap-6">
            {['Focus', 'Zoom', 'Filter', 'Export'].map((item, index) => (
              <a
                key={item}
                href="#"
                className={`font-medium text-xs uppercase tracking-widest transition-colors ${
                  index === 0
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-on-surface/70 hover:text-primary'
                }`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-surface-container-high rounded-full px-1 py-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'tree'
                  ? 'bg-surface-bright text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              树状视图
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-surface-bright text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              时间线视图
            </button>
          </div>
          <div className="h-6 w-[1px] bg-outline-variant mx-2" />
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
              <span className="material-symbols-outlined text-xl">history</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Toolbar */}
      <div className="px-8 py-3 bg-surface-container-low flex items-center justify-between z-30 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3">
          <button className="bg-gradient-to-br from-primary to-on-primary-container text-on-primary px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            新建分支
          </button>
          <button className="bg-surface-container-highest text-on-surface border border-outline-variant/30 px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-surface-bright transition-all">
            <span className="material-symbols-outlined text-sm">call_merge</span>
            合并分支
          </button>
          <button className="bg-surface-container-highest text-on-surface border border-outline-variant/30 px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-surface-bright transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            导出分支
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">fit_screen</span>
            缩放适配
          </button>
          <div className="flex items-center bg-surface-container-highest rounded px-2 py-1 gap-4">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="material-symbols-outlined text-sm text-on-surface-variant cursor-pointer hover:text-primary"
            >
              remove
            </button>
            <span className="text-[10px] font-mono text-primary font-bold">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(200, z + 10))}
              className="material-symbols-outlined text-sm text-on-surface-variant cursor-pointer hover:text-primary"
            >
              add
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-auto p-20 flex items-center"
        style={{
          backgroundImage: 'radial-gradient(circle, #75d1ff15 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        {/* SVG Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '1200px' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur result="coloredBlur" stdDeviation="2.5" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Root to A */}
          <path
            d="M 320 400 C 450 400, 450 250, 550 250"
            stroke="#75d1ff40"
            strokeWidth="2"
            fill="none"
          />
          {/* Root to B */}
          <path
            d="M 320 400 C 450 400, 450 550, 550 550"
            stroke="#75d1ff40"
            strokeWidth="2"
            fill="none"
          />
          {/* A to A1 */}
          <path
            d="M 780 250 C 850 250, 850 180, 920 180"
            stroke="#75d1ff40"
            strokeWidth="2"
            fill="none"
          />
          {/* A to A2 */}
          <path
            d="M 780 250 C 850 250, 850 320, 920 320"
            stroke="#75d1ff40"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Branch Nodes */}
        <div className="relative flex items-center h-full min-w-[1200px]">
          {mockBranches.map((branch) => {
            const statusBadge = getStatusBadge(branch.status);
            const borderClass = getBorderClass(branch.status);
            const bgClass = branch.status === 'if-line' ? 'bg-surface-container-high' : 'bg-surface-container';

            return (
              <div
                key={branch.id}
                className="absolute group"
                style={{
                  left: `${branch.position.x}px`,
                  top: `${branch.position.y}px`,
                  transform: 'translateY(-50%)',
                }}
              >
                <div
                  onClick={() => setSelectedBranch(branch)}
                  className={`w-64 ${bgClass} ${borderClass} rounded-xl p-4 shadow-2xl transition-all cursor-pointer hover:scale-105 ${
                    selectedBranch?.id === branch.id ? 'ring-2 ring-primary/50' : ''
                  }`}
                  data-testid={`branch-node-${branch.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${statusBadge.bg} ${statusBadge.text} text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1`}>
                      <span
                        className="material-symbols-outlined text-[12px]"
                        style={{ fontVariationSettings: statusBadge.fill ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {statusBadge.icon}
                      </span>
                      {statusBadge.label}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">{branch.code}</span>
                  </div>
                  <h3 className="font-body text-lg text-on-surface mb-1">{branch.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {branch.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedBranch && (
        <aside className="absolute right-6 top-32 bottom-24 w-80 glass-panel border border-outline-variant/20 rounded-2xl flex flex-col shadow-2xl z-20 pointer-events-auto"
          style={{ background: 'rgba(30, 30, 50, 0.6)', backdropFilter: 'blur(12px)' }}
          data-testid="branch-detail-panel"
        >
          <div className="p-6 border-b border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Branch Details</span>
              <button
                onClick={() => setSelectedBranch(null as unknown as BranchNode)}
                className="text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <h2 className="font-body text-2xl text-on-surface leading-tight">{selectedBranch.title}</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                {getStatusBadge(selectedBranch.status).label}
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">Updated: 2h ago</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-highest/40 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] text-on-surface-variant uppercase mb-1">Word Count</p>
                <p className="text-lg font-headline font-bold text-primary">{selectedBranch.wordCount.toLocaleString()}</p>
              </div>
              <div className="bg-surface-container-highest/40 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] text-on-surface-variant uppercase mb-1">Chapters</p>
                <p className="text-lg font-headline font-bold text-primary">{selectedBranch.chapters}</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary">description</span>
                Description
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                这是剧情的第一个重大转折点。选择接受神秘人的邀请意味着主角将告别现有的宁静生活，正式步入主线冲突的核心。城堡中设计了三个关键谜题和一场潜在的战斗。
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">history</span>
                Metadata
              </h4>
              <ul className="space-y-3 text-xs">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-on-surface-variant">Created On</span>
                  <span className="text-on-surface">Oct 12, 2023</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-on-surface-variant">Created By</span>
                  <span className="text-on-surface">Dream Weaver</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-on-surface-variant">Last Merger</span>
                  <span className="text-on-surface">None</span>
                </li>
              </ul>
            </div>
            <div className="pt-4">
              <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-xl text-xs font-bold transition-all border border-primary/20 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                进入该分支写作
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Bottom Stats Bar */}
      <footer className="h-12 bg-surface-container-low px-8 flex items-center justify-between border-t border-white/5 z-40">
        <div className="flex items-center gap-6 text-[10px] font-medium tracking-wide">
          <span className="flex items-center gap-1.5"><b className="text-primary">总分支数:</b> {mockBranches.length}</span>
          <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span className="flex items-center gap-1.5"><b className="text-secondary">活跃分支:</b> {activeBranches}</span>
          <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span className="flex items-center gap-1.5"><b className="text-primary">最大深度:</b> {maxDepth}</span>
          <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span className="flex items-center gap-1.5"><b className="text-on-surface-variant">已归档:</b> {archivedBranches}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-on-surface-variant uppercase tracking-tighter">
          <span>System Status: Optimal</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary shadow-lg shadow-tertiary/20"></span>
            Cloud Synced
          </span>
        </div>
      </footer>
    </div>
  );
}
