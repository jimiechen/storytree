/**
 * 诊断日志工具
 * 
 * 模仿 Claude 的诊断日志功能
 */

/**
 * 记录无 PII 的诊断信息
 * @param {string} level 日志级别
 * @param {string} event 事件名称
 * @param {Object} data 附加数据
 */
export function logForDiagnosticsNoPII(level, event, data = {}) {
  // 空实现
  if (process.env.DEBUG) {
    console.log(`[DIAG] ${level.toUpperCase()}: ${event}`, data)
  }
}
