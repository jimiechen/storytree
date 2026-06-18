import type { Character } from '../types';

export const mockCharacters: Character[] = [
  {
    id: 'char-001',
    projectId: 'proj-001',
    name: '苏瑶',
    role: '核心主角 · 写作者',
    roleType: 'protagonist',
    personalityTags: ['冷静疏离', '内心藏有秘密'],
    speakingStyle: '言简意赅，常用反问句。',
    goal: '寻找真相',
    secret: '能听到卡牌的低语',
    relationships: [
      { characterId: 'char-002', characterName: '陆长风', type: 'mentor', description: '亦师亦友' },
      { characterId: 'char-003', characterName: '凯瑟琳女王', type: 'antagonist', description: '潜在威胁' }
    ]
  },
  {
    id: 'char-002',
    projectId: 'proj-001',
    name: '陆长风',
    role: '铸卡师导师',
    personalityTags: ['谨慎', '博学', '隐瞒往事'],
    speakingStyle: '学术性、隐喻多、停顿频繁...',
    goal: '引导苏瑶但不暴露全部真相',
    secret: '曾是王室工程师',
    relationships: [
      { characterId: 'char-001', characterName: '苏瑶', type: 'mentor', description: '学生' },
      { characterId: 'char-003', characterName: '凯瑟琳女王', type: 'neutral', description: '旧识' }
    ]
  },
  {
    id: 'char-003',
    projectId: 'proj-001',
    name: '凯瑟琳女王',
    role: '统治者',
    roleType: 'antagonist',
    personalityTags: ['冷酷', '果断', '控制欲强'],
    speakingStyle: '命令式、威严、不带感情',
    goal: '维持统治，消灭威胁',
    secret: '发条核心正在衰竭',
    relationships: [
      { characterId: 'char-001', characterName: '苏瑶', type: 'antagonist', description: '猎物' },
      { characterId: 'char-002', characterName: '陆长风', type: 'neutral', description: '叛徒' }
    ]
  }
];
