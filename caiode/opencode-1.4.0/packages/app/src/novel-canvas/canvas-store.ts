import { createSignal, createMemo } from 'solid-js';
import type { StoryBlock, StoryEdge, Position, StoryBlockType, StoryEdgeType } from './types';
import { initialCanvasState } from './mock-canvas-data';

/**
 * Canvas Store - 管理画布状态
 * 使用 Solid.js Signal 实现响应式状态管理
 */

// 创建 Canvas Store
export function createCanvasStore() {
  // 状态信号
  const [blocks, setBlocks] = createSignal<StoryBlock[]>(initialCanvasState.blocks);
  const [edges, setEdges] = createSignal<StoryEdge[]>(initialCanvasState.edges);
  const [selectedBlockId, setSelectedBlockId] = createSignal<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = createSignal<string | null>(null);
  const [scale, setScale] = createSignal(1);
  const [offset, setOffset] = createSignal<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragBlockId, setDragBlockId] = createSignal<string | null>(null);
  const [dragStart, setDragStart] = createSignal<Position | null>(null);

  // 计算属性
  const selectedBlock = createMemo(() => {
    const id = selectedBlockId();
    return id ? blocks().find(b => b.id === id) || null : null;
  });

  const selectedEdge = createMemo(() => {
    const id = selectedEdgeId();
    return id ? edges().find(e => e.id === id) || null : null;
  });

  // ===== 块操作 =====

  const selectBlock = (id: string | null) => {
    // 取消之前的选中
    setBlocks(prev => prev.map(b => ({ ...b, isSelected: false })));
    setEdges(prev => prev.map(e => ({ ...e, isSelected: false })));

    if (id) {
      setBlocks(prev => prev.map(b =>
        b.id === id ? { ...b, isSelected: true } : b
      ));
    }

    setSelectedBlockId(id);
    setSelectedEdgeId(null);
  };

  const updateBlock = (id: string, updates: Partial<StoryBlock>) => {
    setBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  const updateBlockPosition = (id: string, position: Position) => {
    setBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, position } : b
    ));
  };

  const addBlock = (block: StoryBlock) => {
    setBlocks(prev => [...prev, block]);
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    // 同时删除关联的连线
    setEdges(prev => prev.filter(e => e.sourceId !== id && e.targetId !== id));
    if (selectedBlockId() === id) {
      setSelectedBlockId(null);
    }
  };

  // ===== 连线操作 =====

  const selectEdge = (id: string | null) => {
    setBlocks(prev => prev.map(b => ({ ...b, isSelected: false })));
    setEdges(prev => prev.map(e => ({ ...e, isSelected: false })));

    if (id) {
      setEdges(prev => prev.map(e =>
        e.id === id ? { ...e, isSelected: true } : e
      ));
    }

    setSelectedEdgeId(id);
    setSelectedBlockId(null);
  };

  const addEdge = (edge: StoryEdge) => {
    setEdges(prev => [...prev, edge]);
  };

  const updateEdge = (id: string, updates: Partial<StoryEdge>) => {
    setEdges(prev => prev.map(e =>
      e.id === id ? { ...e, ...updates } : e
    ));
  };

  const deleteEdge = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    if (selectedEdgeId() === id) {
      setSelectedEdgeId(null);
    }
  };

  // ===== 拖拽操作 =====

  const startDrag = (blockId: string, startPos: Position) => {
    setIsDragging(true);
    setDragBlockId(blockId);
    setDragStart(startPos);
  };

  const updateDrag = (currentPos: Position) => {
    const start = dragStart();
    const blockId = dragBlockId();
    if (!start || !blockId) return;

    const dx = currentPos.x - start.x;
    const dy = currentPos.y - start.y;

    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          position: {
            x: b.position.x + dx,
            y: b.position.y + dy
          }
        };
      }
      return b;
    }));

    setDragStart(currentPos);
  };

  const endDrag = () => {
    setIsDragging(false);
    setDragBlockId(null);
    setDragStart(null);
  };

  // ===== 缩放操作 =====

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1);

  return {
    // 状态
    blocks,
    edges,
    selectedBlockId,
    selectedEdgeId,
    scale,
    offset,
    isDragging,
    dragBlockId,
    // 计算属性
    selectedBlock,
    selectedEdge,
    // 块操作
    selectBlock,
    updateBlock,
    updateBlockPosition,
    addBlock,
    deleteBlock,
    // 连线操作
    selectEdge,
    addEdge,
    updateEdge,
    deleteEdge,
    // 拖拽操作
    startDrag,
    updateDrag,
    endDrag,
    // 缩放操作
    zoomIn,
    zoomOut,
    resetZoom
  };
}

export type CanvasStore = ReturnType<typeof createCanvasStore>;
