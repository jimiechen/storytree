/**
 * 调试工具函数
 * 
 * 模仿 Claude 的调试功能
 */

/**
 * 格式化输出标志
 */
let hasFormattedOutput = false

/**
 * 记录调试信息
 * @param {string} message 调试信息
 * @param {Object} options 选项
 */
export function logForDebugging(message, options = {}) {
  // 空实现
  if (process.env.DEBUG) {
    console.log(`[DEBUG] ${message}`)
  }
}

/**
 * 设置格式化输出标志
 * @param {boolean} value 是否格式化输出
 */
export function setHasFormattedOutput(value) {
  hasFormattedOutput = value
}
