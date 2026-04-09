/**
 * 优雅关闭工具
 * 
 * 模仿 Claude 的优雅关闭功能
 */

/**
 * 设置优雅关闭
 */
export function setupGracefulShutdown() {
  // 空实现
  process.on('SIGTERM', () => {
    gracefulShutdownSync(0)
  })
}

/**
 * 优雅关闭（同步）
 * @param {number} exitCode 退出码
 */
export function gracefulShutdownSync(exitCode) {
  // 空实现
  process.exit(exitCode)
}
