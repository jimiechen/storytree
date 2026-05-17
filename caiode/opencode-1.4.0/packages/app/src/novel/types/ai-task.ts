export type AITaskStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'denied'
  | 'quota';

export type AITaskType =
  | 'continue-writing'
  | 'rewrite-selection'
  | 'summarize-chapter'
  | 'character-voice';

export interface AITaskInput {
  type: AITaskType;
  chapterId: string;
  text: string;
  selectedText?: string;
  characterId?: string;
}

export interface AITaskOutput {
  text: string;
  wordCount: number;
}

export interface AITask {
  id: string;
  type: AITaskType;
  chapterId: string;
  status: AITaskStatus;
  input: {
    text: string;
    selectedText?: string;
    characterId?: string;
  };
  output?: AITaskOutput;
  error?: string;
  duration?: number;
  createdAt: Date;
  completedAt?: Date;
}
