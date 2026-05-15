import { faker } from '@faker-js/faker';

export const generateMockUser = () => ({
  userId: faker.string.uuid(),
  email: faker.internet.email(),
  username: faker.internet.userName(),
});

export const generateMockProject = () => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  genre: 'fantasy',
  currentWordCount: faker.number.int({ min: 0, max: 100000 }),
  targetWordCount: 100000,
  createdAt: faker.date.past().toISOString(),
});

export const generateMockChapter = (order: number) => ({
  id: faker.string.uuid(),
  title: `第${order}章 ${faker.lorem.words(2)}`,
  content: faker.lorem.paragraphs(5),
  order,
  wordCount: faker.number.int({ min: 1000, max: 5000 }),
  status: 'draft',
});
