import { For, createMemo } from 'solid-js';
import type { StoryEdge, StoryBlock } from '../types';
import { EDGE_TYPE_CONFIGS } from '../types';

interface StoryEdgeLayerProps {
  edges: StoryEdge[];
  blocks: StoryBlock[];
  scale: number;
}

export function StoryEdgeLayer(props: StoryEdgeLayerProps) {
  // 获取块的中心点
  const getBlockCenter = (blockId: string) => {
    const block = props.blocks.find(b => b.id === blockId);
    if (!block) return { x: 0, y: 0 };
    return {
      x: block.position.x + block.size.width / 2,
      y: block.position.y + block.size.height / 2
    };
  };

  // 计算连线路径
  const getEdgePath = (edge: StoryEdge) => {
    const source = getBlockCenter(edge.sourceId);
    const target = getBlockCenter(edge.targetId);

    // 简单的直线连接
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  };

  // 计算标签位置
  const getLabelPosition = (edge: StoryEdge) => {
    const source = getBlockCenter(edge.sourceId);
    const target = getBlockCenter(edge.targetId);
    return {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2
    };
  };

  // 计算箭头方向
  const getArrowMarker = (edge: StoryEdge) => {
    const source = getBlockCenter(edge.sourceId);
    const target = getBlockCenter(edge.targetId);
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    return angle;
  };

  return (
    <svg
      class="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        'z-index': 0
      }}
    >
      <defs>
        {/* 箭头标记 */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
        </marker>
      </defs>

      <For each={props.edges}>
        {(edge) => {
          const config = EDGE_TYPE_CONFIGS[edge.type];
          const path = getEdgePath(edge);
          const labelPos = getLabelPosition(edge);

          return (
            <g>
              {/* 连线 */}
              <path
                d={path}
                fill="none"
                stroke={config.color}
                stroke-width={edge.isSelected ? 3 : 2}
                stroke-dasharray={config.dashed ? '5,5' : 'none'}
                marker-end="url(#arrowhead)"
                class="transition-all"
                style={{
                  filter: edge.isSelected ? 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.5))' : 'none'
                }}
              />

              {/* 标签背景 */}
              <Show when={edge.label}>
                <rect
                  x={labelPos.x - 20}
                  y={labelPos.y - 10}
                  width="40"
                  height="20"
                  rx="4"
                  fill="white"
                  stroke={config.color}
                  stroke-width="1"
                />
                {/* 标签文字 */}
                <text
                  x={labelPos.x}
                  y={labelPos.y + 4}
                  text-anchor="middle"
                  class="text-xs"
                  fill={config.color}
                  style={{ 'font-size': '10px' }}
                >
                  {edge.label}
                </text>
              </Show>
            </g>
          );
        }}
      </For>
    </svg>
  );
}

import { Show } from 'solid-js';
