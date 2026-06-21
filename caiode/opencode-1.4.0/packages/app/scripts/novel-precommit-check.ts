/**
 * @file scripts/novel-precommit-check.ts
 * @description Novel 模块提交前检查脚本
 *
 * P2-E：在提交 Novel 模块代码前执行自动化审查。
 * 检查项包括：类型检查、单元测试、代码文件行数、空 handler、中文注释、FeatureGate、OpenCode Core 保护。
 * 明确禁止项必须 fail；历史遗留问题可 warning；新增复杂逻辑缺少中文注释必须 fail。
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import {
  MAX_CODE_FILE_LINES,
  OPENCODE_CORE_PATHS,
  PSEUDO_SUCCESS_PATTERNS,
  BLOCKED_CODE_PATTERNS,
  CLIENT_SIDE_SECRET_PATTERNS,
  LLM_ENDPOINT_PATTERNS,
  FULL_PROMPT_LOGGING_PATTERNS,
  COMPLEX_FILE_KEYWORDS,
  RELATED_VIEWMODEL_STATES,
} from '../../../../../scripts/trae-hooks/shared/novel-rules';

const APP_ROOT = join(import.meta.dir, '..');
const NOVEL_SRC = join(APP_ROOT, 'src/novel');
const PROJECT_ROOT = join(APP_ROOT, '..', '..', '..', '..');

interface CheckIssue {
  level: 'error' | 'warning';
  message: string;
}

function runCommand(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd: APP_ROOT,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 180_000,
    });
    return { success: true, output };
  } catch (error) {
    const output = error instanceof Error && 'stdout' in error ? String((error as { stdout: unknown }).stdout) : String(error);
    return { success: false, output };
  }
}

function walkDir(dir: string, callback: (file: string) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') continue;
      walkDir(fullPath, callback);
    } else if (entry.isFile()) {
      callback(fullPath);
    }
  }
}

function countCodeLines(content: string): number {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return false;
      if (trimmed.startsWith('//')) return false;
      if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) return false;
      return true;
    }).length;
}

function checkFileLines(issues: CheckIssue[]): void {
  walkDir(NOVEL_SRC, (file) => {
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) return;
    const rel = relative(APP_ROOT, file);
    const content = readFileSync(file, 'utf-8');
    const lines = countCodeLines(content);
    if (lines > MAX_CODE_FILE_LINES) {
      issues.push({
        level: 'error',
        message: `${rel} 实际代码行数 ${lines} 超过限制 ${MAX_CODE_FILE_LINES}，请拆分文件`,
      });
    }
  });
}

function checkPseudoSuccess(issues: CheckIssue[], changedFiles: string[]): void {
  for (const file of changedFiles) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const fullPath = join(APP_ROOT, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      for (const pattern of PSEUDO_SUCCESS_PATTERNS) {
        if (pattern.test(content)) {
          issues.push({
            level: 'error',
            message: `${file} 中存在空 handler 或 TODO implement 占位：${pattern.source}`,
          });
        }
      }
    } catch {
      // ignore deleted files
    }
  }
}

function checkBlockedCode(issues: CheckIssue[], changedFiles: string[]): void {
  for (const file of changedFiles) {
    if (!/\.(ts|tsx|js|jsx|json)$/.test(file)) continue;
    const fullPath = join(APP_ROOT, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      for (const pattern of BLOCKED_CODE_PATTERNS) {
        if (pattern.test(content)) {
          issues.push({
            level: 'error',
            message: `${file} 中出现真实外部服务 endpoint 硬编码：${pattern.source}`,
          });
        }
      }
    } catch {
      // ignore
    }
  }
}

function checkClientSideSecrets(issues: CheckIssue[], changedFiles: string[]): void {
  for (const file of changedFiles) {
    if (!/\.tsx?$/.test(file)) continue;
    // 测试文件可能故意包含风险字符串以验证检测逻辑，跳过
    if (/\.(test|spec)\.(ts|tsx)$/.test(file)) continue;
    const fullPath = join(APP_ROOT, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      for (const pattern of CLIENT_SIDE_SECRET_PATTERNS) {
        if (pattern.test(content)) {
          issues.push({
            level: 'error',
            message: `${file} 中存在前端密钥风险（禁止前端持有 API Key 或读取 process.env 密钥）：${pattern.source}`,
          });
        }
      }
    } catch {
      // ignore
    }
  }
}

function checkLLMEndpoints(issues: CheckIssue[], changedFiles: string[]): void {
  for (const file of changedFiles) {
    if (!/\.tsx?$/.test(file)) continue;
    if (/\.(test|spec)\.(ts|tsx)$/.test(file)) continue;
    const fullPath = join(APP_ROOT, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      for (const pattern of LLM_ENDPOINT_PATTERNS) {
        if (pattern.test(content)) {
          issues.push({
            level: 'error',
            message: `${file} 中疑似硬编码真实 LLM endpoint fetch（P3-0 禁止真实请求）：${pattern.source}`,
          });
        }
      }
    } catch {
      // ignore
    }
  }
}

function checkFullPromptLogging(issues: CheckIssue[], changedFiles: string[]): void {
  for (const file of changedFiles) {
    if (!/\.tsx?$/.test(file)) continue;
    if (/\.(test|spec)\.(ts|tsx)$/.test(file)) continue;
    const fullPath = join(APP_ROOT, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      for (const pattern of FULL_PROMPT_LOGGING_PATTERNS) {
        if (pattern.test(content)) {
          issues.push({
            level: 'error',
            message: `${file} 中疑似直接输出完整 prompt / response 到 console（必须使用安全日志脱敏）：${pattern.source}`,
          });
        }
      }
    } catch {
      // ignore
    }
  }
}

function checkOpenCodeCore(issues: CheckIssue[], changedFiles: string[]): void {
  for (const file of changedFiles) {
    for (const core of OPENCODE_CORE_PATHS) {
      if (file.includes(core)) {
        issues.push({
          level: 'error',
          message: `${file} 触及 OpenCode Core（${core}），P2 阶段禁止修改`,
        });
      }
    }
  }
}

function checkChineseComments(issues: CheckIssue[], changedFiles: string[]): void {
  for (const file of changedFiles) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const isComplex = COMPLEX_FILE_KEYWORDS.some((kw) => file.toLowerCase().includes(kw));
    if (!isComplex) continue;

    const fullPath = join(APP_ROOT, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const hasChineseComment = /[\u4e00-\u9fa5]/.test(content);
      if (!hasChineseComment) {
        issues.push({
          level: 'error',
          message: `${file} 是复杂逻辑文件，必须包含中文注释说明设计决策与阶段边界`,
        });
      }
    } catch {
      // ignore
    }
  }
}

function checkViewModelSignals(issues: CheckIssue[], changedFiles: string[]): void {
  const viewModelFiles = changedFiles.filter((f) => f.endsWith('-view-model.ts') || f.endsWith('view-model.ts'));
  for (const file of viewModelFiles) {
    const fullPath = join(APP_ROOT, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const signalMatches = RELATED_VIEWMODEL_STATES.filter((state) => content.includes(`createSignal`));
      // 粗略判断：如果文件中存在多个 createSignal 且包含相关状态名，提示 warning
      const signalCount = (content.match(/createSignal/g) || []).length;
      if (signalCount >= 3 && signalMatches.length >= 2) {
        issues.push({
          level: 'warning',
          message: `${file} 中存在多个相关 createSignal（${signalMatches.join(', ')}），建议合并为 createStore`,
        });
      }
    } catch {
      // ignore
    }
  }
}

function getChangedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function main(): void {
  console.log('=== Novel Precommit Check Start ===\n');

  const issues: CheckIssue[] = [];
  const changedFiles = getChangedFiles();

  // 1. 类型检查
  console.log('Running bun typecheck...');
  const typeCheck = runCommand('bun typecheck');
  if (!typeCheck.success) {
    issues.push({ level: 'error', message: 'bun typecheck 失败\n' + typeCheck.output.slice(0, 2000) });
  } else {
    console.log('  ✅ bun typecheck passed\n');
  }

  // 2. 全量 Novel 测试
  console.log('Running bun test src/novel...');
  const novelTest = runCommand('bun test src/novel');
  if (!novelTest.success) {
    issues.push({ level: 'error', message: 'bun test src/novel 失败\n' + novelTest.output.slice(0, 2000) });
  } else {
    console.log('  ✅ bun test src/novel passed\n');
  }

  // 3. 文件行数（全量扫描，保证任何新增文件都受控）
  console.log('Checking file line limits...');
  checkFileLines(issues);

  // 4. 仅对本次变更文件做增量检查
  if (changedFiles.length > 0) {
    console.log(`Checking ${changedFiles.length} changed files...`);
    checkPseudoSuccess(issues, changedFiles);
    checkBlockedCode(issues, changedFiles);
    checkClientSideSecrets(issues, changedFiles);
    checkLLMEndpoints(issues, changedFiles);
    checkFullPromptLogging(issues, changedFiles);
    checkOpenCodeCore(issues, changedFiles);
    checkChineseComments(issues, changedFiles);
    checkViewModelSignals(issues, changedFiles);
  } else {
    console.log('No staged files, skipping incremental checks.\n');
  }

  // 输出结果
  console.log('\n=== Novel Precommit Check Result ===');
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  if (warnings.length > 0) {
    console.log(`\n⚠️ Warnings (${warnings.length}):`);
    for (const w of warnings) console.log(`  - ${w.message}`);
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    for (const e of errors) console.log(`  - ${e.message}`);
    console.log('\nPrecommit FAILED. Please fix the errors above before committing.');
    process.exit(1);
  }

  console.log('\n✅ Precommit PASSED.');
  process.exit(0);
}

main();
