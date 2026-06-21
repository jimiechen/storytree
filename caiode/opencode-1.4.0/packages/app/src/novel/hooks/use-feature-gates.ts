/**
 * @file hooks/use-feature-gates.ts
 * @description UI 层读取 FeatureGate 的 Hook — P2-E
 *
 * P2 阶段默认全部关闭；后续可从环境变量或远端配置读取。
 * Hook 形式便于组件层响应式消费，也便于测试注入 mock gate。
 */

import { createDefaultNovelFeatureGates, type NovelFeatureGates } from '../feature-gates';

/**
 * 返回当前 Novel 模块 FeatureGate。
 * P2-E 仅返回默认值；P3 可扩展为从配置服务或本地缓存读取。
 */
export function useFeatureGates(): NovelFeatureGates {
  return createDefaultNovelFeatureGates();
}
