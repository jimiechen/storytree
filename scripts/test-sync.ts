/**
 * TC-005, TC-006, TC-007: 同步和通知测试
 */

import { loadConfig } from './.trae/skills/ralph-feishu-sync/lib/config';
import { parseTasks } from './.trae/skills/ralph-feishu-sync/lib/parser';
import { syncTasksToBase, syncTaskComplete } from './.trae/skills/ralph-feishu-sync/lib/base-sync';
import { notifyProgress } from './.trae/skills/ralph-feishu-sync/lib/im-notify';

async function main() {
  console.log('🧪 TC-005, TC-006, TC-007: 同步和通知测试\n');

  // 加载配置
  const config = loadConfig();
  console.log('✅ 配置加载完成');
  console.log('   飞书启用:', config.enabled);
  console.log('   Chat ID:', config.im.chat_id);

  // TC-005: 任务拆分同步测试
  console.log('\n📋 TC-005: 任务拆分同步测试');
  console.log('1️⃣ 解析任务...');
  const tasks = parseTasks('04-ralph-tasks.md', 'storytree2');
  console.log('   任务数:', tasks.length);

  console.log('\n2️⃣ 同步任务到飞书 Base...');
  const syncResult = await syncTasksToBase(tasks, 'storytree2', config);
  console.log('   结果:', syncResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', syncResult.message);

  // TC-007: 群聊通知测试
  console.log('\n📢 TC-007: 群聊通知测试');
  console.log('1️⃣ 发送任务拆分通知...');
  const notifyResult = await notifyProgress('split', {
    project: 'storytree2',
    taskCount: tasks.length,
  }, config);
  console.log('   结果:', notifyResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', notifyResult.message);

  console.log('\n2️⃣ 发送任务完成通知...');
  const completeNotifyResult = await notifyProgress('complete', {
    project: 'storytree2',
    taskDescription: '配置 NextAuth.js 基础环境',
    commitHash: 'abc1234',
  }, config);
  console.log('   结果:', completeNotifyResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', completeNotifyResult.message);

  // TC-006: 任务完成同步测试
  console.log('\n✅ TC-006: 任务完成同步测试');
  console.log('1️⃣ 更新任务完成状态...');
  const completeResult = await syncTaskComplete(
    '配置 NextAuth.js 基础环境',
    'abc1234',
    config
  );
  console.log('   结果:', completeResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', completeResult.message);

  console.log('\n✅ Phase 2 测试完成');
}

main();
