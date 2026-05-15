/**
 * 飞书集成真实 API 测试
 * 验证所有功能使用真实 API 调用
 */

import { syncTasksToBase, syncTaskComplete } from './lib/base-sync.js';
import { notifyProgress, sendCustomMessage } from './lib/im-notify.js';
import { handleMention } from './lib/mention-handler.js';
import { loadConfig } from './lib/config.js';
import parser from './lib/parser.js';
import type { TaskItem } from './lib/parser.js';

const testTasks: TaskItem[] = [
  {
    id: 'RALPH-storytree2-AUTH-001',
    description: '配置 NextAuth.js 基础环境',
    module: 'Auth Module',
    submodule: '用户认证',
    status: 'pending',
    lineNumber: 1,
    priority: 'P0',
    estimatedHours: 0.5,
  },
  {
    id: 'RALPH-storytree2-AUTH-002',
    description: '配置数据库连接',
    module: 'Auth Module',
    submodule: '用户认证',
    status: 'in_progress',
    lineNumber: 2,
    priority: 'P0',
    estimatedHours: 0.5,
  },
  {
    id: 'RALPH-storytree2-AUTH-003',
    description: '实现用户登录接口',
    module: 'Auth Module',
    submodule: '用户认证',
    status: 'completed',
    lineNumber: 3,
    priority: 'P1',
    estimatedHours: 1.5,
  },
];

async function testBaseSync() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试 1: 多维表格同步 (Base Sync)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const config = loadConfig();

  console.log(`📋 准备同步 ${testTasks.length} 个任务`);
  testTasks.forEach((t: TaskItem) => console.log(`   - ${t.id}: ${t.description} [${t.status}]`));

  const result = await syncTasksToBase(testTasks, 'storytree2', config);
  console.log('\n📊 结果:', result);
  return result.success;
}

async function testTaskComplete() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试 2: 任务完成状态更新');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const config = loadConfig();
  const result = await syncTaskComplete('配置 NextAuth.js 基础环境', 'abc1234', config);
  console.log('📊 结果:', result);
  return result.success;
}

async function testIMNotifications() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试 3: 群聊通知 (IM Notify)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const config = loadConfig();

  // 测试任务拆分通知
  console.log('📤 发送任务拆分通知...');
  const splitResult = await notifyProgress('split', {
    project: 'storytree2',
    taskCount: 3,
  }, config);
  console.log('   结果:', splitResult);

  // 等待一下避免频率限制
  await new Promise(r => setTimeout(r, 1000));

  // 测试任务完成通知
  console.log('\n📤 发送任务完成通知...');
  const completeResult = await notifyProgress('complete', {
    project: 'storytree2',
    taskDescription: '配置 NextAuth.js 基础环境',
    commitHash: 'abc1234',
  }, config);
  console.log('   结果:', completeResult);

  // 等待一下
  await new Promise(r => setTimeout(r, 1000));

  // 测试每日摘要通知
  console.log('\n📤 发送每日摘要通知...');
  const dailyResult = await notifyProgress('daily', {
    project: 'storytree2',
    progress: { total: 10, completed: 3, percentage: 30 },
  }, config);
  console.log('   结果:', dailyResult);

  return splitResult.success && completeResult.success && dailyResult.success;
}

async function testMentionHandler() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试 4: @消息处理');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const config = loadConfig();

  const testMessage = {
    messageId: 'test-msg-001',
    content: '@Ralph 请评审这个需求：添加用户认证功能，需要支持邮箱登录和微信登录',
    sender: {
      id: 'ou_123456',
      name: '张三',
    },
    chatId: config.im.chat_id || 'test-chat',
    chatName: '开发群',
    timestamp: Date.now().toString(),
  };

  console.log('📨 模拟@消息:', testMessage.content.substring(0, 50) + '...');

  try {
    const result = await handleMention(testMessage, config);
    console.log('✅ 评审文档生成成功');
    console.log('   评审ID:', result.reviewId);
    console.log('   文档路径:', result.reviewPath);
    console.log('\n📤 自动回复内容预览:');
    console.log(result.message);
    return true;
  } catch (error) {
    console.error('❌ 处理失败:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Ralph 飞书集成 - 真实 API 验收测试                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    baseSync: await testBaseSync(),
    taskComplete: await testTaskComplete(),
    imNotify: await testIMNotifications(),
    mentionHandler: await testMentionHandler(),
  };

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      测试结果汇总                          ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  多维表格同步    ${results.baseSync ? '✅ 通过' : '❌ 失败'}                    ║`);
  console.log(`║  任务完成更新    ${results.taskComplete ? '✅ 通过' : '❌ 失败'}                    ║`);
  console.log(`║  群聊通知        ${results.imNotify ? '✅ 通过' : '❌ 失败'}                    ║`);
  console.log(`║  @消息处理       ${results.mentionHandler ? '✅ 通过' : '❌ 失败'}                    ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');

  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('║  ✅ 所有测试通过！飞书集成验收成功！                       ║');
  } else {
    console.log('║  ⚠️ 部分测试失败，请检查配置和日志                         ║');
  }
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
