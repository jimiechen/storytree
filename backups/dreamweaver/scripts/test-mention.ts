/**
 * TC-008 & TC-009: @消息处理和评审文档测试
 */

import { loadConfig } from './.trae/skills/ralph-feishu-sync/lib/config';
import { handleMention, MentionMessage } from './.trae/skills/ralph-feishu-sync/lib/mention-handler';
import { saveReviewDoc, readReviewDoc, updateReviewStatus, listReviewDocs } from './.trae/skills/ralph-feishu-sync/lib/review-sync';

async function main() {
  console.log('🧪 TC-008 & TC-009: @消息处理和评审文档测试\n');

  const config = loadConfig();

  // TC-008: @消息处理测试
  console.log('📨 TC-008: @消息处理测试');
  
  const testMessage: MentionMessage = {
    messageId: 'test-msg-001',
    content: '@机器人 请评审这个需求：添加用户登录功能，需要支持邮箱和密码登录',
    sender: { id: 'user-001', name: '张三' },
    chatId: 'oc_9f741c1f2d5b1fc1e98a0b42c04283c5',
    chatName: '开发群',
    timestamp: new Date().toISOString(),
  };

  console.log('1️⃣ 处理@消息...');
  console.log('   发送人:', testMessage.sender.name);
  console.log('   内容:', testMessage.content.substring(0, 50) + '...');
  
  const mentionResult = await handleMention(testMessage, config);
  console.log('\n   ✅ 处理完成');
  console.log('   评审ID:', mentionResult.reviewId);
  console.log('   评审路径:', mentionResult.reviewPath);

  // TC-009: 评审文档管理测试
  console.log('\n📝 TC-009: 评审文档管理测试');
  
  const testReviewPath = 'docs/reviews/test-review-001.md';
  const testReviewContent = `# 测试评审文档

## 基本信息
- 来源: 测试
- 时间: ${new Date().toISOString()}

## 内容
测试评审内容

## 处理状态
- [ ] 已确认
- [ ] 已采纳
- [ ] 已拒绝
- [ ] 已转需求
- [ ] 已转任务

## 后续讨论
`;

  console.log('1️⃣ 保存评审文档...');
  const saveResult = await saveReviewDoc(testReviewPath, testReviewContent);
  console.log('   结果:', saveResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', saveResult.message);

  console.log('\n2️⃣ 读取评审文档...');
  const readContent = readReviewDoc(testReviewPath);
  console.log('   结果:', readContent ? '✅ 成功' : '❌ 失败');
  if (readContent) {
    console.log('   内容长度:', readContent.length, '字符');
  }

  console.log('\n3️⃣ 更新评审状态...');
  const updateResult = await updateReviewStatus(
    testReviewPath,
    '已确认',
    '测试通过，可以开始开发'
  );
  console.log('   结果:', updateResult.success ? '✅ 成功' : '❌ 失败');
  console.log('   消息:', updateResult.message);

  console.log('\n4️⃣ 列出评审文档...');
  const docs = listReviewDocs('docs/reviews/');
  console.log('   文档数量:', docs.length);
  docs.forEach((doc, index) => {
    console.log(`   ${index + 1}. ${doc.name} (${new Date(doc.date).toLocaleDateString()})`);
  });

  console.log('\n✅ Phase 3 测试完成');
}

main();
