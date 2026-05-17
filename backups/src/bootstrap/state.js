/**
 * 基础状态管理
 * 
 * 模仿 Claude 的状态管理结构
 */

// 会话计数器
let sessionCounter = null

// 仪表和计数器创建函数
let meter = null
let createAttributedCounter = null

// 交互式会话状态
let isInteractive = true

// 客户端类型
let clientType = 'cli'

// 会话源
let sessionSource = 'local'

// 初始主循环模型
let initialMainLoopModel = null

// 会话绕过权限模式
let sessionBypassPermissionsMode = false

// 会话持久化禁用
let sessionPersistenceDisabled = false

// 问题预览格式
let questionPreviewFormat = 'markdown'

// SDK Betas
let sdkBetas = []

// 允许的频道
let allowedChannels = []

// 允许的设置源
let allowedSettingSources = []

// Chrome 标志覆盖
let chromeFlagOverride = false

// 直接连接服务器 URL
let directConnectServerUrl = null

// 标志设置路径
let flagSettingsPath = null

// 内联插件
let inlinePlugins = []

// Kairos 激活状态
let kairosActive = false

// 原始工作目录
let originalCwd = process.cwd()

// 会话 ID
let sessionId = null

// 用户消息选择加入
let userMsgOptIn = false

/**
 * 获取是否为非交互式会话
 * @returns {boolean} 是否为非交互式会话
 */
export function getIsNonInteractiveSession() {
  return !isInteractive
}

/**
 * 设置是否为交互式会话
 * @param {boolean} value 是否为交互式会话
 */
export function setIsInteractive(value) {
  isInteractive = value
}

/**
 * 获取客户端类型
 * @returns {string} 客户端类型
 */
export function getClientType() {
  return clientType
}

/**
 * 设置客户端类型
 * @param {string} value 客户端类型
 */
export function setClientType(value) {
  clientType = value
}

/**
 * 获取会话源
 * @returns {string} 会话源
 */
export function getSessionSource() {
  return sessionSource
}

/**
 * 设置会话源
 * @param {string} value 会话源
 */
export function setSessionSource(value) {
  sessionSource = value
}

/**
 * 获取初始主循环模型
 * @returns {string|null} 初始主循环模型
 */
export function getInitialMainLoopModel() {
  return initialMainLoopModel
}

/**
 * 设置初始主循环模型
 * @param {string|null} value 初始主循环模型
 */
export function setInitialMainLoopModel(value) {
  initialMainLoopModel = value
}

/**
 * 设置会话绕过权限模式
 * @param {boolean} value 是否绕过权限
 */
export function setSessionBypassPermissionsMode(value) {
  sessionBypassPermissionsMode = value
}

/**
 * 设置会话持久化禁用
 * @param {boolean} value 是否禁用持久化
 */
export function setSessionPersistenceDisabled(value) {
  sessionPersistenceDisabled = value
}

/**
 * 设置问题预览格式
 * @param {string} value 预览格式
 */
export function setQuestionPreviewFormat(value) {
  questionPreviewFormat = value
}

/**
 * 获取 SDK Betas
 * @returns {string[]} SDK Betas
 */
export function getSdkBetas() {
  return sdkBetas
}

/**
 * 设置 SDK Betas
 * @param {string[]} value SDK Betas
 */
export function setSdkBetas(value) {
  sdkBetas = value
}

/**
 * 设置允许的频道
 * @param {Array} value 允许的频道
 */
export function setAllowedChannels(value) {
  allowedChannels = value
}

/**
 * 设置允许的设置源
 * @param {Array} value 允许的设置源
 */
export function setAllowedSettingSources(value) {
  allowedSettingSources = value
}

/**
 * 设置 Chrome 标志覆盖
 * @param {boolean} value 是否覆盖
 */
export function setChromeFlagOverride(value) {
  chromeFlagOverride = value
}

/**
 * 设置直接连接服务器 URL
 * @param {string|null} value 服务器 URL
 */
export function setDirectConnectServerUrl(value) {
  directConnectServerUrl = value
}

/**
 * 设置标志设置路径
 * @param {string} value 设置路径
 */
export function setFlagSettingsPath(value) {
  flagSettingsPath = value
}

/**
 * 设置内联插件
 * @param {string[]} value 内联插件
 */
export function setInlinePlugins(value) {
  inlinePlugins = value
}

/**
 * 设置 Kairos 激活状态
 * @param {boolean} value 是否激活
 */
export function setKairosActive(value) {
  kairosActive = value
}

/**
 * 获取原始工作目录
 * @returns {string} 原始工作目录
 */
export function getOriginalCwd() {
  return originalCwd
}

/**
 * 设置原始工作目录
 * @param {string} value 原始工作目录
 */
export function setOriginalCwd(value) {
  originalCwd = value
}

/**
 * 获取会话 ID
 * @returns {string|null} 会话 ID
 */
export function getSessionId() {
  return sessionId
}

/**
 * 设置会话 ID
 * @param {string} value 会话 ID
 */
export function setSessionId(value) {
  sessionId = value
}

/**
 * 获取用户消息选择加入
 * @returns {boolean} 是否选择加入
 */
export function getUserMsgOptIn() {
  return userMsgOptIn
}

/**
 * 设置用户消息选择加入
 * @param {boolean} value 是否选择加入
 */
export function setUserMsgOptIn(value) {
  userMsgOptIn = value
}

/**
 * 切换会话
 * @param {string} sessionId 会话 ID
 */
export function switchSession(sessionId) {
  // 空实现
}

/**
 * 获取会话计数器
 * @returns {AttributedCounter|null} 会话计数器
 */
export function getSessionCounter() {
  return sessionCounter
}

/**
 * 设置仪表和计数器创建函数
 * @param {Object} newMeter 仪表
 * @param {Function} newCreateAttributedCounter 计数器创建函数
 */
export function setMeter(newMeter, newCreateAttributedCounter) {
  meter = newMeter
  createAttributedCounter = newCreateAttributedCounter
  if (createAttributedCounter) {
    sessionCounter = createAttributedCounter('session_count', {
      description: 'Number of sessions started'
    })
  }
}

/**
 * AttributedCounter 类型定义
 * @typedef {Object} AttributedCounter
 * @property {Function} add - 添加计数
 */
