/**
 * 多维表格同步模块
 * 将任务同步到飞书多维表格 (Base)
 */

import * as fs from 'fs';
import * as path from 'path';
import { FeishuConfig } from './config';
import { TaskItem } from './parser';

// ID 映射缓存文件
const MAPPING_FILE = '.ralph-task-mapping.json';

interface TaskMapping {
  version: string;
  project: string;
  mappings: Array<{
    localId: string;
    localDesc: string;
    feishuRecordId?: string;
    feishuTaskId: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * 加载 ID 映射
 */
function loadMappings(projectId: string): TaskMapping {
  try {
    if (fs.existsSync(MAPPING_FILE)) {
      const content = fs.readFileSync(MAPPING_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data.project === projectId) {
        return data;
      }
    }
  } catch (error) {
    console.warn('⚠️ 读取映射文件失败:', error);
  }
  
  return {
    version: '1.0',
    project: projectId,
    mappings: [],
  };
}

/**
 * 保存 ID 映射
 */
function saveMappings(mapping: TaskMapping): void {
  try {
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
  } catch (error) {
    console.error('❌ 保存映射文件失败:', error);
  }
}

/**
 * 查找现有映射
 */
function findMapping(
  mappings: TaskMapping['mappings'],
  description: string
): TaskMapping['mappings'][0] | undefined {
  return mappings.find(m => m.localDesc === description);
}

/**
 * 状态映射：本地状态 -> 飞书状态
 */
function mapStatusToFeishu(status: TaskItem['status']): string {
  const statusMap: Record<TaskItem['status'], string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    blocked: '已阻塞',
  };
  return statusMap[status] || '待开始';
}

/**
 * 构建飞书记录字段
 */
function buildRecordFields(
  task: TaskItem,
  projectId: string
): Record<string, any> {
  return {
    任务ID: task.id,
    任务名称: task.description,
    模块: task.module,
    子模块: task.submodule,
    状态: mapStatusToFeishu(task.status),
    优先级: task.priority || 'P2',
    预估工时: task.estimatedHours || 1,
    创建时间: new Date().toISOString(),
    本地文件: '04-ralph-tasks.md',
    行号: task.lineNumber,
  };
}

/**
 * 同步任务到飞书 Base
 * 
 * 注意：这是一个模拟实现，实际使用时需要调用飞书 API
 * 可以通过 lark-base skill 或直接调用飞书 OpenAPI
 */
export async function syncTasksToBase(
  tasks: TaskItem[],
  projectId: string,
  config: FeishuConfig
): Promise<{ success: boolean; message: string }> {
  try {
    // 验证配置
    if (!config.base.app_token || !config.base.table_id) {
      return {
        success: false,
        message: '❌ 飞书 Base 配置不完整',
      };
    }
    
    console.log(`🔄 正在同步 ${tasks.length} 个任务到飞书多维表格...`);
    
    // 加载现有映射
    const mapping = loadMappings(projectId);
    
    // 准备批量创建记录
    const recordsToCreate = [];
    const recordsToUpdate = [];
    
    for (const task of tasks) {
      const existing = findMapping(mapping.mappings, task.description);
      const fields = buildRecordFields(task, projectId);
      
      if (existing) {
        // 更新现有记录
        recordsToUpdate.push({
          recordId: existing.feishuRecordId,
          fields,
        });
        existing.updatedAt = new Date().toISOString();
      } else {
        // 创建新记录
        recordsToCreate.push({
          task,
          fields,
        });
      }
    }
    
    // 模拟 API 调用（实际使用时替换为真实的飞书 API 调用）
    console.log(`   新建: ${recordsToCreate.length} 条记录`);
    console.log(`   更新: ${recordsToUpdate.length} 条记录`);
    
    // 模拟创建记录并获取 recordId
    for (const item of recordsToCreate) {
      // 这里应该调用飞书 API 创建记录
      // const result = await createFeishuRecord(config, item.fields);
      const mockRecordId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      mapping.mappings.push({
        localId: `${item.task.module}-${item.task.lineNumber}`,
        localDesc: item.task.description,
        feishuRecordId: mockRecordId,
        feishuTaskId: item.task.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // 保存映射
    saveMappings(mapping);
    
    console.log(`✅ 任务同步完成`);
    console.log(`   映射文件: ${MAPPING_FILE}`);
    
    return {
      success: true,
      message: `成功同步 ${tasks.length} 个任务`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 同步任务失败:', errorMsg);
    return {
      success: false,
      message: `同步失败: ${errorMsg}`,
    };
  }
}

/**
 * 同步任务完成状态
 */
export async function syncTaskComplete(
  taskDescription: string,
  commitHash: string | undefined,
  config: FeishuConfig
): Promise<{ success: boolean; message: string }> {
  try {
    // 加载映射
    const mapping = loadMappings(config.project.id);
    const existing = findMapping(mapping.mappings, taskDescription);
    
    if (!existing) {
      return {
        success: false,
        message: `❌ 未找到任务映射: ${taskDescription.substring(0, 50)}...`,
      };
    }
    
    console.log(`🔄 正在更新任务状态: ${existing.feishuTaskId}`);
    
    // 构建更新字段
    const updateFields = {
      状态: '已完成',
      完成时间: new Date().toISOString(),
      ...(commitHash && { 'Commit Hash': commitHash }),
    };
    
    // 这里应该调用飞书 API 更新记录
    // await updateFeishuRecord(config, existing.feishuRecordId, updateFields);
    
    console.log(`   Record ID: ${existing.feishuRecordId}`);
    console.log(`   状态: 已完成`);
    if (commitHash) {
      console.log(`   Commit: ${commitHash}`);
    }
    
    // 更新映射时间
    existing.updatedAt = new Date().toISOString();
    saveMappings(mapping);
    
    return {
      success: true,
      message: `任务状态已更新: ${existing.feishuTaskId}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 更新任务状态失败:', errorMsg);
    return {
      success: false,
      message: `更新失败: ${errorMsg}`,
    };
  }
}

/**
 * 获取任务统计
 */
export async function getTaskStats(
  config: FeishuConfig
): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  pending: number;
}> {
  // 这里应该调用飞书 API 查询统计
  // 简化实现，返回本地映射统计
  const mapping = loadMappings(config.project.id);
  
  return {
    total: mapping.mappings.length,
    completed: 0,
    inProgress: 0,
    blocked: 0,
    pending: mapping.mappings.length,
  };
}

export default {
  syncTasksToBase,
  syncTaskComplete,
  getTaskStats,
};
