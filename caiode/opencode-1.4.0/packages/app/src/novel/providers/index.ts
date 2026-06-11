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
  AILog
} from '../types';

export type { ProviderError, ProviderErrorCode } from '../types/provider-error';

export interface INovelProjectProvider {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  getActiveProject(): Promise<Project | null>;
  searchProjects(keyword: string): Promise<Project[]>;
}

export interface INovelChapterProvider {
  listChapters(projectId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  saveChapter(id: string, content: string): Promise<void>;
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
