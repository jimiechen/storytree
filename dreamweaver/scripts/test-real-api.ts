/**
 * 真实飞书 API 测试
 */

import { loadConfig } from './.trae/skills/ralph-feishu-sync/lib/config';
import { parseTasks } from './.trae/skills/ralph-feishu-sync/lib/parser';
import { syncTasksToBase, syncTaskComplete } from './.trae/skills/ralph-feishu-sync/lib/base-sync';
import { notifyProgress } from './.trae/skills/ralph-feishu-sync/lib/im-notify';

async function main() {
  console.log('🚀 真实飞书 API 测试\n');
  console.log('=====================================\n');

  // 加载配置
  const config = loadConfig();
  console.log('✅ 配置加载完成');
  console.log('   飞书启用:', config.enabled);
  console.log('   Base Token:', config.base.app_token);
  console.log('   Table ID:', config.base.table_id);
  console.log('   Chat ID:', config.im.chat_id);

  if (!config.enabled) {
    console.log('\n❌ 飞书集成未启用，跳过测试');
    return;
  }

  // 测试 1: 发送群聊消息
  console.log('\n📢 测试 1: 发送群聊消息');
  const notifyResult = await notifyProgress('split', {
    project: 'storytree2',
    taskCount: 3,
  }, config);
  console.log('   结果:', notifyResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', notifyResult.message);

  // 测试 2: 同步任务到多维表格
  console.log('\n📋 测试 2: 同步任务到多维表格');
  const tasks = parseTasks('04-ralph-tasks.md', 'storytree2');
  console.log('   解析到任务数:', tasks.length);
  
  // 只同步前3个任务进行测试
  const testTasks = tasks.slice(0, 3);
  console.log('   测试同步前3个任务...');
  
  const syncResult = await syncTasksToBase(testTasks, 'storytree2', config);
  console.log('   结果:', syncResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', syncResult.message);

  // 测试 3: 更新任务完成状态
  if (syncResult.success && testTasks.length > 0) {
    console.log('\n✅ 测试 3: 更新任务完成状态');
    const completeResult = await syncTaskComplete(
      testTasks[0].description,
      '271ae43',
      config
    );
    console.log('   结果:', completeResult.success ? '✅ 成功' : '❌ 失败');
    console.log('   消息:', completeResult.message);
  }

  console.log('\n=====================================');
  console.log('✅ 真实 API 测试完成');
  console.log('\n请检查：');
  console.log('   1. 飞书群聊是否收到消息');
  console.log('   2. 多维表格是否添加了任务记录');
  console.log('   3. 第一个任务状态是否更新为"已完成"');
}

main().catch(console.error);
