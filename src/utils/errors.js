/**
 * 错误处理工具
 * 
 * 模仿 Claude 的错误处理功能
 */

/**
 * 配置解析错误类
 */
export class ConfigParseError extends Error {
  constructor(message, filePath) {
    super(message)
    this.name = 'ConfigParseError'
    this.filePath = filePath
  }
}

/**
 * 遥测操作错误类
 */
export class TeleportOperationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TeleportOperationError'
  }
}

/**
 * 获取错误信息
 * @param {Error|unknown} error 错误对象
 * @returns {string} 错误信息
 */
export function errorMessage(error) {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * 获取错误码
 * @param {Error} error 错误对象
 * @returns {string|null} 错误码
 */
export function getErrnoCode(error) {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code)
  }
  return null
}

/**
 * 检查是否为 ENOENT 错误
 * @param {Error} error 错误对象
 * @returns {boolean} 是否为 ENOENT 错误
 */
export function isENOENT(error) {
  return getErrnoCode(error) === 'ENOENT'
}

/**
 * 转换为错误对象
 * @param {unknown} value 要转换的值
 * @returns {Error} 错误对象
 */
export function toError(value) {
  if (value instanceof Error) {
    return value
  }
  return new Error(String(value))
}
