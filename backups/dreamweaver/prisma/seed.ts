import { PrismaClient } from '@prisma/client';
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
  const project = await prisma.project.upsert({
    where: { id: 'test-project-id' },
    update: {},
    create: {
      id: 'test-project-id',
      name: '测试项目',
      description: '这是一个测试项目',
      status: 'active',
      userId: testUser.id,
      currentWordCount: 0,
      targetWordCount: 100000,
    }
  });
  console.log('测试项目创建/更新完成:', project.id);

  // 清除旧角色以避免重复
  await prisma.character.deleteMany({
    where: { projectId: project.id }
  });

  // 创建测试角色
  const char1 = await prisma.character.create({
    data: {
      projectId: project.id,
      name: 'Elena Vance',
      aliases: JSON.stringify(['El', 'Vance']),
      roleType: 'protagonist',
      profile: JSON.stringify({
        age: 28,
        gender: 'female',
        appearance: 'Short dark hair, piercing green eyes. Usually wears a leather jacket.',
        tags: ['Hacker', 'Stubborn', 'Resourceful']
      }),
      wordCount: 45200,
    }
  });

  const char2 = await prisma.character.create({
    data: {
      projectId: project.id,
      name: 'Marcus Thorne',
      roleType: 'antagonist',
      profile: JSON.stringify({
        age: 45,
        gender: 'male',
        appearance: 'Tall, imposing figure. Always in a tailored suit.',
        tags: ['Corporate', 'Ruthless', 'Charismatic']
      }),
      wordCount: 32100,
    }
  });

  const char3 = await prisma.character.create({
    data: {
      projectId: project.id,
      name: 'Sylvia',
      roleType: 'supporting',
      profile: JSON.stringify({
        age: 'Unknown',
        gender: 'female',
        appearance: 'Ethereal glow, silver hair.',
        tags: ['AI', 'Mysterious', 'Guide']
      }),
      wordCount: 18500,
    }
  });
  console.log('测试角色创建完成');

  // 清除旧章节以避免重复
  await prisma.chapter.deleteMany({
    where: { projectId: project.id }
  });

  // 创建测试章节
  await prisma.chapter.createMany({
    data: [
      {
        id: 'test-chapter-2',
        projectId: project.id,
        volumeNumber: 1,
        chapterNumber: 2,
        title: 'Chapter 2: Whispers in the Dark',
        content: '<p>The shadows stretched long across the alleyway. Elena checked her sidearm, feeling the familiar weight. "They\'re coming," a voice whispered in her earpiece.</p><p>She took a deep breath, the damp air of the neon-lit city filling her lungs. This was it. The moment she had been preparing for.</p>',
        status: 'draft',
        wordCount: 2800,
      },
      {
        id: 'test-chapter-1',
        projectId: project.id,
        volumeNumber: 1,
        chapterNumber: 1,
        title: 'Chapter 1: The Awakening',
        content: '<p>Elena woke up with a start. The cold metal of the floor pressing against her cheek was the only thing anchoring her to reality.</p>',
        status: 'published',
        wordCount: 3450,
      },
      {
        id: 'test-chapter-3',
        projectId: project.id,
        volumeNumber: 1,
        chapterNumber: 3,
        title: 'Chapter 3: City of Neon',
        content: '<p>Bright lights blinded her as she stepped out of the shadows. The neon signs flickered, reflecting in the puddles on the street.</p>',
        status: 'draft',
        wordCount: 1200,
      },
      {
        id: 'test-chapter-4',
        projectId: project.id,
        volumeNumber: 1,
        chapterNumber: 4,
        title: 'Chapter 4: The Betrayal',
        content: '',
        status: 'outline',
        wordCount: 0,
      }
    ]
  });
  console.log('测试章节创建完成');

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
