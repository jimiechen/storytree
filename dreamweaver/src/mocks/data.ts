import { faker } from '@faker-js/faker';

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
