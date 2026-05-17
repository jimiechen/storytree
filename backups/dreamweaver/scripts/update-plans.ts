import fs from 'fs/promises';
import path from 'path';

export interface DirectoryTasks {
  directory: string;
  tasks: string[];
}

/**
 * Scan a directory recursively for markdown files and extract pending tasks (`- [ ]`).
 */
async function scanDirectoryForPendingTasks(dirPath: string): Promise<string[]> {
  const pendingTasks: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const promises = entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subTasks = await scanDirectoryForPendingTasks(fullPath);
        pendingTasks.push(...subTasks);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('- [ ]')) {
            pendingTasks.push(line.trim());
          }
        }
      }
    });

    // Wait for all sub-directories and files to be processed concurrently
    await Promise.all(promises);

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, skip gracefully
      return [];
    }
    throw error;
  }

  return pendingTasks;
}

/**
 * Extract tasks from multiple directories concurrently.
 * Fulfills "支持并发（多开）任务，每个任务独立执行，互不干扰" (Supports concurrent tasks, independent execution).
 */
export async function extractTasksConcurrently(directories: string[]): Promise<DirectoryTasks[]> {
  // Use Promise.all to map over directories, so they are processed in parallel
  const results = await Promise.all(
    directories.map(async (dir) => {
      const tasks = await scanDirectoryForPendingTasks(dir);
      return {
        directory: dir,
        tasks
      };
    })
  );
  
  return results;
}

import { fileURLToPath } from 'url';

// CLI Execution Wrapper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv[1] === __filename) {
  const dreamweaverDocs = path.resolve(__dirname, '../docs');
  const caiodeDocs = path.resolve(__dirname, '../../caiode/docs');

  extractTasksConcurrently([dreamweaverDocs, caiodeDocs]).then(results => {
    console.log('=== StoryTree "更新全部计划" 并发提取报告 ===\n');
    
    results.forEach(result => {
      console.log(`[目录] ${result.directory}`);
      console.log(`[待更新任务清单] (共 ${result.tasks.length} 项)`);
      if (result.tasks.length === 0) {
        console.log('  (无待办任务)\n');
      } else {
        result.tasks.forEach(t => console.log(`  ${t}`));
        console.log('');
      }
    });
  }).catch(err => {
    console.error('执行并发提取任务失败:', err);
  });
}
