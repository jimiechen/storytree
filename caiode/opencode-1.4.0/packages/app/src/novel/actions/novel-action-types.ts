/**
 * @file actions/novel-action-types.ts
 * @description Novel UI Action 统一类型 — P2-D
 *
 * P2-D 把分散在组件里的 AI 操作收敛为 NovelActionInput，
 * 再经 NovelActionDispatcher 转为 NovelCommand 进入 YAML Workflow Engine。
 * 这样 UI 层只关心"做了什么"，不关心"怎么执行"。
 */

/**
 * UI 层可发起的动作类型。
 *
 * 注意：P2-D 只把生成、续写、信息提取这类 AI_WORKFLOW 动作接入 YAML Engine。
 * CRUD 类动作（保存草稿、采纳、忽略）继续走 provider，不强制工作流化。
 */
export type NovelActionType =
  | 'chapter.generate'
  | 'chapter.continue'
  | 'info.extract'
  | 'task.cancel'
  | 'result.accept'
  | 'result.discard'
  | 'draft.save'
  | 'chapter.mark-complete';

/**
 * UI 动作输入。
 *
 * workspace / branch / worktree / model / skill / workflow 字段在 P2 阶段只做透传，
 * 不执行真实 Git Worktree、不触发真实多模型路由、不加载用户自定义 Skill。
 * 真实能力默认被 FeatureGate 关闭，P3 再逐步打开。
 */
export interface NovelActionInput {
  /** 动作类型 */
  type: NovelActionType;

  /** 工作空间 ID */
  workspaceId?: string;
  /** 项目 ID（必填） */
  projectId: string;
  /** 章节 ID（章节级动作必填） */
  chapterId?: string;

  /** 当前叙事分支 ID */
  branchId?: string;
  /** Git Worktree 实例 ID（P2 仅透传） */
  worktreeId?: string;
  /** 模型配置 ID（P2 仅透传） */
  modelProfileId?: string;
  /** Skill ID（P2 仅透传） */
  skillId?: string;
  /** 显式指定 YAML Workflow ID（通常由 Dispatcher 推断） */
  workflowId?: string;

  /**
   * 动作负载。
   * - chapter.generate / chapter.continue: text, targetWordCount, contextRefs, command 等
   * - info.extract: text（待审计正文）
   */
  payload?: Record<string, unknown>;
}

/**
 * UI 动作执行结果。
 *
 * 所有失败都通过 success + errorCode + error 结构化返回，
 * 不允许未捕获异常直接抛到 UI 层，避免按钮点击后出现伪成功或白屏。
 */
export interface NovelActionResult {
  /** 是否成功 */
  success: boolean;
  /** 对应动作类型 */
  actionType: NovelActionType;
  /** 命令 ID */
  commandId?: string;
  /** 工作流 ID */
  workflowId?: string;
  /** 工作流产生的事件列表 */
  events?: unknown[];
  /** 工具/工作流返回的原始数据 */
  result?: unknown;
  /** 结构化错误码 */
  errorCode?: string;
  /** 人类可读错误信息 */
  error?: string;
}

/**
 * Dispatcher 接口。
 */
export interface NovelActionDispatcher {
  dispatch(input: NovelActionInput): Promise<NovelActionResult>;
}
