import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

describe('User Model', () => {
  beforeAll(async () => {
    // 清理测试数据
    await prisma.userPreferences.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('用户创建', () => {
    it('应该创建基本用户', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test1@example.com',
          passwordHash: await hash('password123', 10),
          nickname: '测试用户1',
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test1@example.com');
      expect(user.nickname).toBe('测试用户1');
      expect(user.subscriptionTier).toBe('free');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('应该自动创建用户偏好记录', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test2@example.com',
          passwordHash: await hash('password123', 10),
          preferences: {
            create: {
              uiLanguage: 'zh',
              writingLanguage: 'zh',
              timezone: 'Asia/Shanghai',
              currency: 'CNY',
              region: 'ap',
            },
          },
        },
        include: {
          preferences: true,
        },
      });

      expect(user.preferences).toBeDefined();
      expect(user.preferences?.uiLanguage).toBe('zh');
      expect(user.preferences?.writingLanguage).toBe('zh');
      expect(user.preferences?.currency).toBe('CNY');
    });

    it('应该自动创建订阅记录', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test3@example.com',
          passwordHash: await hash('password123', 10),
          subscription: {
            create: {
              plan: SubscriptionPlan.free,
              status: SubscriptionStatus.active,
            },
          },
        },
        include: {
          subscription: true,
        },
      });

      expect(user.subscription).toBeDefined();
      expect(user.subscription?.plan).toBe(SubscriptionPlan.free);
      expect(user.subscription?.status).toBe(SubscriptionStatus.active);
    });

    it('应该阻止重复邮箱', async () => {
      const email = 'duplicate@example.com';
      
      await prisma.user.create({
        data: {
          email,
          passwordHash: await hash('password123', 10),
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email,
            passwordHash: await hash('password123', 10),
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('用户偏好默认值', () => {
    it('应该使用正确的默认值', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'defaults@example.com',
          passwordHash: await hash('password123', 10),
          preferences: {
            create: {},
          },
        },
        include: {
          preferences: true,
        },
      });

      expect(user.preferences?.uiLanguage).toBe('zh');
      expect(user.preferences?.writingLanguage).toBe('zh');
      expect(user.preferences?.timezone).toBe('Asia/Shanghai');
      expect(user.preferences?.currency).toBe('CNY');
      expect(user.preferences?.region).toBe('ap');
    });
  });

  describe('订阅状态', () => {
    it('应该支持不同订阅计划', async () => {
      const plans = [
        SubscriptionPlan.free,
        SubscriptionPlan.pro,
        SubscriptionPlan.studio,
        SubscriptionPlan.team,
      ];

      for (const plan of plans) {
        const user = await prisma.user.create({
          data: {
            email: `${plan}@example.com`,
            passwordHash: await hash('password123', 10),
            subscription: {
              create: {
                plan,
                status: SubscriptionStatus.active,
              },
            },
          },
          include: {
            subscription: true,
          },
        });

        expect(user.subscription?.plan).toBe(plan);
      }
    });
  });

  describe('用户查询', () => {
    it('应该能通过邮箱查询用户', async () => {
      const email = 'findbyemail@example.com';
      await prisma.user.create({
        data: {
          email,
          passwordHash: await hash('password123', 10),
        },
      });

      const found = await prisma.user.findUnique({
        where: { email },
      });

      expect(found).toBeDefined();
      expect(found?.email).toBe(email);
    });

    it('应该能查询用户及其关联数据', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'withrelations@example.com',
          passwordHash: await hash('password123', 10),
          preferences: {
            create: {
              uiLanguage: 'en',
              writingLanguage: 'en',
            },
          },
          subscription: {
            create: {
              plan: SubscriptionPlan.pro,
              status: SubscriptionStatus.active,
            },
          },
        },
        include: {
          preferences: true,
          subscription: true,
        },
      });

      expect(user.preferences).toBeDefined();
      expect(user.subscription).toBeDefined();
    });
  });

  describe('用户更新', () => {
    it('应该能更新用户信息', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          passwordHash: await hash('password123', 10),
          nickname: '旧昵称',
        },
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { nickname: '新昵称' },
      });

      expect(updated.nickname).toBe('新昵称');
    });

    it('应该能更新用户偏好', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'updateprefs@example.com',
          passwordHash: await hash('password123', 10),
          preferences: {
            create: {
              uiLanguage: 'zh',
            },
          },
        },
        include: {
          preferences: true,
        },
      });

      const updated = await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { uiLanguage: 'en' },
      });

      expect(updated.uiLanguage).toBe('en');
    });
  });

  describe('级联删除', () => {
    it('删除用户应该同时删除偏好和订阅', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'cascade@example.com',
          passwordHash: await hash('password123', 10),
          preferences: {
            create: {},
          },
          subscription: {
            create: {
              plan: SubscriptionPlan.free,
              status: SubscriptionStatus.active,
            },
          },
        },
        include: {
          preferences: true,
          subscription: true,
        },
      });

      const prefId = user.preferences?.id;
      const subId = user.subscription?.id;

      await prisma.user.delete({
        where: { id: user.id },
      });

      const pref = await prisma.userPreferences.findUnique({
        where: { id: prefId },
      });
      const sub = await prisma.subscription.findUnique({
        where: { id: subId },
      });

      expect(pref).toBeNull();
      expect(sub).toBeNull();
    });
  });
});
