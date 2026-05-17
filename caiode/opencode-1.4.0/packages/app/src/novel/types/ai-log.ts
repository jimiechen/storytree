import type { AITaskStatus, AITaskType } from './ai-task';

export interface AILog {
  id: string;
  taskId: string;
  taskType: AITaskType;
  inputSummary: string;
  outputSummary: string;
  status: AITaskStatus;
  duration: number;
  errorMessage?: string;
  provider: string;
  createdAt: Date;
}
