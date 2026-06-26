export interface Project {
  id: string;
  name: string;
  genre: string;
  description: string;
  totalWordCount: number;
  chapterCount: number;
  characterCount: number;
  lastUpdated: Date;
  status: 'active' | 'archived' | 'draft';
}

/** 目标读者选项 */
export type TargetAudience = 'general' | 'male' | 'female';

/** 写作风格选项 */
export type WritingStyle =
  | 'default'
  | 'humorous'
  | 'dark'
  | 'decisive'
  | 'literary'
  | 'fast-paced'
  | 'slow-paced'
  | 'mystery'
  | 'passionate'
  | 'light'
  | 'heartbreaking'
  | 'custom';

/** 故事主题选项 */
export type StoryTheme =
  | 'default'
  | 'revenge'
  | 'growth'
  | 'love'
  | 'adventure'
  | 'redemption'
  | 'power'
  | 'friendship'
  | 'survival'
  | 'exploration'
  | 'competition'
  | 'family'
  | 'custom';

/** 创建项目表单输入 */
export interface CreateProjectInput {
  name: string;
  genre: GenreOption;
  description?: string;
  protagonist?: ProtagonistInput;
  targetAudience?: TargetAudience;
  writingStyle?: WritingStyle;
  storyTheme?: StoryTheme;
  customSettings?: string;
  estimatedChapters?: number;
  coverUrl?: string;
  worldview?: string;
  plotOutline?: string;
  worldType?: string;      // PAGE-06: 世界类型
  era?: string;            // PAGE-06: 时代背景
  socialSystem?: string;   // PAGE-06: 社会制度
}

/** 世界类型选项（PRD §3.6） */
export type WorldType =
  | 'ancient_china'
  | 'medieval_europe'
  | 'modern_urban'
  | 'near_future'
  | 'far_future'
  | 'fantasy'
  | 'custom';

/** 时代背景选项（PRD §3.6） */
export type Era =
  | 'primitive'
  | 'ancient'
  | 'medieval'
  | 'pre_industrial'
  | 'industrial'
  | 'modern'
  | 'near_future_tech'
  | 'advanced_tech'
  | 'sci_fi'
  | 'magitech';

/** 社会制度选项（PRD §3.6） */
export type SocialSystem =
  | 'tribal'
  | 'feudal'
  | 'imperial'
  | 'constitutional_monarchy'
  | 'republic'
  | 'democracy'
  | 'corporate_oligarchy'
  | 'anarchy';

/** 世界类型显示名称映射 */
export const WORLD_TYPE_LABELS: Record<WorldType, string> = {
  ancient_china: '中国古代',
  medieval_europe: '欧洲中世纪',
  modern_urban: '现代都市',
  near_future: '近未来',
  far_future: '远未来',
  fantasy: '奇幻架空',
  custom: '⚡ 自定义',
};

/** 时代背景显示名称映射 */
export const ERA_LABELS: Record<Era, string> = {
  primitive: '原始社会',
  ancient: '古代',
  medieval: '中世纪',
  pre_industrial: '工业革命前',
  industrial: '工业时代',
  modern: '现代',
  near_future_tech: '近未来科技',
  advanced_tech: '高度发达科技',
  sci_fi: '科幻设定',
  magitech: '魔导科技混合',
};

/** 社会制度显示名称映射 */
export const SOCIAL_SYSTEM_LABELS: Record<SocialSystem, string> = {
  tribal: '部落制',
  feudal: '封建制',
  imperial: '帝制',
  constitutional_monarchy: '君主立宪',
  republic: '共和制',
  democracy: '民主制',
  corporate_oligarchy: '企业寡头',
  anarchy: '无政府',
};

/** 主角性别 */
export type Gender = 'male' | 'female' | 'other';

/** 主角设定输入 */
export interface ProtagonistInput {
  name: string;
  gender: Gender;
  age?: number;
  personality?: string;
  appearance?: string;
  background?: string;
  motivation?: string;
  weakness?: string;
}

/** 小说类型选项 */
export type GenreOption =
  | '玄幻'
  | '都市'
  | '穿越'
  | '科幻'
  | '仙侠'
  | '悬疑'
  | '古言'
  | '其他';

/** 所有可用类型选项（用于下拉列表） */
export const GENRE_OPTIONS: GenreOption[] = [
  '玄幻', '都市', '穿越', '科幻', '仙侠', '悬疑', '古言', '其他'
];
