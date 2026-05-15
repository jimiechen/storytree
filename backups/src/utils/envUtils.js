/**
 * 环境工具函数
 * 
 * 模仿 Claude 的环境工具功能
 */

/**
 * 检查环境变量是否为真
 * @param {string|undefined} value 环境变量值
 * @returns {boolean} 是否为真
 */
export function isEnvTruthy(value) {
  if (value === undefined || value === null) {
    return false
  }
  const lowerValue = String(value).toLowerCase()
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes'
}

/**
 * 检查是否为裸模式
 * @returns {boolean} 是否为裸模式
 */
export function isBareMode() {
  return process.argv.includes('--bare')
}

/**
 * 检查是否有节点选项
 * @param {string} option 选项名称
 * @returns {boolean} 是否有该选项
 */
export function hasNodeOption(option) {
  return process.execArgv.includes(option)
}

/**
 * 检查是否在受保护的命名空间中
 * @returns {boolean} 是否在受保护的命名空间中
 */
export function isInProtectedNamespace() {
  return false // 空实现，默认返回 false
}
