import { describe, it, expect, beforeEach } from 'vitest';
import { AILogProvider } from './ai-log';
import type { AITask } from '../types';

function makeTask(overrides?: Partial<AITask>): AITask {
  return {
    id: 'task-001',
    type: 'continue-writing',
    chapterId: 'ch-001',
    status: 'success',
    input: { text: '测试输入' },
    output: { text: 'AI 输出结果', wordCount: 4 },
    duration: 1200,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('AILogProvider - AI 操作日志', () => {
  let provider: AILogProvider;

  beforeEach(() => {
    provider = new AILogProvider();
  });

  describe('logTask', () => {
    it('应记录一次任务日志', async () => {
      const task = makeTask();
      await provider.logTask(task);
      const logs = await provider.listLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].taskId).toBe(task.id);
      expect(logs[0].taskType).toBe(task.type);
    });

    it('多次记录按时间倒序排列', async () => {
      await provider.logTask(makeTask({ id: 'task-001' }));
      await provider.logTask(makeTask({ id: 'task-002' }));
      const logs = await provider.listLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].taskId).toBe('task-002'); // 最新的在前
      expect(logs[1].taskId).toBe('task-001');
    });

    it('输入摘要应截断到 100 字符', async () => {
      const longText = 'a'.repeat(200);
      const task = makeTask({ input: { text: longText } });
      await provider.logTask(task);
      const logs = await provider.listLogs();
      expect(logs[0].inputSummary.length).toBeLessThanOrEqual(103); // 100 + '...'
    });

    it('失败任务的 errorMessage 应被记录', async () => {
      const task = makeTask({ status: 'failed', error: 'Rate limit exceeded' });
      await provider.logTask(task);
      const logs = await provider.listLogs();
      expect(logs[0].errorMessage).toBe('Rate limit exceeded');
      expect(logs[0].status).toBe('failed');
    });
  });

  describe('listLogs', () => {
    it('支持按 status 过滤', async () => {
      await provider.logTask(makeTask({ id: 't1', status: 'success' }));
      await provider.logTask(makeTask({ id: 't2', status: 'failed' }));
      await provider.logTask(makeTask({ id: 't3', status: 'success' }));

      const successLogs = await provider.listLogs({ status: 'success' });
      expect(successLogs).toHaveLength(2);

      const failedLogs = await provider.listLogs({ status: 'failed' });
      expect(failedLogs).toHaveLength(1);
    });

    it('支持 limit 限制返回数量', async () => {
      for (let i = 0; i < 5; i++) {
        await provider.logTask(makeTask({ id: `task-${i}` }));
      }
      const logs = await provider.listLogs({ limit: 3 });
      expect(logs).toHaveLength(3);
    });

    it('无参数时返回全部日志', async () => {
      await provider.logTask(makeTask());
      const logs = await provider.listLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('空日志时返回空数组', async () => {
      const logs = await provider.listLogs();
      expect(logs).toEqual([]);
    });
  });

  describe('getLog', () => {
    it('根据 taskId 返回对应日志', async () => {
      const task = makeTask({ id: 'target-task' });
      await provider.logTask(task);
      const log = await provider.getLog('target-task');
      expect(log).not.toBeNull();
      expect(log!.taskId).toBe('target-task');
    });

    it('不存在的 taskId 返回 null', async () => {
      const log = await provider.getLog('nonexistent');
      expect(log).toBeNull();
    });
  });
});
