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
          plan: SubscriptionPlan.free,
          status: SubscriptionStatus.active,
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
          plan: SubscriptionPlan.pro,
          status: SubscriptionStatus.active,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log('Pro 用户创建完成:', proUser.id);

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
