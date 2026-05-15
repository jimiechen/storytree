'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  {
    id: 'root',
    type: 'default',
    data: { 
      label: (
        <div className="flex flex-col items-start gap-1 p-2 w-48 text-left">
          <div className="text-[10px] font-bold text-[#75d1ff] tracking-widest uppercase">Main Storyline</div>
          <div className="text-sm font-bold text-white">卷三：命运的转折</div>
          <div className="text-[10px] text-white/50 mt-2">12 Chapters • 45,200 Words</div>
        </div>
      )
    },
    position: { x: 50, y: 200 },
    style: { background: '#1a1a24', border: '1px solid #75d1ff', borderRadius: '12px', color: '#fff' }
  },
  {
    id: 'br-a',
    data: { 
      label: (
        <div className="flex flex-col items-start gap-1 p-2 w-48 text-left">
          <div className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Active Branch</div>
          <div className="text-sm font-bold text-white">分支A: 接受邀请</div>
          <div className="text-[10px] text-white/50 mt-2">3 Chapters • 12,000 Words</div>
        </div>
      )
    },
    position: { x: 350, y: 100 },
    style: { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }
  },
  {
    id: 'br-b',
    data: { 
      label: (
        <div className="flex flex-col items-start gap-1 p-2 w-48 text-left">
          <div className="text-[10px] font-bold text-purple-400 tracking-widest uppercase">IF-line</div>
          <div className="text-sm font-bold text-white">分支B: 拒绝邀请</div>
          <div className="text-[10px] text-white/50 mt-2">1 Chapter • 4,500 Words</div>
        </div>
      )
    },
    position: { x: 350, y: 300 },
    style: { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'root', target: 'br-a', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#75d1ff' }, style: { stroke: '#75d1ff', strokeWidth: 2 } },
  { id: 'e2', source: 'root', target: 'br-b', markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.2)' }, style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2, strokeDasharray: '5 5' } },
];

export default function BranchMapPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [zoom, setZoom] = useState(100);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  if (!mounted) return <div className="flex-1 bg-[#11111a]" data-testid="branch-map-page">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#11111a] text-white overflow-hidden relative" data-testid="branch-map-page">
      {/* Header */}
      <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-[#11111a]/80 backdrop-blur z-10 relative">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#75d1ff]">Narrative Branches</h1>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">4 Active Branches • 1 Merged</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button className="px-4 py-1.5 text-xs font-medium bg-[#75d1ff] text-black rounded-md shadow-sm">树状视图</button>
            <button className="px-4 py-1.5 text-xs font-medium text-white/50 hover:text-white rounded-md transition-colors">时间线视图</button>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <button className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white rounded" onClick={() => setZoom(Math.max(50, zoom - 10))}>
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="text-xs font-mono w-12 text-center text-white/80">{zoom}%</span>
            <button className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white rounded" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          <button className="bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white px-5 py-2 rounded-lg text-xs font-bold tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">call_split</span>
            NEW BRANCH
          </button>
        </div>
      </header>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          minZoom={0.5}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#11111a' }}
        >
          <Background color="#ffffff" gap={16} size={1} />
          {/* <Controls className="bg-[#1a1a24] border-white/10 fill-white" /> */}
        </ReactFlow>
      </div>
    </div>
  );
}
