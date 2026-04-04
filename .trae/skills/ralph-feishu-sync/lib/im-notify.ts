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
  return JSON.stringify({
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '📋 任务拆分完成' },
        template: 'blue'
      },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**项目：** ${data.project}` } },
        { tag: 'div', text: { tag: 'lark_md', content: `**任务数：** ${data.taskCount} 个` } },
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: '✅ 已同步到飞书多维表格' } }
      ]
    }
  });
}

/**
 * 构建任务完成通知消息
 */
function buildCompleteMessage(data: NotifyData): string {
  const commitInfo = data.commitHash ? `\n🔖 Commit: \`${data.commitHash}\`` : '';
  
  return JSON.stringify({
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '✅ 任务完成' },
        template: 'green'
      },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**项目：** ${data.project}` } },
        { tag: 'div', text: { tag: 'lark_md', content: `**任务：** ${data.taskDescription?.substring(0, 50)}...${commitInfo}` } },
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: '📊 进度已更新' } }
      ]
    }
  });
}

/**
 * 构建每日摘要通知消息
 */
function buildDailyMessage(data: NotifyData): string {
  const { total, completed, percentage } = data.progress || { total: 0, completed: 0, percentage: 0 };
  const remaining = total - completed;
  
  return JSON.stringify({
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '📊 Ralph 项目日报' },
        template: 'blue'
      },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**项目：** ${data.project}` } },
        { tag: 'div', text: { tag: 'lark_md', content: `**日期：** ${new Date().toLocaleDateString()}` } },
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: `✅ 已完成：${completed}/${total} (${percentage}%)` } },
        { tag: 'div', text: { tag: 'lark_md', content: `📋 剩余任务：${remaining} 个` } }
      ]
    }
  });
}

/**
 * 构建里程碑通知消息
 */
function buildMilestoneMessage(data: NotifyData): string {
  return JSON.stringify({
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '🎉 里程碑达成' },
        template: 'orange'
      },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**项目：** ${data.project}` } },
        { tag: 'div', text: { tag: 'lark_md', content: `**模块：** ${data.module}` } },
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: `✅ ${data.module} 模块全部完成！` } },
        { tag: 'div', text: { tag: 'lark_md', content: '🚀 进入下一阶段开发' } }
      ]
    }
  });
}

/**
 * 调用 lark-cli 发送群聊消息 - 真实 API 实现
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
        messageContent = JSON.stringify({ msg_type: 'text', content: { text: JSON.stringify(data) } });
    }
    
    console.log(`📤 发送${type}通知到飞书群聊...`);
    console.log(`   Chat ID: ${config.im.chat_id}`);
    
    // 调用 lark-cli 发送消息
    const cmd = `lark-cli chat +message-create --receive-id ${config.im.chat_id} --content '${messageContent}'`;
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
        message: `发送失败: ${response.msg || '未知错误'}`,
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
    
    const content = JSON.stringify({
      msg_type: 'text',
      content: { text: message }
    });
    
    console.log(`📤 发送自定义消息...`);
    
    const cmd = `lark-cli chat +message-create --receive-id ${config.im.chat_id} --content '${content}'`;
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
        message: `发送失败: ${response.msg || '未知错误'}`,
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
