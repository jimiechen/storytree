/**
 * TC-004: 任务解析测试
 */

import { parseTasks, calculateProgress, groupTasksByModule } from './.trae/skills/ralph-feishu-sync/lib/parser';

async function main() {
  console.log('🧪 TC-004: 任务解析测试\n');

  // 测试任务解析
  console.log('1️⃣ 测试 parseTasks()...');
  const tasks = parseTasks('04-ralph-tasks.md', 'storytree2');
  
  console.log('✅ 解析完成');
  console.log('   任务总数:', tasks.length);
  
  if (tasks.length > 0) {
    console.log('\n   第一个任务示例:');
    console.log('   - ID:', tasks[0].id);
    console.log('   - 描述:', tasks[0].description.substring(0, 50) + '...');
    console.log('   - 模块:', tasks[0].module);
    console.log('   - 状态:', tasks[0].status);
    console.log('   - 优先级:', tasks[0].priority);
    console.log('   - 预估工时:', tasks[0].estimatedHours);
    console.log('   - 行号:', tasks[0].lineNumber);
  }

  // 测试进度计算
  console.log('\n2️⃣ 测试 calculateProgress()...');
  const progress = calculateProgress(tasks);
  console.log('✅ 进度统计:');
  console.log('   总数:', progress.total);
  console.log('   已完成:', progress.completed);
  console.log('   进行中:', progress.inProgress);
  console.log('   已阻塞:', progress.blocked);
  console.log('   待开始:', progress.pending);
  console.log('   完成率:', progress.percentage + '%');

  // 测试按模块分组
  console.log('\n3️⃣ 测试 groupTasksByModule()...');
  const groups = groupTasksByModule(tasks);
  console.log('✅ 模块分组:');
  Object.entries(groups).forEach(([module, moduleTasks]) => {
    console.log(`   ${module}: ${moduleTasks.length} 个任务`);
  });

  console.log('\n✅ TC-004 测试完成');
}

main();
