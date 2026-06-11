import { Show } from 'solid-js';
import type { NovelView } from '../types/novel-view';
import type { Component } from 'solid-js';

interface NovelShellProps {
  view: NovelView;
  children: Record<NovelView, Component>;
}

/**
 * 临时壳层组件 - Phase 7 可重构为真实路由
 * 根据 currentView 渲染对应的子组件
 */
export function NovelShell(props: NovelShellProps) {
  const ViewComponent = () => props.children[props.view];
  return (
    <div class="novel-shell flex flex-col h-screen overflow-hidden">
      <Show when={ViewComponent()} fallback={
        <div class="flex items-center justify-center h-full text-gray-400">
          <span>未知视图: {props.view}</span>
        </div>
      }>
        {(Comp) => <Comp />}
      </Show>
    </div>
  );
}
