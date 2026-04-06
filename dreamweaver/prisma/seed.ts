import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: await hash('password123', 10),
      nickname: '测试用户',
      subscriptionTier: 'free',
      preferences: {
        create: {
          uiLanguage: 'zh',
          writingLanguage: 'zh',
          timezone: 'Asia/Shanghai',
          currency: 'CNY',
          region: 'ap',
        },
      },
      subscription: {
        create: {
          plan: "free",
          status: "active",
        },
      },
    },
  });

  console.log('测试用户创建完成:', testUser.id);

  // 创建 Pro 用户
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@example.com' },
    update: {},
    create: {
      email: 'pro@example.com',
      passwordHash: await hash('password123', 10),
      nickname: 'Pro 用户',
      subscriptionTier: 'pro',
      preferences: {
        create: {
          uiLanguage: 'en',
          writingLanguage: 'en',
          timezone: 'America/New_York',
          currency: 'USD',
          region: 'us',
        },
      },
      subscription: {
        create: {
          plan: "pro",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log('Pro 用户创建完成:', proUser.id);

  // 创建测试项目
  const project = await prisma.project.create({
    data: {
      id: 'test-project-id',
      name: '测试项目',
      description: '这是一个测试项目',
      status: 'active',
      userId: testUser.id,
      currentWordCount: 0,
      targetWordCount: 100000,
    }
  });
  console.log('测试项目创建完成:', project.id);

  // 创建测试章节
  const chapter = await prisma.chapter.create({
    data: {
      id: 'test-chapter-id',
      projectId: project.id,
      volumeNumber: 1,
      chapterNumber: 1,
      title: '第一章：测试',
      content: '这是第一章的内容。',
      status: 'draft',
      wordCount: 9,
    }
  });
  console.log('测试章节创建完成:', chapter.id);

  console.log('种子数据完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
