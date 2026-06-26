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
}

/** 主角设定输入 */
export interface ProtagonistInput {
  name: string;
  gender: 'male' | 'female';
  age?: number;
  personality?: string;
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
