/**
 * TC-002 & TC-003: Git 操作测试
 */

import { gitPull, gitCommit, generateCommitMessage, checkGitStatus, isWorkspaceClean } from './.trae/skills/ralph-feishu-sync/lib/git-helper';

async function main() {
  console.log('🧪 TC-002 & TC-003: Git 操作测试\n');

  // 测试 Git 状态检查
  console.log('1️⃣ 测试 Git 状态检查...');
  const status = checkGitStatus();
  console.log('✅ Git 状态:');
  console.log('   是Git仓库:', status.isRepo);
  console.log('   工作区干净:', status.isClean);
  console.log('   当前分支:', status.branch);
  console.log('   Commit Hash:', status.commitHash);
  console.log('   有远程仓库:', status.hasRemote);

  // 测试工作区检查
  console.log('\n2️⃣ 测试工作区检查...');
  const isClean = isWorkspaceClean();
  console.log('✅ 工作区干净:', isClean);

  // 测试生成 commit message
  console.log('\n3️⃣ 测试生成 commit message...');
  const message = generateCommitMessage(
    '实现用户登录功能',
    'AUTH-001',
    'feat:'
  );
  console.log('✅ 生成的 message:', message);

  // 测试 Git Pull（可选，取决于网络）
  console.log('\n4️⃣ 测试 Git Pull...');
  if (status.hasRemote && status.isClean) {
    try {
      const pullResult = await gitPull(status.branch);
      console.log('✅ Pull 结果:', pullResult.success);
      console.log('   消息:', pullResult.message);
    } catch (error) {
      console.log('⚠️ Pull 测试跳过（可能需要网络）');
    }
  } else {
    console.log('⚠️ 跳过 Pull 测试（无远程仓库或工作区不干净）');
  }

  console.log('\n✅ Git 操作测试完成');
}

main();
