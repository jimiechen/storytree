import { createSignal, createEffect, onCleanup } from 'solid-js';
import type { AITask, AITaskInput, AITaskType } from '../types';
import { FakeAgentProvider } from '../providers/providers-index';

const agentProvider = new FakeAgentProvider();

export function useAITask() {
  const [tasks, setTasks] = createSignal<AITask[]>([]);
  const [currentTask, setCurrentTask] = createSignal<AITask | null>(null);
  const [isRunning, setIsRunning] = createSignal(false);

  createEffect(() => {
    const unsubscribe = agentProvider.onTaskUpdate((task) => {
      setTasks(prev => {
        const index = prev.findIndex(t => t.id === task.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = task;
          return updated;
        }
        return [...prev, task];
      });
      
      if (task.status === 'running') {
        setIsRunning(true);
        setCurrentTask(task);
      } else if (task.status !== 'pending') {
        setIsRunning(false);
        setCurrentTask(task);
      }
    });

    onCleanup(unsubscribe);
  });

  const submitTask = async (input: AITaskInput) => {
    const task = await agentProvider.submitTask(input);
    return task;
  };

  const cancelTask = async (taskId: string) => {
    await agentProvider.cancelTask(taskId);
  };

  return {
    tasks,
    currentTask,
    isRunning,
    submitTask,
    cancelTask
  };
}
