import type { AITask, AITaskInput, AITaskStatus, AITaskType, AITaskOutput } from '../types';
import type { INovelAgentProvider, ProviderError } from './index';
import { mockDelay } from '../utils/mock-delay';

const mockTemplates: Record<AITaskType, string[]> = {
  'continue-writing': [
    '那巨影发出令人牙酸的摩擦声，一柄巨大的石斧重重砸在地面上，激起漫天碎石。苏瑶眼神一凛，迅速抽出身侧的短刃，刃口流转着淡淡的银芒。她知道，这遗迹守护者绝不会轻易让她靠近祭坛中央那块散发着微光的符牌碎片。',
    '陆长风缓缓从阴影中走出，手中把玩着一枚古老的硬币。"看来，你遇到了一点小麻烦。"他的声音低沉而平静，仿佛眼前的巨兽不过是只温顺的猫。',
    '符牌碎片突然发出刺目的蓝光，苏瑶感到一股温热的力量从掌心涌入。那些古老的纹路开始流动，如同活物般在空气中勾勒出一个个她从未见过的文字。'
  ],
  'rewrite-selection': [
    '原文：她很快就意识到情况不对。\n改写：她以惊人的警觉察觉到事态正在向不可控的方向滑落。',
    '原文：这很危险。\n改写：这不合逻辑...而且感觉不对劲。',
    '原文：苏瑶很害怕。\n改写：苏瑶握紧了拳头，指节因用力而泛白，但她的眼神依然坚定。'
  ],
  'summarize-chapter': [
    '本章讲述了苏瑶在废墟中寻找失落符牌碎片的过程。她遭遇了遗迹守护者的阻拦，同时发现陆长风似乎在暗中观察她。关键时刻，符牌碎片产生共鸣，揭示了一段被掩盖的历史记忆。',
    '本章主要情节：苏瑶进入地下工坊，发现异常的发条装置。陆长风隐瞒关键信息，导致苏瑶开始怀疑他的真实目的。最终，符牌碎片与苏瑶产生共鸣，暗示她拥有王室血脉。'
  ],
  'character-voice': [
    '（苏瑶口吻）"这不合逻辑...除非齿轮本身就是活的。"',
    '（陆长风口吻）"年轻人，有些事情...知道得太多未必是好事。"',
    '（凯瑟琳女王口吻）"跪下。在我的王国里，没有人可以违抗我的命令。"'
  ]
};

export class FakeAgentProvider implements INovelAgentProvider {
  private tasks = new Map<string, AITask>();
  private callCount = 0;
  private listeners = new Set<(task: AITask) => void>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async submitTask(input: AITaskInput): Promise<AITask> {
    this.callCount++;

    const task: AITask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: input.type,
      chapterId: input.chapterId,
      status: 'pending',
      input: {
        text: input.text,
        selectedText: input.selectedText,
        characterId: input.characterId
      },
      createdAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.notifyListeners(task);

    await this.simulateTaskExecution(task);
    return task;
  }

  private async simulateTaskExecution(task: AITask): Promise<void> {
    task.status = 'running';
    this.notifyListeners(task);

    const delay = this.getDelay(task);

    const timer = setTimeout(() => {
      this.completeTask(task);
    }, delay);

    this.timers.set(task.id, timer);
  }

  private completeTask(task: AITask): void {
    if (task.status === 'cancelled') return;

    if (this.shouldFail(task)) {
      task.status = 'failed';
      task.error = 'Mock Error: 模拟生成超时（测试用错误场景）';
    } else if (this.shouldDeny(task)) {
      task.status = 'denied';
      task.error = '当前无权执行此操作（Mock 测试场景）';
    } else if (this.shouldQuotaExceeded(task)) {
      task.status = 'quota';
      task.error = '今日 Mock 调用次数已达上限（测试场景）';
    } else {
      task.status = 'success';
      task.output = this.generateMockOutput(task);
    }

    task.completedAt = new Date();
    task.duration = task.completedAt.getTime() - task.createdAt.getTime();

    this.notifyListeners(task);
  }

  private generateMockOutput(task: AITask): AITaskOutput {
    const templates = mockTemplates[task.type] || ['Mock 生成内容'];
    const text = templates[Math.floor(Math.random() * templates.length)];
    return {
      text,
      wordCount: text.length
    };
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw { code: 'NOT_FOUND', message: `Task ${taskId} not found` } as ProviderError;
    }

    const timer = this.timers.get(taskId);
    if (timer) clearTimeout(timer);

    task.status = 'cancelled';
    task.completedAt = new Date();
    this.notifyListeners(task);
  }

  async getTaskStatus(taskId: string): Promise<AITaskStatus> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw { code: 'NOT_FOUND', message: `Task ${taskId} not found` } as ProviderError;
    }
    return task.status;
  }

  getTask(taskId: string): AITask | undefined {
    return this.tasks.get(taskId);
  }

  getCallCount(): number {
    return this.callCount;
  }

  onTaskUpdate(callback: (task: AITask) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(task: AITask): void {
    this.listeners.forEach(cb => cb({ ...task }));
  }

  private shouldFail(task: AITask): boolean {
    return task.input.text?.includes('fail') || task.input.text?.includes('错误');
  }

  private shouldDeny(task: AITask): boolean {
    return task.input.text?.includes('sudo') ||
           task.input.text?.includes('admin') ||
           task.input.text?.includes('权限');
  }

  private shouldQuotaExceeded(task: AITask): boolean {
    return this.callCount > 10;
  }

  private getDelay(task: AITask): number {
    if (this.shouldFail(task)) return 500;
    if (this.shouldDeny(task) || this.shouldQuotaExceeded(task)) return 0;
    return 1000 + Math.random() * 1000;
  }
}
