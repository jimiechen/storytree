/**
 * 任务文件解析模块
 * 解析 04-ralph-tasks.md 文件，提取任务列表
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TaskItem {
  id: string;
  description: string;
  module: string;
  submodule: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  lineNumber: number;
  priority?: 'P0' | 'P1' | 'P2';
  estimatedHours?: number;
}

/**
 * 解析任务状态
 */
function parseStatus(line: string): TaskItem['status'] {
  if (line.includes('[x]') || line.includes('[X]')) return 'completed';
  if (line.includes('[~]')) return 'in_progress';
  if (line.includes('[-]')) return 'blocked';
  return 'pending';
}

/**
 * 推断优先级
 */
function inferPriority(description: string): TaskItem['priority'] {
  const lower = description.toLowerCase();
  if (lower.includes('p0') || lower.includes('urgent') || lower.includes('critical')) {
    return 'P0';
  }
  if (lower.includes('p1') || lower.includes('high')) {
    return 'P1';
  }
  if (lower.includes('p2') || lower.includes('low')) {
    return 'P2';
  }
  // 默认根据任务类型推断
  if (lower.includes('基础') || lower.includes('配置') || lower.includes('init')) {
    return 'P0';
  }
  if (lower.includes('测试') || lower.includes('test')) {
    return 'P1';
  }
  return 'P2';
}

/**
 * 推断预估工时
 */
function inferEstimatedHours(description: string): number {
  const lower = description.toLowerCase();
  
  // 根据关键词推断
  if (lower.includes('配置') || lower.includes('setup') || lower.includes('init')) {
    return 0.5;
  }
  if (lower.includes('简单') || lower.includes('fix') || lower.includes('bug')) {
    return 0.5;
  }
  if (lower.includes('复杂') || lower.includes('复杂') || lower.includes('重构')) {
    return 2;
  }
  if (lower.includes('测试') || lower.includes('test')) {
    return 1;
  }
  if (lower.includes('api') || lower.includes('接口')) {
    return 1.5;
  }
  if (lower.includes('ui') || lower.includes('页面') || lower.includes('组件')) {
    return 1.5;
  }
  
  // 默认 1 小时
  return 1;
}

/**
 * 生成任务ID
 */
function generateTaskId(
  projectId: string,
  module: string,
  index: number
): string {
  const moduleCode = module
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 4);
  const seq = String(index + 1).padStart(3, '0');
  return `RALPH-${projectId}-${moduleCode}-${seq}`;
}

/**
 * 解析任务文件
 * 
 * @param filePath 任务文件路径
 * @param projectId 项目ID
 * @returns {TaskItem[]} 任务列表
 */
export function parseTasks(
  filePath: string = '04-ralph-tasks.md',
  projectId: string = 'PROJECT'
): TaskItem[] {
  // 查找文件
  let fullPath = filePath;
  if (!fs.existsSync(fullPath)) {
    // 尝试在项目根目录查找
    const rootPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(rootPath)) {
      fullPath = rootPath;
    } else {
      // 尝试在 docs/planning 目录查找
      const planningPath = path.join(process.cwd(), 'docs', 'planning', '*', filePath);
      // 简化处理，返回空数组
      console.warn(`⚠️ 未找到任务文件: ${filePath}`);
      return [];
    }
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    const tasks: TaskItem[] = [];
    let currentModule = '';
    let currentSubmodule = '';
    let taskIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 检测模块标题 (### 2.1 模块名)
      const moduleMatch = line.match(/^###\s+\d+\.\d+\s+(.+)$/);
      if (moduleMatch) {
        currentModule = moduleMatch[1].trim();
        continue;
      }
      
      // 检测子模块 (- [ ] **2.1.1 子模块名**)
      const submoduleMatch = line.match(/^\s*-\s*\[\s*\]\s*\*\*\d+\.\d+\.\d+\s+(.+)\*\*$/);
      if (submoduleMatch) {
        currentSubmodule = submoduleMatch[1].trim();
        continue;
      }
      
      // 检测具体任务 (    - [ ] 任务描述)
      const taskMatch = line.match(/^\s+-\s*\[([\s~xX-])\]\s+(.+)$/);
      if (taskMatch && currentModule) {
        const status = parseStatus(line);
        const description = taskMatch[2].trim();
        
        // 跳过测试任务（已在功能任务中包含）
        if (description.includes('编写') && description.includes('测试')) {
          continue;
        }
        
        const task: TaskItem = {
          id: generateTaskId(projectId, currentModule, taskIndex),
          description,
          module: currentModule,
          submodule: currentSubmodule,
          status,
          lineNumber,
          priority: inferPriority(description),
          estimatedHours: inferEstimatedHours(description),
        };
        
        tasks.push(task);
        taskIndex++;
      }
    }
    
    console.log(`✅ 解析完成: 共 ${tasks.length} 个任务`);
    return tasks;
  } catch (error) {
    console.error('❌ 解析任务文件失败:', error);
    return [];
  }
}

/**
 * 统计任务进度
 */
export function calculateProgress(tasks: TaskItem[]): {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  pending: number;
  percentage: number;
} {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    inProgress,
    blocked,
    pending,
    percentage,
  };
}

/**
 * 按模块分组任务
 */
export function groupTasksByModule(tasks: TaskItem[]): Record<string, TaskItem[]> {
  const groups: Record<string, TaskItem[]> = {};
  
  tasks.forEach(task => {
    if (!groups[task.module]) {
      groups[task.module] = [];
    }
    groups[task.module].push(task);
  });
  
  return groups;
}

export default {
  parseTasks,
  calculateProgress,
  groupTasksByModule,
};
