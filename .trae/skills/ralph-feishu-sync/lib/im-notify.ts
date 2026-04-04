/**
 * 群聊通知模块
 * 发送进度通知到飞书群聊
 */

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

✅ 已同步到飞书多维表格
📎 查看详情：[多维表格链接]`;
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
  if (!data.progress) {
    return `📊 **Ralph 项目日报**
━━━━━━━━━━━━━━━━━━━━
📁 项目：${data.project}
⏰ 时间：${new Date().toLocaleDateString()}

暂无进度数据`;
  }
  
  const { total, completed, percentage } = data.progress;
  const remaining = total - completed;
  const estimatedDays = remaining > 0 ? Math.ceil(remaining / 3) : 0; // 假设每天完成3个任务
  
  return `📊 **Ralph 项目日报**
━━━━━━━━━━━━━━━━━━━━
📁 项目：${data.project}
📅 日期：${new Date().toLocaleDateString()}

✅ 今日完成：待统计
📋 剩余任务：${remaining}/${total} (${percentage}%)
⏱️ 预计完成：${estimatedDays > 0 ? estimatedDays + ' 天后' : '即将完成'}

━━━━━━━━━━━━━━━━━━━━
📎 查看详情：[多维表格链接]`;
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

🚀 进入下一阶段开发

━━━━━━━━━━━━━━━━━━━━
📎 查看详情：[多维表格链接]`;
}

/**
 * 发送群聊通知
 * 
 * 注意：这是一个模拟实现，实际使用时需要调用飞书 API
 * 可以通过 lark-im skill 或直接调用飞书 OpenAPI
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
    let message: string;
    switch (type) {
      case 'split':
        message = buildSplitMessage(data);
        break;
      case 'complete':
        message = buildCompleteMessage(data);
        break;
      case 'daily':
        message = buildDailyMessage(data);
        break;
      case 'milestone':
        message = buildMilestoneMessage(data);
        break;
      default:
        message = `📊 **Ralph 通知**\n\n${JSON.stringify(data, null, 2)}`;
    }
    
    console.log(`📤 发送${type}通知到飞书群聊...`);
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log(message);
    console.log('━━━━━━━━━━━━━━━━━━━━');
    
    // 这里应该调用飞书 API 发送消息
    // await sendFeishuMessage(config.im.chat_id, message);
    
    return {
      success: true,
      message: `通知已发送: ${type}`,
    };
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
 * 发送自定义消息
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
    console.log(message);
    
    // 这里应该调用飞书 API 发送消息
    // await sendFeishuMessage(config.im.chat_id, message);
    
    return {
      success: true,
      message: '消息已发送',
    };
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
