/**
 * 多维表格同步模块
 * 将任务同步到飞书多维表格 (Base) - 真实 API 实现
 */

import * as fs from 'fs';
import { execSync } from 'child_process';
import { FeishuConfig } from './config';
import { TaskItem } from './parser';

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

function loadMappings(projectId: string): TaskMapping {
  try {
    if (fs.existsSync(MAPPING_FILE)) {
      const content = fs.readFileSync(MAPPING_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data.project === projectId) return data;
    }
  } catch (error) {
    console.warn('⚠️ 读取映射文件失败:', error);
  }
  return { version: '1.0', project: projectId, mappings: [] };
}

function saveMappings(mapping: TaskMapping): void {
  try {
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
  } catch (error) {
    console.error('❌ 保存映射文件失败:', error);
  }
}

function findMapping(mappings: TaskMapping['mappings'], description: string) {
  return mappings.find(m => m.localDesc === description);
}

function mapStatusToFeishu(status: TaskItem['status']): string {
  const map: Record<TaskItem['status'], string> = {
    pending: '待开始', in_progress: '进行中', completed: '已完成', blocked: '已阻塞'
  };
  return map[status] || '待开始';
}

function formatDateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildRecordFields(task: TaskItem): Record<string, any> {
  const fields: Record<string, any> = {
    '任务ID': task.id,
    '任务名称': task.description,
    '任务描述': `[${task.module}] ${task.submodule || ''}`,
    '状态': mapStatusToFeishu(task.status),
    '优先级': task.priority || 'P2',
    '预计工时': task.estimatedHours || 1,
  };
  if (task.status === 'in_progress') {
    fields['开始时间'] = formatDateTime();
  }
  return fields;
}

async function createRecord(config: FeishuConfig, fields: Record<string, any>): Promise<string | null> {
  try {
    const jsonPayload = JSON.stringify(fields);
    console.log('   创建记录 payload:', jsonPayload.substring(0, 200));
    const cmd = `lark-cli base +record-upsert --base-token ${config.base.app_token} --table-id ${config.base.table_id} --json '${jsonPayload}'`;
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const data = JSON.parse(result);
    if (data.ok && data.data?.record?.record_id_list?.length > 0) {
      return data.data.record.record_id_list[0];
    }
    console.error('   创建记录失败:', data.error || data);
    return null;
  } catch (error) {
    console.error('❌ 创建记录失败:', error);
    return null;
  }
}

async function updateRecord(config: FeishuConfig, recordId: string, fields: Record<string, any>): Promise<boolean> {
  try {
    const jsonPayload = JSON.stringify(fields);
    console.log('   更新记录 payload:', jsonPayload.substring(0, 200));
    const cmd = `lark-cli base +record-upsert --base-token ${config.base.app_token} --table-id ${config.base.table_id} --record-id ${recordId} --json '${jsonPayload}'`;
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const data = JSON.parse(result);
    if (data.ok) return true;
    console.error('   更新记录失败:', data.error || data);
    return false;
  } catch (error) {
    console.error('❌ 更新记录失败:', error);
    return false;
  }
}

export async function syncTasksToBase(tasks: TaskItem[], projectId: string, config: FeishuConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.base.app_token || !config.base.table_id) {
      return { success: false, message: '❌ 飞书 Base 配置不完整' };
    }
    console.log(`🔄 正在同步 ${tasks.length} 个任务到飞书多维表格...`);
    const mapping = loadMappings(projectId);
    let created = 0, updated = 0, failed = 0;
    for (const task of tasks) {
      const existing = findMapping(mapping.mappings, task.description);
      const fields = buildRecordFields(task);
      if (existing?.feishuRecordId) {
        console.log(`   更新: ${task.id}`);
        if (await updateRecord(config, existing.feishuRecordId, fields)) {
          updated++;
          existing.updatedAt = new Date().toISOString();
        } else failed++;
      } else {
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
        } else failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    saveMappings(mapping);
    console.log(`✅ 任务同步完成: 新建${created}, 更新${updated}, 失败${failed}`);
    return { success: failed === 0, message: `同步完成: 新建${created}, 更新${updated}, 失败${failed}` };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `同步失败: ${errorMsg}` };
  }
}

export async function syncTaskComplete(taskDescription: string, commitHash: string | undefined, config: FeishuConfig): Promise<{ success: boolean; message: string }> {
  try {
    const mapping = loadMappings(config.project.id);
    const existing = findMapping(mapping.mappings, taskDescription);
    if (!existing?.feishuRecordId) {
      return { success: false, message: `❌ 未找到任务映射: ${taskDescription.substring(0, 50)}...` };
    }
    console.log(`🔄 正在更新任务状态: ${existing.feishuTaskId}`);
    const updateFields: Record<string, any> = { '状态': '已完成', '完成时间': formatDateTime() };
    if (commitHash) updateFields['备注'] = `Git Commit: ${commitHash}`;
    if (await updateRecord(config, existing.feishuRecordId, updateFields)) {
      existing.updatedAt = new Date().toISOString();
      saveMappings(mapping);
      return { success: true, message: `任务状态已更新: ${existing.feishuTaskId}` };
    }
    return { success: false, message: '❌ 更新飞书记录失败' };
  } catch (error) {
    return { success: false, message: `更新失败: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export default { syncTasksToBase, syncTaskComplete };
