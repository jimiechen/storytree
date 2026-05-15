import type { StoryBlock, StoryEdge } from './types';

/**
 * StoryCanvas MVP Mock 数据
 * 包含 6 种块类型和 8 种连线类型的示例
 */

export const mockBlocks: StoryBlock[] = [
  // 剧情块 - 开端
  {
    id: 'block-001',
    type: 'plot',
    title: '故事开端',
    content: '主角苏瑶在山海关外发现异兽踪迹，决定深入调查。这是整个故事的起始点，奠定了冒险的基调。',
    position: { x: 100, y: 100 },
    size: { width: 180, height: 100 },
    color: '#3B82F6',
    isSelected: false,
    metadata: { chapter: '第一章', importance: '核心' }
  },
  // 角色块 - 主角介绍
  {
    id: 'block-002',
    type: 'character',
    title: '苏瑶',
    content: '18岁，异兽猎人，拥有感知异兽的特殊能力。性格坚韧，但内心有未解的心结。',
    position: { x: 400, y: 80 },
    size: { width: 160, height: 90 },
    color: '#10B981',
    isSelected: false,
    metadata: { role: '主角', age: '18岁' }
  },
  // 场景块 - 雪岭
  {
    id: 'block-003',
    type: 'scene',
    title: '雪岭初遇',
    content: '暴风雪中的雪岭，能见度极低。苏瑶追踪异兽足迹，意外发现古老的符牌。',
    position: { x: 100, y: 280 },
    size: { width: 180, height: 100 },
    color: '#F59E0B',
    isSelected: false,
    metadata: { location: '山海关外', weather: '暴风雪' }
  },
  // 对话块
  {
    id: 'block-004',
    type: 'dialogue',
    title: '初次对话',
    content: '苏瑶：「你是谁？为什么也在这里？」\n陆长风：「和你一样，来找答案。」',
    position: { x: 400, y: 250 },
    size: { width: 200, height: 120 },
    color: '#8B5CF6',
    isSelected: false,
    metadata: { characters: '苏瑶,陆长风', tone: '试探' }
  },
  // 冲突块
  {
    id: 'block-005',
    type: 'conflict',
    title: '异兽袭击',
    content: '异兽突然从雪中跃出，苏瑶和陆长风被迫联手对抗。战斗中符牌发出奇异光芒。',
    position: { x: 100, y: 460 },
    size: { width: 160, height: 90 },
    color: '#EF4444',
    isSelected: false,
    metadata: { intensity: '高', type: '战斗' }
  },
  // 结局块
  {
    id: 'block-006',
    type: 'resolution',
    title: '暂时脱险',
    content: '两人成功击退异兽，但符牌的秘密更加扑朔迷离。他们决定结伴前行。',
    position: { x: 400, y: 440 },
    size: { width: 160, height: 90 },
    color: '#06B6D4',
    isSelected: false,
    metadata: { outcome: '成功', next: '第二章' }
  }
];

export const mockEdges: StoryEdge[] = [
  // 顺序：开端 -> 雪岭
  {
    id: 'edge-001',
    sourceId: 'block-001',
    targetId: 'block-003',
    type: 'sequence',
    label: '接下来',
    isSelected: false
  },
  // 分支：开端 -> 角色介绍
  {
    id: 'edge-002',
    sourceId: 'block-001',
    targetId: 'block-002',
    type: 'branch',
    label: '角色背景',
    isSelected: false
  },
  // 顺序：雪岭 -> 对话
  {
    id: 'edge-003',
    sourceId: 'block-003',
    targetId: 'block-004',
    type: 'sequence',
    label: '相遇',
    isSelected: false
  },
  // 因果：对话 -> 冲突
  {
    id: 'edge-004',
    sourceId: 'block-004',
    targetId: 'block-005',
    type: 'cause-effect',
    label: '引发',
    isSelected: false
  },
  // 顺序：冲突 -> 结局
  {
    id: 'edge-005',
    sourceId: 'block-005',
    targetId: 'block-006',
    type: 'sequence',
    label: '结果',
    isSelected: false
  },
  // 并行：角色介绍 -> 结局
  {
    id: 'edge-006',
    sourceId: 'block-002',
    targetId: 'block-006',
    type: 'parallel',
    label: '同时',
    isSelected: false
  },
  // 伏笔：雪岭 -> 结局
  {
    id: 'edge-007',
    sourceId: 'block-003',
    targetId: 'block-006',
    type: 'foreshadow',
    label: '暗示',
    isSelected: false
  }
];

// 初始画布状态
export const initialCanvasState = {
  blocks: mockBlocks,
  edges: mockEdges,
  selectedBlockId: null,
  selectedEdgeId: null,
  scale: 1,
  offset: { x: 0, y: 0 },
  isDragging: false,
  dragBlockId: null,
  dragStart: null
};
