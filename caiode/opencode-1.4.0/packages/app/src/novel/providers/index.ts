import type {
  Project,
  Chapter,
  ChapterStatus,
  AISuggestion,
  Character,
  CharacterRelationship,
  AITask,
  AITaskInput,
  AITaskStatus,
  AILog,
  OutlineNode,
  ChapterExtractedInfo,
} from '../types';
import type { CreateProjectInput } from '../types';
import type { ChapterInformationState } from '../types/information-flow';

export type { ProviderError, ProviderErrorCode } from '../types/provider-error';

export interface INovelProjectProvider {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  getActiveProject(): Promise<Project | null>;
  searchProjects(keyword: string): Promise<Project[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  /** 软删除项目（移入回收站） */
  deleteProject(id: string): Promise<void>;
  /** 恢复已删除项目 */
  restoreProject(id: string): Promise<void>;
  /** 列出已删除项目（回收站） */
  listDeletedProjects(): Promise<Project[]>;
}

export interface INovelChapterProvider {
  listChapters(projectId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  saveChapter(id: string, content: string): Promise<void>;
  saveChapterSummary(id: string, summary: string): Promise<void>;
  saveChapterWordCount(id: string, wordCount: number): Promise<void>;
  saveChapterInformationState(id: string, state: ChapterInformationState): Promise<void>;
  saveChapterExtractedInfo(id: string, info: ChapterExtractedInfo): Promise<void>;
  updateChapterStatus(id: string, status: ChapterStatus): Promise<void>;
  addAISuggestion(chapterId: string, suggestion: AISuggestion): Promise<void>;
  acceptSuggestion(chapterId: string, suggestionId: string): Promise<void>;
}

export interface INovelCharacterProvider {
  listCharacters(projectId: string): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | null>;
  getCharacterRelationships(characterId: string): Promise<CharacterRelationship[]>;
}

export interface INovelAgentProvider {
  submitTask(input: AITaskInput): Promise<AITask>;
  cancelTask(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): Promise<AITaskStatus>;
  onTaskUpdate(callback: (task: AITask) => void): () => void;
}

export interface IAILogProvider {
  logTask(task: AITask): Promise<void>;
  listLogs(options?: { status?: AITaskStatus; limit?: number }): Promise<AILog[]>;
  getLog(taskId: string): Promise<AILog | null>;
}

export interface INovelOutlineProvider {
  /** 列出项目的大纲树（按 orderIndex 排序，返回副本） */
  listOutlines(projectId: string): Promise<OutlineNode[]>;
  /** 获取某章节的细纲（复用 ChapterOutline） */
  getDetailOutline(chapterId: string): Promise<import('../types').ChapterOutline | null>;
  /** AI 生成/刷新大纲（Mock 返回预设数据） */
  generateOutline(projectId: string): Promise<OutlineNode[]>;
}
