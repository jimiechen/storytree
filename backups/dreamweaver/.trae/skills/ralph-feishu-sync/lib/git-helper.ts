/**
 * Git 操作辅助模块
 * 提供任务开始前的 pull 和任务完成后的 commit 功能
 */

import { execSync, ExecSyncOptions } from 'child_process';
import * as fs from 'fs';

export interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  message: string;
}

/**
 * 检查工作区状态
 * @returns {boolean} 是否干净
 */
export function isWorkspaceClean(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim() === '';
  } catch (error) {
    console.error('❌ 检查 Git 状态失败:', error);
    return false;
  }
}

/**
 * 获取当前 commit hash
 */
export function getCurrentCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('❌ 获取 commit hash 失败:', error);
    return '';
  }
}

/**
 * 获取当前分支
 */
export function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('❌ 获取当前分支失败:', error);
    return 'main';
  }
}

/**
 * Git Pull - 拉取最新代码
 * 
 * @param branch 目标分支
 * @returns {Promise<{success: boolean; message: string}>}
 */
export async function gitPull(branch?: string): Promise<{ success: boolean; message: string }> {
  try {
    // 检查是否在 git 仓库中
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    
    // 检查工作区是否干净
    if (!isWorkspaceClean()) {
      return {
        success: false,
        message: '❌ 工作区有未提交的更改，请先提交或暂存',
      };
    }
    
    const targetBranch = branch || getCurrentBranch();
    
    console.log(`🔄 正在拉取 ${targetBranch} 分支最新代码...`);
    
    const options: ExecSyncOptions = {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    };
    
    const output = execSync(`git pull origin ${targetBranch}`, options);
    console.log(output);
    
    // 检查是否有冲突
    if (output.includes('CONFLICT') || output.includes('conflict')) {
      return {
        success: false,
        message: '❌ 拉取代码时发生冲突，请手动解决',
      };
    }
    
    const commitHash = getCurrentCommit();
    
    return {
      success: true,
      message: `✅ 成功拉取 ${targetBranch} 分支，当前 commit: ${commitHash}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // 检查是否是网络错误
    if (errorMsg.includes('Could not resolve host') || errorMsg.includes('Connection refused')) {
      return {
        success: false,
        message: '❌ 网络连接失败，无法拉取代码',
      };
    }
    
    // 检查是否是权限错误
    if (errorMsg.includes('Permission denied') || errorMsg.includes('access denied')) {
      return {
        success: false,
        message: '❌ Git 权限不足，请检查 SSH 密钥或凭证',
      };
    }
    
    return {
      success: false,
      message: `❌ Git pull 失败: ${errorMsg}`,
    };
  }
}

/**
 * Git Commit - 提交代码
 * 
 * @param message 提交信息
 * @param branch 目标分支
 * @returns {Promise<GitCommitResult>}
 */
export async function gitCommit(
  message: string,
  branch?: string
): Promise<GitCommitResult> {
  try {
    // 检查是否在 git 仓库中
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    
    // 检查是否有变更需要提交
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    if (status.trim() === '') {
      return {
        success: true,
        message: 'ℹ️ 没有需要提交的变更',
      };
    }
    
    const targetBranch = branch || getCurrentBranch();
    
    console.log(`📝 正在提交代码到 ${targetBranch} 分支...`);
    console.log(`   提交信息: ${message}`);
    
    const options: ExecSyncOptions = {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    };
    
    // 添加所有变更
    execSync('git add .', options);
    
    // 提交
    execSync(`git commit -m "${message}"`, options);
    
    // 推送
    execSync(`git push origin ${targetBranch}`, options);
    
    // 获取 commit hash
    const commitHash = getCurrentCommit();
    
    return {
      success: true,
      commitHash,
      message: `✅ 代码已提交并推送，commit: ${commitHash}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // 尝试回滚 git add
    try {
      execSync('git reset HEAD', { stdio: 'pipe' });
    } catch {
      // 忽略回滚错误
    }
    
    return {
      success: false,
      message: `❌ Git commit 失败: ${errorMsg}`,
    };
  }
}

/**
 * 生成提交信息
 * 
 * @param taskDesc 任务描述
 * @param taskId 任务ID
 * @param prefix 提交前缀
 * @returns {string} 格式化的提交信息
 */
export function generateCommitMessage(
  taskDesc: string,
  taskId?: string,
  prefix: string = 'feat:'
): string {
  const cleanDesc = taskDesc.trim().replace(/\s+/g, ' ');
  
  if (taskId) {
    return `${prefix} ${cleanDesc} (Task ${taskId})`;
  }
  
  return `${prefix} ${cleanDesc}`;
}

/**
 * 检查 Git 仓库状态
 * @returns {object} 仓库状态信息
 */
export function checkGitStatus(): {
  isRepo: boolean;
  isClean: boolean;
  branch: string;
  commitHash: string;
  hasRemote: boolean;
} {
  try {
    // 检查是否是 git 仓库
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    
    const isClean = isWorkspaceClean();
    const branch = getCurrentBranch();
    const commitHash = getCurrentCommit();
    
    // 检查是否有远程仓库
    let hasRemote = false;
    try {
      const remotes = execSync('git remote', { encoding: 'utf-8' });
      hasRemote = remotes.trim() !== '';
    } catch {
      hasRemote = false;
    }
    
    return {
      isRepo: true,
      isClean,
      branch,
      commitHash,
      hasRemote,
    };
  } catch {
    return {
      isRepo: false,
      isClean: false,
      branch: '',
      commitHash: '',
      hasRemote: false,
    };
  }
}

export default {
  gitPull,
  gitCommit,
  generateCommitMessage,
  isWorkspaceClean,
  getCurrentCommit,
  getCurrentBranch,
  checkGitStatus,
};
