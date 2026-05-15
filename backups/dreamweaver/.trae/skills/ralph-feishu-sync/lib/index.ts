/**
 * Ralph Feishu Sync - 主入口模块
 * 
 * 提供以下功能：
 * - 配置加载
 * - Git 操作 (pull/commit)
 * - 任务同步到飞书多维表格
 * - 群聊通知
 * - @消息处理与评审
 */

import { loadConfig, FeishuConfig } from './config';
import { gitPull, gitCommit, GitCommitResult } from './git-helper';
import { parseTasks, TaskItem } from './parser';
import { syncTasksToBase, syncTaskComplete } from './base-sync';
import { notifyProgress, NotificationType } from './im-notify';
import { handleMention, MentionMessage } from './mention-handler';
import { saveReviewDoc } from './review-sync';

export {
  // 配置
  loadConfig,
  FeishuConfig,
  
  // Git 操作
  gitPull,
  gitCommit,
  GitCommitResult,
  
  // 任务解析
  parseTasks,
  TaskItem,
  
  // 多维表格同步
  syncTasksToBase,
  syncTaskComplete,
  
  // 通知
  notifyProgress,
  NotificationType,
  
  // @消息处理
  handleMention,
  MentionMessage,
  saveReviewDoc,
};

/**
 * 初始化飞书同步模块
 */
export async function initialize(): Promise<{
  config: FeishuConfig | null;
  enabled: boolean;
}> {
  const config = loadConfig();
  
  if (!config.enabled) {
    console.log('ℹ️ 飞书集成未启用，跳过初始化');
    return { config: null, enabled: false };
  }
  
  console.log('✅ 飞书集成已启用');
  console.log(`   项目: ${config.project.name}`);
  console.log(`   Base: ${config.base.app_token ? '已配置' : '未配置'}`);
  console.log(`   Chat: ${config.im.chat_id ? '已配置' : '未配置'}`);
  
  return { config, enabled: true };
}

/**
 * 同步任务拆分结果到飞书
 */
export async function syncTasksSplit(
  taskFile: string = '04-ralph-tasks.md',
  projectName?: string
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const config = loadConfig();
    
    if (!config.enabled) {
      return { success: true, count: 0, message: '飞书集成未启用' };
    }
    
    // 解析任务文件
    const tasks = parseTasks(taskFile);
    
    if (tasks.length === 0) {
      return { success: true, count: 0, message: '未找到任务' };
    }
    
    // 同步到飞书 Base
    const project = projectName || config.project.name;
    await syncTasksToBase(tasks, project, config);
    
    // 发送通知
    if (config.im.notify_on.task_split) {
      await notifyProgress('split', {
        project: project,
        taskCount: tasks.length,
      }, config);
    }
    
    return {
      success: true,
      count: tasks.length,
      message: `✅ 已同步 ${tasks.length} 个任务到飞书多维表格`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 任务同步失败:', errorMsg);
    return {
      success: false,
      count: 0,
      message: `⚠️ 飞书同步失败: ${errorMsg}`,
    };
  }
}

/**
 * 同步任务完成状态到飞书
 */
export async function syncTaskCompleteWithNotify(
  taskDescription: string,
  commitHash?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = loadConfig();
    
    if (!config.enabled) {
      return { success: true, message: '飞书集成未启用' };
    }
    
    // 更新飞书 Base
    await syncTaskComplete(taskDescription, commitHash, config);
    
    // 发送通知
    if (config.im.notify_on.task_complete) {
      await notifyProgress('complete', {
        taskDescription,
        commitHash,
      }, config);
    }
    
    return {
      success: true,
      message: '✅ 任务完成状态已同步到飞书',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 任务完成同步失败:', errorMsg);
    return {
      success: false,
      message: `⚠️ 同步失败: ${errorMsg}`,
    };
  }
}

/**
 * 处理飞书@消息
 */
export async function processMention(
  message: MentionMessage
): Promise<{ success: boolean; reviewId?: string; message: string }> {
  try {
    const config = loadConfig();
    
    if (!config.enabled || !config.im.mention_listen) {
      return { success: true, message: '@消息监听未启用' };
    }
    
    // 检查关键词
    const keywords = config.im.mention_keywords;
    const hasKeyword = keywords.some(kw => 
      message.content.toLowerCase().includes(kw.toLowerCase())
    );
    
    if (!hasKeyword) {
      return { success: true, message: '消息不包含关键词，跳过处理' };
    }
    
    // 处理消息
    const result = await handleMention(message, config);
    
    return {
      success: true,
      reviewId: result.reviewId,
      message: `✅ 已处理@消息，评审文档: ${result.reviewPath}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ @消息处理失败:', errorMsg);
    return {
      success: false,
      message: `⚠️ 处理失败: ${errorMsg}`,
    };
  }
}

// 默认导出
export default {
  initialize,
  syncTasksSplit,
  syncTaskCompleteWithNotify,
  processMention,
  gitPull,
  gitCommit,
};
