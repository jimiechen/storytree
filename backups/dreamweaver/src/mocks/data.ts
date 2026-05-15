import { faker } from '@faker-js/faker';
import type { Character, WorldSetting } from '@/types/knowledge';

export const generateMockUser = () => ({
  userId: faker.string.uuid(),
  email: faker.internet.email(),
  username: faker.person.firstName(),
});

export const generateMockProject = () => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  status: faker.helpers.arrayElement(['active', 'draft', 'completed']),
  chapterCount: faker.number.int({ min: 0, max: 20 }),
  wordCount: faker.number.int({ min: 0, max: 100000 }),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});

export const generateMockChapter = (order: number) => ({
  id: faker.string.uuid(),
  title: `第${order}章 ${faker.lorem.words(2)}`,
  content: faker.lorem.paragraphs(5),
  order,
  wordCount: faker.number.int({ min: 1000, max: 5000 }),
  status: 'draft',
});

export const generateMockCharacter = (projectId: string): Character => ({
  id: faker.string.uuid(),
  projectId,
  name: faker.person.fullName(),
  aliases: [faker.person.firstName(), faker.person.lastName()],
  age: faker.number.int({ min: 18, max: 60 }),
  gender: faker.helpers.arrayElement(['male', 'female', 'other', 'unknown']),
  occupation: faker.person.jobTitle(),
  appearance: faker.lorem.paragraph(),
  personality: faker.lorem.sentence(),
  backstory: faker.lorem.paragraphs(2),
  goals: faker.lorem.sentence(),
  relationships: [],
  notes: faker.lorem.paragraph(),
  status: 'active',
  tags: [faker.word.sample(), faker.word.sample()],
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});

export const generateMockWorldSetting = (projectId: string): WorldSetting => ({
  id: faker.string.uuid(),
  projectId,
  title: faker.lorem.words(3),
  category: faker.helpers.arrayElement(['geography', 'magic', 'history', 'culture', 'politics', 'technology', 'religion', 'custom']),
  content: faker.lorem.paragraphs(3),
  importance: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
  relatedCharacterIds: [],
  relatedChapterIds: [],
  tags: [faker.word.sample(), faker.word.sample()],
  status: 'active',
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});
