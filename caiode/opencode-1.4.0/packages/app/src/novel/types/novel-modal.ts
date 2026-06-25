/**
 * NovelModal — 工作台弹框类型
 *
 * 批次 4 引入，由 NovelModalHost 统一渲染。
 * 当前先用占位组件，后续批次替换为真实弹框。
 */
export type NovelModal =
  | 'export'
  | 'feedback'
  | 'generation-settings'
  | 'chapter-history'
  | 'notifications'
  | 'batch-generation'
  | 'settings'
  | 'guide-create'
  | 'achievement-detail'
  | 'whats-new'
  | 'ai-toolbox'
  | 'trash'
  | 'signin'
  | 'activity'
  | 'signing-review'
  | 'delete-project-confirm';
