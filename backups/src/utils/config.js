/**
 * 配置管理工具
 * 
 * 模仿 Claude 的配置管理功能
 */

// 配置状态
let configsEnabled = false
let globalConfig = {}
let migrationVersion = 0

/**
 * 启用配置系统
 */
export function enableConfigs() {
  configsEnabled = true
  // 空实现
}

/**
 * 记录首次启动时间
 */
export function recordFirstStartTime() {
  // 空实现
}

/**
 * 获取全局配置
 * @returns {Object} 全局配置
 */
export function getGlobalConfig() {
  return globalConfig
}

/**
 * 保存全局配置
 * @param {Function} updater 配置更新函数
 */
export function saveGlobalConfig(updater) {
  globalConfig = updater(globalConfig)
  // 空实现
}

/**
 * 检查是否已接受信任对话框
 * @returns {boolean} 是否已接受
 */
export function checkHasTrustDialogAccepted() {
  return true // 空实现，默认返回 true
}

/**
 * 检查自动更新是否禁用
 * @returns {boolean} 是否禁用
 */
export function isAutoUpdaterDisabled() {
  return false // 空实现，默认返回 false
}
