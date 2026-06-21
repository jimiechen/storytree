/**
 * @file plugins/novel-tool-plugin.ts
 * @description Novel Tool Plugin 注册辅助 — P2-B
 */

import type { NovelToolPlugin, NovelToolRegistry } from './novel-tool-types';

/**
 * 将一个 Plugin 的所有 Tools 注册到 Registry。
 * 遇到重复 tool 名时抛受控错误（默认拒绝覆盖）。
 */
export function registerNovelToolPlugin(
  registry: NovelToolRegistry,
  plugin: NovelToolPlugin,
): void {
  for (const tool of plugin.tools) {
    registry.register(tool);
  }
}
