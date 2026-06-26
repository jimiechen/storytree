/**
 * @file name-generator.ts
 * @description PAGE-14 名字生成器类型定义
 */

export type GeneratorMode = 'random' | 'ai';
export type NameGender = 'male' | 'female' | 'neutral';
export type NameStyle = 'minimal' | 'ancient' | 'fantasy' | 'modern' | 'cool' | 'cute';

export interface NameGeneratorConfig {
  mode: GeneratorMode;
  gender: NameGender;
  style: NameStyle;
  length: number; // 2-6
}

export interface GeneratedName {
  text: string;
  config: NameGeneratorConfig;
  createdAt: string; // ISO timestamp
}
