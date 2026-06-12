import { Show } from 'solid-js';
import type { NovelView } from '../types/novel-view';
import type { Component } from 'solid-js';

interface NovelShellProps {
  view: NovelView;
  children: Record<NovelView, Component>;
}

/**
 * 小说模块壳层组件 — 视图状态机容器
 *
 * 设计令牌: 全屏容器 + 淡蓝白背景
 * 职责: 根据 currentView 渲染对应的子组件
 */
export function NovelShell(props: NovelShellProps) {
  const ViewComponent = () => props.children[props.view];
  return (
    <div
      class="novel-shell flex flex-col h-screen overflow-hidden"
      style={{
        background: '#f8f9ff',
        'font-family': "'Work Sans', sans-serif",
        color: '#0d1c2f',
      }}
    >
      <Show
        when={ViewComponent()}
        fallback={
          <div class="flex items-center justify-center h-full text-[#7b7486]">
            <span>未知视图: {props.view}</span>
          </div>
        }
      >
        {(Comp) => <Comp />}
      </Show>
    </div>
  );
}
