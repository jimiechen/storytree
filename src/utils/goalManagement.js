/**
 * 目标管理工具
 * 
 * 用于管理初始目标和目标拆解
 */

// 目标状态
let initialGoal = null
let goalTasks = []

/**
 * 设置初始目标
 * @param {string} goal 初始目标
 */
export function setInitialGoal(goal) {
  initialGoal = goal
  console.log(`已设置初始目标: ${goal}`)
}

/**
 * 获取初始目标
 * @returns {string|null} 初始目标
 */
export function getInitialGoal() {
  return initialGoal
}

/**
 * 拆解目标为任务
 * @param {string} goal 目标
 * @returns {Array} 拆解后的任务列表
 */
export function breakdownGoal(goal) {
  // 简单的目标拆解逻辑，实际项目中可能需要更复杂的算法
  const tasks = [
    `分析目标: ${goal}`,
    `制定实现计划`,
    `执行第一步`,
    `执行第二步`,
    `执行第三步`,
    `验证目标完成情况`
  ]
  goalTasks = tasks
  console.log(`目标拆解完成，共 ${tasks.length} 个任务`)
  return tasks
}

/**
 * 获取目标拆解后的任务列表
 * @returns {Array} 任务列表
 */
export function getGoalTasks() {
  return goalTasks
}

/**
 * 初始化目标管理
 * @param {string} goal 初始目标
 */
export function initializeGoalManagement(goal) {
  if (goal) {
    setInitialGoal(goal)
    breakdownGoal(goal)
  }
}
