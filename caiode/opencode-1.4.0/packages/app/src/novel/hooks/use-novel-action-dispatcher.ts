/**
 * @file hooks/use-novel-action-dispatcher.ts
 * @description UI 层访问 NovelActionDispatcher 的 Hook — P2-D
 *
 * 该 Hook 把 WorkflowMutations 注入 Dispatcher，使按钮点击后生成的事件
 * 能写回到对应 Store。测试时可通过 engine 选项注入 Fake Engine。
 */

import { createNovelActionDispatcher, type NovelActionDispatcherOptions } from '../actions/novel-action-dispatcher';
import type { NovelActionDispatcher, NovelActionInput, NovelActionResult } from '../actions/novel-action-types';
import type { WorkflowMutations } from '../workflows/workflow-events';

export interface UseNovelActionDispatcherOptions extends Omit<NovelActionDispatcherOptions, 'mutations'> {
  mutations: WorkflowMutations;
}

export interface UseNovelActionDispatcherReturn {
  /** Dispatcher 实例 */
  dispatcher: NovelActionDispatcher;
  /** 便捷方法：直接 dispatch */
  dispatch: (input: NovelActionInput) => Promise<NovelActionResult>;
}

/**
 * 创建与当前 UI 状态绑定的 Action Dispatcher。
 *
 * P2-D 仅把 AI_WORKFLOW 动作接入 YAML Engine；
 * CRUD 类动作（保存草稿、采纳、忽略）不经过 Dispatcher，继续由 provider 处理。
 */
export function useNovelActionDispatcher(
  options: UseNovelActionDispatcherOptions,
): UseNovelActionDispatcherReturn {
  const dispatcher = createNovelActionDispatcher({
    engine: options.engine,
    adapter: options.adapter,
    mutations: options.mutations,
  });

  return {
    dispatcher,
    dispatch: (input) => dispatcher.dispatch(input),
  };
}
