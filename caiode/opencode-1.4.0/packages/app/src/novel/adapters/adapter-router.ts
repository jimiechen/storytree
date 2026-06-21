/**
 * @file adapters/adapter-router.ts
 * @description Adapter Router 实现 — P2-E
 *
 * AdapterRouter 把"调用哪个执行器"从 Workflow Engine / Tool 中解耦。
 * P2-E 默认未指定 adapter 时路由到 mock；显式请求被 FeatureGate 关闭的 adapter 时返回结构化 ADAPTER_DISABLED 错误，
 * 避免 UI / 调试器误以为 OpenCode / ClaudeCode 已经真实可用。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type {
  AdapterContext,
  AdapterFeatureGates,
  AdapterKind,
  AdapterRouter,
  AdapterRouterError,
  AgentExecutionAdapter,
} from './adapter-types';

function createAdapterRouterError(
  errorCode: 'ADAPTER_DISABLED' | 'ADAPTER_NOT_FOUND',
  error: string,
): AdapterRouterError {
  return { success: false, errorCode, error };
}

/**
 * 创建 AdapterRouter 实例。
 *
 * 路由策略：
 * - 未指定 requested → 优先返回第一个能处理命令的已注册 adapter（P2 通常是 mock）。
 * - 显式请求 mock → 直接返回 mock adapter。
 * - 显式请求 opencode-stub / claudecode-stub → 先检查对应 Gate，关闭则返回 ADAPTER_DISABLED；
 *   开启则返回对应 adapter；未注册则返回 ADAPTER_NOT_FOUND。
 * - 未注册 adapter → ADAPTER_NOT_FOUND。
 *
 * 为什么 disabled 不 fallback 到 mock？
 * 因为 fallback 会让调用方误以为请求的是 OpenCode/ClaudeCode 并成功执行，属于伪成功。
 */
export function createAdapterRouter(): AdapterRouter {
  const adapters = new Map<AdapterKind, AgentExecutionAdapter>();

  return {
    register(adapter) {
      adapters.set(adapter.name, adapter);
    },

    route(requested, command, context, gates) {
      if (!requested) {
        for (const adapter of adapters.values()) {
          if (adapter.canHandle(command, context)) {
            return adapter;
          }
        }
        return createAdapterRouterError('ADAPTER_NOT_FOUND', '未注册可用的 adapter');
      }

      const adapter = adapters.get(requested);
      if (!adapter) {
        return createAdapterRouterError(
          'ADAPTER_NOT_FOUND',
          `Adapter "${requested}" 未注册`,
        );
      }

      if (requested === 'opencode-stub' && !gates.openCodeAdapterEnabled) {
        return createAdapterRouterError(
          'ADAPTER_DISABLED',
          `OpenCode adapter 已被 FeatureGate 关闭（openCodeAdapterEnabled=false）`,
        );
      }

      if (requested === 'claudecode-stub' && !gates.claudeCodeAdapterEnabled) {
        return createAdapterRouterError(
          'ADAPTER_DISABLED',
          `ClaudeCode adapter 已被 FeatureGate 关闭（claudeCodeAdapterEnabled=false）`,
        );
      }

      if (!adapter.canHandle(command, context)) {
        return createAdapterRouterError(
          'ADAPTER_NOT_FOUND',
          `Adapter "${requested}" 无法处理当前命令`,
        );
      }

      return adapter;
    },
  };
}
