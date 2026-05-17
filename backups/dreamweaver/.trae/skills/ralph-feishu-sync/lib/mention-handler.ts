/**
 * @消息处理模块
 * 处理飞书群聊中的@消息，生成评审文档
 */

import * as crypto from 'crypto';
import { FeishuConfig } from './config';

export interface MentionMessage {
  messageId: string;
  content: string;
  sender: {
    id: string;
    name: string;
  };
  chatId: string;
  chatName?: string;
  timestamp: string;
}

export interface ReviewResult {
  reviewId: string;
  reviewPath: string;
  message: string;
}

/**
 * 提取关键词
 */
function extractKeywords(content: string): string[] {
  const keywords: string[] = [];
  const patterns = [
    /\b(API|接口|路由|endpoint)\b/gi,
    /\b(UI|界面|页面|组件|样式)\b/gi,
    /\b(数据库|表|字段|schema)\b/gi,
    /\b(认证|登录|权限|auth)\b/gi,
    /\b(性能|优化|缓存|cache)\b/gi,
    /\b(安全|加密|漏洞|xss|csrf)\b/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      keywords.push(...matches);
    }
  });
  
  return [...new Set(keywords)];
}

/**
 * 判断评审类型
 */
function detectReviewType(content: string): string {
  const lower = content.toLowerCase();
  
  if (lower.includes('需求') || lower.includes('requirement') || lower.includes('prd')) {
    return '需求评审';
  }
  if (lower.includes('代码') || lower.includes('code') || lower.includes('pr ') || lower.includes('pull request')) {
    return '代码评审';
  }
  if (lower.includes('设计') || lower.includes('design') || lower.includes('架构')) {
    return '设计评审';
  }
  if (lower.includes('问题') || lower.includes('issue') || lower.includes('bug')) {
    return '问题反馈';
  }
  
  return '综合评审';
}

/**
 * 生成评审ID
 */
function generateReviewId(senderId: string, timestamp: string): string {
  const hash = crypto
    .createHash('md5')
    .update(`${senderId}-${timestamp}`)
    .digest('hex')
    .substring(0, 8);
  return `REV-${hash}`;
}

/**
 * 生成评审文档路径
 */
function generateReviewPath(
  config: FeishuConfig,
  senderName: string,
  reviewId: string
): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const safeSenderName = senderName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  const basePath = config.im.review_doc_path || 'docs/reviews/';
  
  return `${basePath}review-${date}-${safeSenderName}-${reviewId}.md`;
}

/**
 * 生成评审意见（模拟）
 */
function generateReviewComments(content: string, reviewType: string): string {
  const comments: string[] = [];
  
  // 基于内容生成评审意见
  if (content.length < 20) {
    comments.push('- ⚠️ 描述过于简短，建议提供更详细的信息');
  }
  
  if (!content.includes('为什么') && !content.includes('目的') && !content.includes('背景')) {
    comments.push('- 💡 建议补充需求背景或问题原因');
  }
  
  if (content.includes('添加') || content.includes('新增') || content.includes('实现')) {
    comments.push('- ✅ 建议评估实现复杂度，考虑是否需要拆分任务');
  }
  
  if (content.includes('修改') || content.includes('变更') || content.includes('调整')) {
    comments.push('- ⚠️ 变更类需求建议评估对现有功能的影响范围');
  }
  
  if (reviewType === '代码评审') {
    comments.push('- 🔍 代码评审要点：\n  - 代码规范是否符合项目约定\n  - 是否有足够的单元测试覆盖\n  - 性能影响评估');
  }
  
  if (reviewType === '需求评审') {
    comments.push('- 📋 需求评审要点：\n  - 需求描述是否清晰完整\n  - 验收标准是否明确\n  - 与现有功能的兼容性');
  }
  
  if (comments.length === 0) {
    comments.push('- ✅ 内容描述清晰，建议进入下一步处理');
  }
  
  return comments.join('\n');
}

/**
 * 生成回复消息
 */
function generateReplyMessage(
  reviewId: string,
  reviewType: string,
  keywords: string[]
): string {
  let reply = `📋 **评审已创建**
━━━━━━━━━━━━━━━━━━━━
🆔 评审ID: ${reviewId}
📌 类型: ${reviewType}`;
  
  if (keywords.length > 0) {
    reply += `\n🔑 关键词: ${keywords.join(', ')}`;
  }
  
  reply += `\n\n✅ 评审意见已生成并保存到开发文档\n👤 请相关负责人查看并处理`;
  
  return reply;
}

/**
 * 处理@消息
 */
export async function handleMention(
  message: MentionMessage,
  config: FeishuConfig
): Promise<ReviewResult> {
  try {
    console.log(`📨 处理@消息...`);
    console.log(`   发送人: ${message.sender.name}`);
    console.log(`   内容: ${message.content.substring(0, 100)}...`);
    
    // 生成评审ID
    const reviewId = generateReviewId(message.sender.id, message.timestamp);
    
    // 提取信息
    const keywords = extractKeywords(message.content);
    const reviewType = detectReviewType(message.content);
    
    // 生成评审文档路径
    const reviewPath = generateReviewPath(config, message.sender.name, reviewId);
    
    // 生成评审意见
    const reviewComments = generateReviewComments(message.content, reviewType);
    
    // 构建评审文档内容
    const reviewContent = `# 评审记录: ${reviewId}

## 基本信息

| 项目 | 内容 |
|-----|------|
| 来源 | 飞书群聊 |
| 群聊 | ${message.chatName || '未知'} |
| 发送人 | ${message.sender.name} (${message.sender.id}) |
| 接收时间 | ${new Date(message.timestamp).toISOString()} |
| 处理时间 | ${new Date().toISOString()} |

## 原始消息

> ${message.content}

## 内容解析

### 类型判断
- [x] ${reviewType}

### 关键词提取
${keywords.length > 0 ? keywords.join(', ') : '无'}

## 自动评审意见

${reviewComments}

## 建议处理方案

1. 确认需求/问题的完整性和准确性
2. 评估实现复杂度和工作量
3. 分配相关负责人跟进处理
4. 更新任务状态到多维表格

## 处理状态

- [ ] 已确认
- [ ] 已采纳
- [ ] 已拒绝
- [ ] 已转需求
- [ ] 已转任务

## 关联文档

- 评审文档: ${reviewPath}
- 任务记录: [多维表格链接]

## 回复记录

### 自动回复 (${new Date().toLocaleString()})
${generateReplyMessage(reviewId, reviewType, keywords)}

### 后续讨论
（待补充）

---
*由 Ralph 飞书集成系统自动生成*
`;
    
    // 这里应该保存评审文档到文件系统
    // await saveReviewDocument(reviewPath, reviewContent);
    
    console.log(`✅ 评审文档已生成: ${reviewPath}`);
    
    // 生成回复消息
    const replyMessage = generateReplyMessage(reviewId, reviewType, keywords);
    
    // 这里应该调用飞书 API 发送回复
    // await sendFeishuReply(message.chatId, replyMessage, message.messageId);
    
    console.log('📤 自动回复内容:');
    console.log(replyMessage);
    
    return {
      reviewId,
      reviewPath,
      message: replyMessage,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 处理@消息失败:', errorMsg);
    throw error;
  }
}

export default {
  handleMention,
};
