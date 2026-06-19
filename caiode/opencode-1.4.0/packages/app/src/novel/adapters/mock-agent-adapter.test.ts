/**
 * @file adapters/mock-agent-adapter.test.ts
 * @description MockAgentAdapter 单元测试 — P1-A 验收
 *
 * 覆盖验收标准:
 *   VA02: MockAgentAdapter unit test 通过
 *   VA03: result.informationState 有完整子字段
 *   VA04: entropyDelta === entropyAfter - entropyBefore（数学校验）
 *   VA05: ID 格式正确（不含 --/-前缀递增）
 *   VA06: status 值为 'completed' 非 'success'
 *   VA07: 相同输入两次运行结果一致（确定性）
 */

import { describe, it, expect } from 'vitest';
import { MockAgentAdapter, mockAgentAdapter } from './mock-agent-adapter';
import type { NovelCommand } from '../workflows/novel-command';
import { createChapterGenerateCommand } from '../workflows/novel-command';
import { uid } from '../types/information-flow';

// ─── 测试用命令工厂 ────────────────────────────────────────────────────

function makeTestCommand(overrides?: Partial<NovelCommand>): NovelCommand {
  return createChapterGenerateCommand({
    chapterId: 'ch-003',
    projectId: 'proj-001',
    chapterIndex: 3,
    genre: '玄幻',
    text: '测试正文内容',
    targetWordCount: 800,
    contextRefs: ['ch-001', 'ch-002'],
    ...overrides,
  });
}

// ─── 测试套件 ──────────────────────────────────────────

describe('MockAgentAdapter', () => {
  const adapter = new MockAgentAdapter({ delayMultiplier: 0, silent: true });

  // ── VA06: status 为 'completed' ──

  it('VA06: 返回 status=completed（非 success）', async () => {
    const result = await adapter.run(makeTestCommand());
    expect(result.status).toBe('completed');
    expect(result.status).not.toBe('success');
  });

  // ── VA03: informationState 完整子字段 ──

  it('VA03: informationState 包含所有必需子字段', async () => {
    const result = await adapter.run(makeTestCommand());
    const info = result.informationState;

    expect(info).toBeDefined();
    expect(info).not.toBeNull();

    // 必需字段非 undefined
    expect(info!.chapterId).toBe('ch-003');
    expect(info!.projectId).toBe('proj-001');
    expect(typeof info!.entropyBefore).toBe('number');
    expect(typeof info!.entropyAfter).toBe('number');
    expect(typeof info!.entropyDelta).toBe('number');
    expect(typeof info!.selfInformationScore).toBe('number');
    expect(Array.isArray(info!.newAtoms)).toBeTruthy();
    expect(Array.isArray(info!.newLinks)).toBeTruthy();
    expect(info!.newAtoms.length).toBeGreaterThan(0);
    expect(info!.newLinks.length).toBeGreaterThan(0);

    // 每个原子有完整字段
    for (const atom of info!.newAtoms) {
      expect(atom.id).toBeDefined();
      expect(atom.type).toBeDefined();
      expect(atom.title).toBeDefined();
      expect(typeof atom.importance).toBe('number');
      expect(typeof atom.selfInformationScore).toBe('number');
    }

    // 每个链接有完整字段
    for (const link of info!.newLinks) {
      expect(link.id).toBeDefined();
      expect(link.sourceTitle).toBeDefined();
      expect(link.targetTitle).toBeDefined();
      expect(link.relationType).toBeDefined();
      expect(typeof link.strength).toBe('number');
    }
  });

  // ── VA04: entropyDelta 数学正确 ──

  it('VA04: entropyDelta === entropyAfter - entropyBefore', async () => {
    const result = await adapter.run(makeTestCommand());
    const info = result.informationState!;

    const expectedDelta = parseFloat((info.entropyAfter - info.entropyBefore).toFixed(2));
    expect(info.entropyDelta).toBe(expectedDelta);
    // 确认 delta 非零（修正#7 保证 before/after 使用不同偏移）
    expect(info.entropyDelta).not.toBe(0);
  });

  // ── VA05: ID 格式正确 ──

  it('VA05: ID 格式为 prefix-xxxxxx（不含 -- 或纯数字递增）', async () => {
    const result = await adapter.run(makeTestCommand());

    // taskId 格式
    expect(result.taskId).toMatch(/^[a-z]+-[a-z0-9]{6}$/);

    // 信息原子 ID 格式
    const info = result.informationState!;
    for (const atom of info.newAtoms) {
      expect(atom.id).toMatch(/^info-atom-[a-z0-9]{6}$/);
      // 不含 --
      expect(atom.id).not.toContain('--');
    }

    // 信息链接 ID 格式
    for (const link of info.newLinks) {
      expect(link.id).toMatch(/^info-link-[a-z0-9]{6}$/);
      expect(link.id).not.toContain('--');
    }
  });

  // ── VA07: 确定性（相同输入 → 相同输出） ──

  it('VA07: 相同输入两次运行结果完全一致', async () => {
    const cmd = makeTestCommand();

    const [result1, result2] = await Promise.all([
      adapter.run(cmd),
      adapter.run(cmd),
    ]);

    // 终态字段完全一致
    expect(result1.taskId).toBe(result2.taskId);
    expect(result1.status).toBe(result2.status);
    expect(result1.text).toBe(result2.text);
    expect(result1.wordCount).toBe(result2.wordCount);
    expect(result1.summary).toBe(result2.summary);

    // Info-Lite 数据完全一致
    const info1 = result1.informationState!;
    const info2 = result2.informationState!;
    expect(info1.entropyBefore).toBe(info2.entropyBefore);
    expect(info1.entropyAfter).toBe(info2.entropyAfter);
    expect(info1.entropyDelta).toBe(info2.entropyDelta);
    expect(info1.selfInformationScore).toBe(info2.selfInformationScore);
    expect(info1.auditScore).toBe(info2.auditScore);
    expect(info1.newAtoms.length).toBe(info2.newAtoms.length);
    expect(info1.newLinks.length).toBe(info2.newLinks.length);

    // 原子 ID 一致
    for (let i = 0; i < info1.newAtoms.length; i++) {
      expect(info1.newAtoms[i].id).toBe(info2.newAtoms[i].id);
      expect(info1.newAtoms[i].title).toBe(info2.newAtoms[i].title);
    }
  });

  // ── 不同 genre 产出不同数据 ──

  it('不同 genre 产出不同的信息原子和链接', async () => {
    const [rXuanhuan, rSuspense] = await Promise.all([
      adapter.run(makeTestCommand({ genre: '玄幻' })),
      adapter.run(makeTestCommand({ genre: '悬疑' })),
    ]);

    // 不同 genre 的摘要不同
    expect(rXuanhuan.summary).not.toBe(rSuspense.summary);

    // ID 不同（因 genre 参数不同）
    expect(rXuanhuan.taskId).not.toBe(rSuspense.taskId);

    // 但各自内部确定性不变
    const reRun = await adapter.run(makeTestCommand({ genre: '玄幻' }));
    expect(reRun.taskId).toBe(rXuanhuan.taskId);
  });

  // ── mystery relationType 存在（修正#3） ──

  it('悬疑 genre 的信息链接包含 mystery 类型', async () => {
    const result = await adapter.run(makeTestCommand({ genre: '悬疑' }));
    const info = result.informationState!;

    const hasMystery = info.newLinks.some((l) => l.relationType === 'mystery');
    expect(hasMystery).toBe(true);
  });
});

// ─── uid() 独立测试 ─────────────────────────────────────────────────────

describe('uid() 确定性 ID 生成器', () => {
  it('相同参数返回相同 ID', () => {
    expect(uid('atk', 3, '玄幻', 0)).toBe(uid('atk', 3, '玄幻', 0));
  });

  it('不同 seq 返回不同 ID', () => {
    expect(uid('atk', 3, '玄幻', 0)).not.toBe(uid('atk', 3, '玄幻', 1));
  });

  it('不同 chapterIndex 返回不同 ID', () => {
    expect(uid('info-atom', 1, '玄幻', 0)).not.toBe(uid('info-atom', 2, '玄幻', 0));
  });

  it('ID 格式为 prefix-6位36进制', () => {
    const id = uid('info-link', 5, '都市', 2);
    expect(id).toMatch(/^info-link-[a-z0-9]{6}$/);
  });

  it('uid 示例值与文档一致（修正A）', () => {
    // 文档中的示例必须返回可用值，不能是占位符
    const v1 = uid('atk', 3, '玄幻', 0);
    const v2 = uid('info-atom', 5, '悬疑', 1);
    const v3 = uid('info-link', 2, '都市', 0);

    expect(typeof v1).toBe('string');
    expect(v1.length).toBeGreaterThan(5); // 至少 "atk-" + 后缀
    expect(v2).toContain('info-atom-');
    expect(v3).toContain('info-link-');
  });
});
