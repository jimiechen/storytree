/**
 * @file scripts/trae-hooks/stop-acceptance.ts
 * @description Stop Hook：任务结束前三视角集成验收
 *
 * P2-E：在 Agent 任务结束时运行集成验收。
 * - UI 视角：组件/Hook 行为测试（bun test src/novel/hooks）
 * - 产品视角：Novel 全量测试（bun test src/novel）+ 类型检查（bun typecheck）
 * - 历史规范视角：Git 状态检查、工作空间文件检查、READY 标记检查
 *
 * 本脚本只对"任务完成型 Query"执行严格验收；普通问答型 Query 快速通过。
 */

import { execSync } from 'child_process';
import { readHookInput } from './shared/read-hook-input';
import { outputStop } from './shared/hook-output';

const TASK_COMPLETION_KEYWORDS = [
  '完成',
  '报告',
  '提交',
  'READY',
  '验收',
  '阶段',
  'phase',
  'commit',
  'report',
];

function looksLikeTaskCompletion(input: {
  prompt?: string;
  filesChanged?: string[];
}): boolean {
  if ((input.filesChanged ?? []).length > 0) return true;
  const prompt = input.prompt ?? '';
  return TASK_COMPLETION_KEYWORDS.some((kw) => prompt.toLowerCase().includes(kw.toLowerCase()));
}

function runCommand(command: string, cwd: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    });
    return { success: true, output };
  } catch (error) {
    const output = error instanceof Error && 'stdout' in error ? String(error.stdout) : String(error);
    return { success: false, output };
  }
}

function hasUncommittedFiles(cwd: string): boolean {
  try {
    const output = execSync('git status --short', { cwd, encoding: 'utf-8' }).trim();
    return output.length > 0;
  } catch {
    return false;
  }
}

function findLatestReadyTag(cwd: string): string | undefined {
  try {
    const files = execSync(
      'git ls-files --others --exclude-standard docs/task-reports/ ; git diff --name-only docs/task-reports/',
      { cwd, encoding: 'utf-8' },
    )
      .split('\n')
      .filter(Boolean);

    if (files.length === 0) {
      // 没有新增/修改报告，尝试查找最近提交的报告
      const committed = execSync(
        'git ls-files docs/task-reports/**/*.md | sort -r | head -n 1',
        { cwd, encoding: 'utf-8' },
      ).trim();
      if (committed) files.push(committed);
    }

    for (const file of files) {
      try {
        const content = execSync(`git show HEAD:${file}`, { cwd, encoding: 'utf-8' });
        if (content.includes('[READY_')) return file;
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function main(): Promise<void> {
  const { input } = await readHookInput();

  if (!looksLikeTaskCompletion(input)) {
    outputStop('allow', '普通问答型会话，跳过严格验收', '');
    return;
  }

  const cwd = input.projectPath ?? process.cwd();
  const issues: string[] = [];

  // UI 视角 + 产品视角：类型检查
  const typeCheck = runCommand('bun typecheck', `${cwd}/caiode/opencode-1.4.0/packages/app`);
  if (!typeCheck.success) {
    issues.push('bun typecheck 失败');
  }

  // 产品视角：全量 Novel 测试
  const novelTest = runCommand('bun test src/novel', `${cwd}/caiode/opencode-1.4.0/packages/app`);
  if (!novelTest.success) {
    issues.push('bun test src/novel 失败');
  }

  // 历史规范视角：Git 状态
  if (hasUncommittedFiles(cwd)) {
    issues.push('Git 工作区仍有未提交文件');
  }

  // 历史规范视角：READY 标记
  const readyFile = findLatestReadyTag(cwd);
  if (!readyFile) {
    issues.push('未在阶段报告中找到 [READY_*] 标记');
  }

  if (issues.length > 0) {
    outputStop('block', `P2-E 验收未通过：${issues.join('；')}`, '');
    return;
  }

  outputStop(
    'allow',
    'UI / 产品 / 历史规范三视角验收通过',
    'bun typecheck 通过；bun test src/novel 通过；Git 工作区干净；阶段报告含 READY 标记。',
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  outputStop('block', `Stop Acceptance 脚本异常：${message}`, '');
  process.exit(2);
});
