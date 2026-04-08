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
  // 根据目标关键词进行智能拆解
  let tasks = []
  
  if (goal.includes('复刻') && goal.includes('Claude')) {
    tasks = [
      `任务 1.1: 分析 Claude 的初始化函数结构和目录布局`,
      `任务 1.2: 创建基础目录结构，模仿 Claude 的布局`,
      `任务 1.3: 实现 init.ts 初始化函数`,
      `任务 1.4: 创建状态管理模块 state.js`,
      `任务 1.5: 实现配置管理工具 config.js`,
      `任务 1.6: 创建其他必要的工具函数文件`,
      `任务 1.7: 创建服务模块的空实现`,
      `任务 1.8: 将所有注释改为中文`,
      `任务 2.1: 设计目标管理模块的功能`,
      `任务 2.2: 实现目标管理模块 goalManagement.js`,
      `任务 2.3: 在初始化流程中集成目标管理`,
      `任务 2.4: 测试目标管理功能`,
      `任务 3.1: 编写方案文档 CLAUDE_INIT_REPLICA_PLAN.md`,
      `任务 3.2: 提交代码到 git 仓库`,
      `任务 3.3: 推送到远程仓库`,
      `任务 4.1: 验证所有功能正常工作`,
      `任务 4.2: 准备方案评审文档`
    ]
  } else {
    // 通用的任务拆解
    tasks = [
      `分析目标: ${goal}`,
      `制定实现计划`,
      `执行第一步`,
      `执行第二步`,
      `执行第三步`,
      `验证目标完成情况`
    ]
  }
  
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
