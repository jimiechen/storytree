/**
 * @file actions/novel-action-result.ts
 * @description NovelActionResult 工厂函数 — P2-D
 *
 * 统一构造成功/失败结果，避免 Dispatcher 内部重复样板代码。
 */

import type { NovelActionResult, NovelActionType } from './novel-action-types';

export function createSuccessResult(
  actionType: NovelActionType,
  data: Omit<NovelActionResult, 'success' | 'actionType'>,
): NovelActionResult {
  return {
    success: true,
    actionType,
    ...data,
  };
}

export function createErrorResult(
  actionType: NovelActionType,
  errorCode: string,
  error: string,
  partial?: Partial<NovelActionResult>,
): NovelActionResult {
  return {
    success: false,
    actionType,
    errorCode,
    error,
    ...partial,
  };
}
