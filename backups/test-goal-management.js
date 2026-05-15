#!/usr/bin/env node
/**
 * 测试目标管理模块
 * 展示首个目标的任务拆解
 */

import { initializeGoalManagement, getInitialGoal, getGoalTasks } from './src/utils/goalManagement.js'

console.log('='.repeat(60))
console.log('目标管理模块测试')
console.log('='.repeat(60))

console.log('\n设置首个目标...')
const initialGoal = '复刻 Claude 初始化函数并集成目标管理功能'
initializeGoalManagement(initialGoal)

console.log('\n' + '='.repeat(60))
console.log('首个目标')
console.log('='.repeat(60))
console.log(getInitialGoal())

console.log('\n' + '='.repeat(60))
console.log('任务拆解')
console.log('='.repeat(60))

const tasks = getGoalTasks()
tasks.forEach((task, index) => {
  console.log(`${index + 1}. ${task}`)
})

console.log('\n' + '='.repeat(60))
console.log('任务管理功能已就绪！')
console.log('='.repeat(60))
