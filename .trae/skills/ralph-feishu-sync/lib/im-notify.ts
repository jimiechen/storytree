/**
 * 群聊通知模块
 * 发送进度通知到飞书群聊 - 真实 API 实现
 */

import { execSync } from 'child_process';
import { FeishuConfig } from './config';

export type NotificationType = 'split' | 'complete' | 'daily' | 'milestone';

interface NotifyData {
  project?: string;
  taskCount?: number;
  taskDescription?: string;
  commitHash?: string;
  module?: string;
  progress?: {
    total: number;
    completed: number;
    percentage: number;
  };
}

/**
 * 构建任务拆分通知消息
 */
function buildSplitMessage(data: NotifyData): string {
  return `📋 **任务拆分完成**
━━━━━━━━━━━━━━━━━━━━
📁 项目：${data.project}
📊 任务数：${data.taskCount} 个

✅ 已同步到飞书多维表格`;
}

/**
 * 构建任务完成通知消息
 */
function buildCompleteMessage(data: NotifyData): string {
  const commitInfo = data.commitHash ? `\n🔖 Commit: \`${data.commitHash}\`` : '';
  
  return `✅ **任务完成**
━━━━━━━━━━━━━━━━━━━━
📁 项目：${data.project}
📝 任务：${data.taskDescription?.substring(0, 50)}...${commitInfo}

📊 进度已更新`;
}

/**
 * 构建每日摘要通知消息
 */
function buildDailyMessage(data: NotifyData): string {
  const { total, completed, percentage } = data.progress || { total: 0, completed: 0, percentage: 0 };
  const remaining = total - completed;
  
  return `📊 **Ralph 项目日报**
━━━━━━━━━━━━━━━━━━━━
📁 项目：${data.project}
📅 日期：${new Date().toLocaleDateString()}

✅ 已完成：${completed}/${total} (${percentage}%)
📋 剩余任务：${remaining} 个`;
}

/**
 * 构建里程碑通知消息
 */
function buildMilestoneMessage(data: NotifyData): string {
  return `🎉 **里程碑达成**
━━━━━━━━━━━━━━━━━━━━
📁 项目：${data.project}
🎯 模块：${data.module}

✅ ${data.module} 模块全部完成！

🚀 进入下一阶段开发`;
}

/**
 * 调用 lark-cli 发送群聊消息 - 真实 API 实现
 * 使用 lark-cli im +messages-send
 */
export async function notifyProgress(
  type: NotificationType,
  data: NotifyData,
  config: FeishuConfig
): Promise<{ success: boolean; message: string }> {
  try {
    // 验证配置
    if (!config.im.chat_id) {
      return {
        success: false,
        message: '❌ 飞书 Chat ID 未配置',
      };
    }
    
    // 根据类型构建消息
    let messageContent: string;
    switch (type) {
      case 'split':
        messageContent = buildSplitMessage(data);
        break;
      case 'complete':
        messageContent = buildCompleteMessage(data);
        break;
      case 'daily':
        messageContent = buildDailyMessage(data);
        break;
      case 'milestone':
        messageContent = buildMilestoneMessage(data);
        break;
      default:
        messageContent = JSON.stringify(data, null, 2);
    }
    
    console.log(`📤 发送${type}通知到飞书群聊...`);
    console.log(`   Chat ID: ${config.im.chat_id}`);
    
    // 调用 lark-cli 发送消息
    // 使用 +messages-send shortcut
    const cmd = `lark-cli im +messages-send --chat-id ${config.im.chat_id} --msg-type text --content '${messageContent}'`;
    console.log('   执行命令:', cmd.substring(0, 100) + '...');
    
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const response = JSON.parse(result);
    
    if (response.ok) {
      console.log('✅ 消息发送成功');
      return {
        success: true,
        message: `通知已发送: ${type}`,
      };
    } else {
      console.error('❌ 消息发送失败:', response);
      return {
        success: false,
        message: `发送失败: ${response.msg || response.error?.message || '未知错误'}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 发送通知失败:', errorMsg);
    return {
      success: false,
      message: `发送失败: ${errorMsg}`,
    };
  }
}

/**
 * 发送自定义消息 - 真实 API 实现
 */
export async function sendCustomMessage(
  message: string,
  config: FeishuConfig
): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.im.chat_id) {
      return {
        success: false,
        message: '❌ 飞书 Chat ID 未配置',
      };
    }
    
    console.log(`📤 发送自定义消息...`);
    
    const cmd = `lark-cli im +messages-send --chat-id ${config.im.chat_id} --msg-type text --content '${message}'`;
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const response = JSON.parse(result);
    
    if (response.ok) {
      return {
        success: true,
        message: '消息已发送',
      };
    } else {
      return {
        success: false,
        message: `发送失败: ${response.msg || response.error?.message || '未知错误'}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `发送失败: ${errorMsg}`,
    };
  }
}

export default {
  notifyProgress,
  sendCustomMessage,
};
