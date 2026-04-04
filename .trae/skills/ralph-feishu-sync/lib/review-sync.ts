/**
 * 评审同步模块
 * 保存评审文档到本地文件系统
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 确保目录存在
 */
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 保存评审文档
 * 
 * @param filePath 文件路径
 * @param content 文档内容
 * @returns {Promise<{success: boolean; message: string}>}
 */
export async function saveReviewDoc(
  filePath: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 确保目录存在
    const dir = path.dirname(filePath);
    ensureDir(dir);
    
    // 写入文件
    fs.writeFileSync(filePath, content, 'utf-8');
    
    return {
      success: true,
      message: `评审文档已保存: ${filePath}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ 保存评审文档失败:', errorMsg);
    return {
      success: false,
      message: `保存失败: ${errorMsg}`,
    };
  }
}

/**
 * 读取评审文档
 * 
 * @param filePath 文件路径
 * @returns {string | null} 文档内容
 */
export function readReviewDoc(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('❌ 读取评审文档失败:', error);
    return null;
  }
}

/**
 * 更新评审文档状态
 * 
 * @param filePath 文件路径
 * @param status 新状态
 * @param note 备注
 * @returns {Promise<{success: boolean; message: string}>}
 */
export async function updateReviewStatus(
  filePath: string,
  status: '已确认' | '已采纳' | '已拒绝' | '已转需求' | '已转任务',
  note?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const content = readReviewDoc(filePath);
    if (!content) {
      return {
        success: false,
        message: '评审文档不存在',
      };
    }
    
    // 更新状态
    let updatedContent = content;
    
    // 根据状态更新复选框
    const statusMap: Record<string, string> = {
      '已确认': '- [x] 已确认',
      '已采纳': '- [x] 已采纳',
      '已拒绝': '- [x] 已拒绝',
      '已转需求': '- [x] 已转需求',
      '已转任务': '- [x] 已转任务',
    };
    
    for (const [key, value] of Object.entries(statusMap)) {
      const regex = new RegExp(`- \\[ \\] ${key}`, 'g');
      updatedContent = updatedContent.replace(regex, key === status ? value : `- [ ] ${key}`);
    }
    
    // 添加更新记录
    const updateRecord = `\n### 状态更新 (${new Date().toLocaleString()})\n- 状态: ${status}${note ? `\n- 备注: ${note}` : ''}\n`;
    updatedContent = updatedContent.replace(
      /(### 后续讨论\n)/,
      `$1${updateRecord}`
    );
    
    // 保存
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    
    return {
      success: true,
      message: `评审状态已更新: ${status}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `更新失败: ${errorMsg}`,
    };
  }
}

/**
 * 列出所有评审文档
 * 
 * @param basePath 基础路径
 * @returns {Array<{path: string; name: string; date: string}>}
 */
export function listReviewDocs(
  basePath: string = 'docs/reviews/'
): Array<{ path: string; name: string; date: string }> {
  try {
    if (!fs.existsSync(basePath)) {
      return [];
    }
    
    const files = fs.readdirSync(basePath);
    const docs: Array<{ path: string; name: string; date: string }> = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(basePath, file);
        const stats = fs.statSync(filePath);
        
        docs.push({
          path: filePath,
          name: file,
          date: stats.mtime.toISOString(),
        });
      }
    }
    
    // 按日期倒序
    return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('❌ 列出评审文档失败:', error);
    return [];
  }
}

export default {
  saveReviewDoc,
  readReviewDoc,
  updateReviewStatus,
  listReviewDocs,
};
