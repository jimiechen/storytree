/**
 * StoryCanvas MVP 类型定义
 * 6 种 MVP 块类型 + 8 种连线类型
 */

// ===== 6 种 MVP 块类型 =====
export type StoryBlockType =
  | 'plot'      // 剧情块
  | 'character' // 角色块
  | 'scene'     // 场景块
  | 'dialogue'  // 对话块
  | 'conflict'  // 冲突块
  | 'resolution'; // 结局块

// ===== 8 种连线类型 =====
export type StoryEdgeType =
  | 'sequence'   // 顺序
  | 'branch'     // 分支
  | 'converge'   // 汇聚
  | 'parallel'   // 并行
  | 'flashback'  // 闪回
  | 'foreshadow' // 伏笔
  | 'contrast'   // 对比
  | 'cause-effect'; // 因果

// ===== 坐标 =====
export interface Position {
  x: number;
  y: number;
}

// ===== 尺寸 =====
export interface Size {
  width: number;
  height: number;
}

// ===== 叙事块节点 =====
export interface StoryBlock {
  id: string;
  type: StoryBlockType;
  title: string;
  content: string;
  position: Position;
  size: Size;
  color?: string;
  isSelected: boolean;
  metadata?: Record<string, string>;
}

// ===== 连线 =====
export interface StoryEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: StoryEdgeType;
  label?: string;
  isSelected: boolean;
}

// ===== 画布状态 =====
export interface CanvasState {
  blocks: StoryBlock[];
  edges: StoryEdge[];
  selectedBlockId: string | null;
  selectedEdgeId: string | null;
  scale: number;
  offset: Position;
  isDragging: boolean;
  dragBlockId: string | null;
  dragStart: Position | null;
}

// ===== 块类型配置 =====
export interface BlockTypeConfig {
  type: StoryBlockType;
  label: string;
  icon: string;
  defaultColor: string;
  defaultSize: Size;
}

// ===== 连线类型配置 =====
export interface EdgeTypeConfig {
  type: StoryEdgeType;
  label: string;
  color: string;
  dashed: boolean;
}

// ===== 块类型配置映射 =====
export const BLOCK_TYPE_CONFIGS: Record<StoryBlockType, BlockTypeConfig> = {
  plot: {
    type: 'plot',
    label: '剧情',
    icon: '📖',
    defaultColor: '#3B82F6',
    defaultSize: { width: 180, height: 100 }
  },
  character: {
    type: 'character',
    label: '角色',
    icon: '👤',
    defaultColor: '#10B981',
    defaultSize: { width: 160, height: 90 }
  },
  scene: {
    type: 'scene',
    label: '场景',
    icon: '🎬',
    defaultColor: '#F59E0B',
    defaultSize: { width: 180, height: 100 }
  },
  dialogue: {
    type: 'dialogue',
    label: '对话',
    icon: '💬',
    defaultColor: '#8B5CF6',
    defaultSize: { width: 200, height: 120 }
  },
  conflict: {
    type: 'conflict',
    label: '冲突',
    icon: '⚡',
    defaultColor: '#EF4444',
    defaultSize: { width: 160, height: 90 }
  },
  resolution: {
    type: 'resolution',
    label: '结局',
    icon: '🏁',
    defaultColor: '#06B6D4',
    defaultSize: { width: 160, height: 90 }
  }
};

// ===== 连线类型配置映射 =====
export const EDGE_TYPE_CONFIGS: Record<StoryEdgeType, EdgeTypeConfig> = {
  sequence: {
    type: 'sequence',
    label: '顺序',
    color: '#6B7280',
    dashed: false
  },
  branch: {
    type: 'branch',
    label: '分支',
    color: '#3B82F6',
    dashed: false
  },
  converge: {
    type: 'converge',
    label: '汇聚',
    color: '#10B981',
    dashed: false
  },
  parallel: {
    type: 'parallel',
    label: '并行',
    color: '#F59E0B',
    dashed: true
  },
  flashback: {
    type: 'flashback',
    label: '闪回',
    color: '#8B5CF6',
    dashed: true
  },
  foreshadow: {
    type: 'foreshadow',
    label: '伏笔',
    color: '#EC4899',
    dashed: true
  },
  contrast: {
    type: 'contrast',
    label: '对比',
    color: '#EF4444',
    dashed: true
  },
  'cause-effect': {
    type: 'cause-effect',
    label: '因果',
    color: '#06B6D4',
    dashed: false
  }
};
