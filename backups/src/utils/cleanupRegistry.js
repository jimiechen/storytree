/**
 * 清理注册表工具
 * 
 * 模仿 Claude 的清理注册表功能
 */

// 清理函数列表
const cleanupFunctions = []

/**
 * 注册清理函数
 * @param {Function} cleanupFn 清理函数
 */
export function registerCleanup(cleanupFn) {
  cleanupFunctions.push(cleanupFn)
}

/**
 * 执行所有清理函数
 */
export async function runCleanup() {
  for (const cleanupFn of cleanupFunctions) {
    try {
      await cleanupFn()
    } catch (error) {
      console.error('Cleanup function failed:', error)
    }
  }
}
