/**
 * 多维表格同步模块
 * 将任务同步到飞书多维表格 (Base) - 真实 API 实现
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
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
 * 格式化日期时间为字符串
 */
function formatDateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 构建飞书记录字段 - 根据实际字段ID和正确格式
 */
function buildRecordFields(
  task: TaskItem,
  projectId: string
): Record<string, any> {
  const fields: Record<string, any> = {
    // 任务ID - fldV7UZaeC (text)
    'fldV7UZaeC': task.id,
    // 任务名称 - fldUnb5miD (text)
    'fldUnb5miD': task.description,
    // 任务描述 - fldaxqIJ1m (text)
    'fldaxqIJ1m': `[${task.module}] ${task.submodule || ''}`,
    // 状态 - fldRJHcSxn (text)
    'fldRJHcSxn': mapStatusToFeishu(task.status),
    // 优先级 - fldDUkYmxk (text)
    'fldDUkYmxk': task.priority || 'P2',
    // 预计工时 - fldE1AiQBe (number)
    'fldE1AiQBe': task.estimatedHours || 1,
  };

  // 开始时间 - fldalVm7gV (datetime) - 仅当状态为进行中时
  if (task.status === 'in_progress') {
    fields['fldalVm7gV'] = formatDateTime();
  }

  return fields;
}

/**
 * 调用 lark-cli 创建记录
 */
async function createRecord(
  config: FeishuConfig,
  fields: Record<string, any>
): Promise<string | null> {
  try {
    const jsonPayload = JSON.stringify({ fields });
    console.log('   创建记录 payload:', jsonPayload.substring(0, 200) + '...');
    
    const cmd = `lark-cli base +record-upsert --base-token ${config.base.app_token} --table-id ${config.base.table_id} --json '${jsonPayload}'`;
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const data = JSON.parse(result);
    
    if (data.ok && data.data?.record?.record_id) {
      return data.data.record.record_id;
    }
    console.error('   创建记录失败:', data.error || data);
    return null;
  } catch (error) {
    console.error('❌ 创建记录失败:', error);
    return null;
  }
}

/**
 * 调用 lark-cli 更新记录
 */
async function updateRecord(
  config: FeishuConfig,
  recordId: string,
  fields: Record<string, any>
): Promise<boolean> {
  try {
    const jsonPayload = JSON.stringify({ fields });
    console.log('   更新记录 payload:', jsonPayload.substring(0, 200) + '...');
    
    const cmd = `lark-cli base +record-upsert --base-token ${config.base.app_token} --table-id ${config.base.table_id} --record-id ${recordId} --json '${jsonPayload}'`;
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const data = JSON.parse(result);
    
    if (data.ok) {
      return true;
    }
    console.error('   更新记录失败:', data.error || data);
    return false;
  } catch (error) {
    console.error('❌ 更新记录失败:', error);
    return false;
  }
}

/**
 * 同步任务到飞书 Base - 真实 API 实现
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
    console.log(`   Base: ${config.base.app_token}`);
    console.log(`   Table: ${config.base.table_id}`);
    
    // 加载现有映射
    const mapping = loadMappings(projectId);
    
    let created = 0;
    let updated = 0;
    let failed = 0;
    
    for (const task of tasks) {
      const existing = findMapping(mapping.mappings, task.description);
      const fields = buildRecordFields(task, projectId);
      
      if (existing?.feishuRecordId) {
        // 更新现有记录
        console.log(`   更新: ${task.id}`);
        const success = await updateRecord(config, existing.feishuRecordId, fields);
        if (success) {
          updated++;
          existing.updatedAt = new Date().toISOString();
        } else {
          failed++;
        }
      } else {
        // 创建新记录
        console.log(`   创建: ${task.id}`);
        const recordId = await createRecord(config, fields);
        if (recordId) {
          created++;
          mapping.mappings.push({
            localId: `${task.module}-${task.lineNumber}`,
            localDesc: task.description,
            feishuRecordId: recordId,
            feishuTaskId: task.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          failed++;
        }
      }
      
      // 延迟 0.5 秒避免限流
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 保存映射
    saveMappings(mapping);
    
    console.log(`✅ 任务同步完成`);
    console.log(`   新建: ${created}`);
    console.log(`   更新: ${updated}`);
    console.log(`   失败: ${failed}`);
    console.log(`   映射文件: ${MAPPING_FILE}`);
    
    return {
      success: failed === 0,
      message: `同步完成: 新建${created}, 更新${updated}, 失败${failed}`,
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
 * 同步任务完成状态 - 真实 API 实现
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
    
    if (!existing?.feishuRecordId) {
      return {
        success: false,
        message: `❌ 未找到任务映射: ${taskDescription.substring(0, 50)}...`,
      };
    }
    
    console.log(`🔄 正在更新任务状态: ${existing.feishuTaskId}`);
    
    // 构建更新字段
    const updateFields: Record<string, any> = {
      'fldRJHcSxn': '已完成',
      'flddhwzCZW': formatDateTime(),
    };
    
    // 如果有 commit hash，添加到备注
    if (commitHash) {
      updateFields['fldXB7VBoE'] = `Git Commit: ${commitHash}`;
    }
    
    // 调用 API 更新
    const success = await updateRecord(config, existing.feishuRecordId, updateFields);
    
    if (success) {
      // 更新映射时间
      existing.updatedAt = new Date().toISOString();
      saveMappings(mapping);
      
      console.log(`✅ 任务状态已更新: ${existing.feishuTaskId}`);
      return {
        success: true,
        message: `任务状态已更新: ${existing.feishuTaskId}`,
      };
    } else {
      return {
        success: false,
        message: '❌ 更新飞书记录失败',
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 更新任务状态失败:', errorMsg);
    return {
      success: false,
      message: `更新失败: ${errorMsg}`,
    };
  }
}

export default {
  syncTasksToBase,
  syncTaskComplete,
};
