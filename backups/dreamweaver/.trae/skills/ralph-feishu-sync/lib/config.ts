/**
 * 配置读取模块
 * 从项目根目录的 .env 文件读取配置
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FeishuConfig {
  enabled: boolean;
  project: {
    name: string;
    id: string;
  };
  base: {
    app_token: string;
    table_id: string;
    view_id: string;
  };
  im: {
    chat_id: string;
    notify_on: {
      task_split: boolean;
      task_complete: boolean;
      daily_digest: boolean;
      milestone: boolean;
    };
    daily_digest_time: string;
    mention_listen: boolean;
    mention_keywords: string[];
    review_doc_path: string;
  };
  sync: {
    mode: 'realtime' | 'batch';
    batch_size: number;
    retry_times: number;
  };
  git: {
    enabled: boolean;
    branch: string;
    pull_before_task: boolean;
    commit_after_task: boolean;
    commit_prefix: string;
  };
}

const DEFAULT_CONFIG: Partial<FeishuConfig> = {
  enabled: false,
  project: {
    name: 'ralph-project',
    id: 'ralph-project',
  },
  im: {
    notify_on: {
      task_split: true,
      task_complete: true,
      daily_digest: false,
      milestone: true,
    },
    daily_digest_time: '18:00',
    mention_listen: true,
    mention_keywords: ['评审', 'review', '需求', 'requirement', '问题', 'issue'],
    review_doc_path: 'docs/reviews/',
  },
  sync: {
    mode: 'realtime',
    batch_size: 50,
    retry_times: 3,
  },
  git: {
    enabled: true,
    branch: 'main',
    pull_before_task: true,
    commit_after_task: true,
    commit_prefix: 'feat:',
  },
};

/**
 * 解析 .env 文件内容
 */
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    // 跳过注释和空行
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return;
    
    const key = line.substring(0, eqIndex).trim();
    let value = line.substring(eqIndex + 1).trim();
    
    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    env[key] = value;
  });
  
  return env;
}

/**
 * 加载配置
 * 从项目根目录的 .env 文件读取
 */
export function loadConfig(): FeishuConfig {
  // 查找项目根目录的 .env 文件
  let currentDir = process.cwd();
  let envPath = path.join(currentDir, '.env');
  
  // 如果当前目录没有，尝试向上查找
  while (!fs.existsSync(envPath) && currentDir !== path.dirname(currentDir)) {
    currentDir = path.dirname(currentDir);
    envPath = path.join(currentDir, '.env');
  }
  
  // 如果找不到 .env 文件，返回默认配置（禁用状态）
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ 未找到 .env 文件，飞书集成将保持禁用状态');
    return {
      ...DEFAULT_CONFIG,
      enabled: false,
    } as FeishuConfig;
  }
  
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = parseEnvFile(content);
    
    // 解析布尔值
    const parseBool = (val: string | undefined, defaultVal: boolean): boolean => {
      if (val === undefined) return defaultVal;
      return val.toLowerCase() === 'true';
    };
    
    // 解析字符串数组
    const parseArray = (val: string | undefined, defaultVal: string[]): string[] => {
      if (!val) return defaultVal;
      return val.split(',').map(s => s.trim());
    };
    
    const config: FeishuConfig = {
      enabled: parseBool(env.RALPH_FEISHU_ENABLED, false),
      project: {
        name: env.RALPH_PROJECT_NAME || DEFAULT_CONFIG.project!.name,
        id: env.RALPH_PROJECT_ID || DEFAULT_CONFIG.project!.id,
      },
      base: {
        app_token: env.FEISHU_BASE_APP_TOKEN || '',
        table_id: env.FEISHU_BASE_TABLE_ID || '',
        view_id: env.FEISHU_BASE_VIEW_ID || '',
      },
      im: {
        chat_id: env.FEISHU_CHAT_ID || '',
        notify_on: {
          task_split: parseBool(env.FEISHU_NOTIFY_TASK_SPLIT, DEFAULT_CONFIG.im!.notify_on.task_split),
          task_complete: parseBool(env.FEISHU_NOTIFY_TASK_COMPLETE, DEFAULT_CONFIG.im!.notify_on.task_complete),
          daily_digest: parseBool(env.FEISHU_NOTIFY_DAILY_DIGEST, DEFAULT_CONFIG.im!.notify_on.daily_digest),
          milestone: parseBool(env.FEISHU_NOTIFY_MILESTONE, DEFAULT_CONFIG.im!.notify_on.milestone),
        },
        daily_digest_time: env.FEISHU_DAILY_DIGEST_TIME || DEFAULT_CONFIG.im!.daily_digest_time,
        mention_listen: parseBool(env.FEISHU_MENTION_LISTEN, DEFAULT_CONFIG.im!.mention_listen),
        mention_keywords: parseArray(env.FEISHU_MENTION_KEYWORDS, DEFAULT_CONFIG.im!.mention_keywords),
        review_doc_path: env.FEISHU_REVIEW_DOC_PATH || DEFAULT_CONFIG.im!.review_doc_path,
      },
      sync: {
        mode: (env.RALPH_SYNC_MODE as 'realtime' | 'batch') || DEFAULT_CONFIG.sync!.mode,
        batch_size: parseInt(env.RALPH_SYNC_BATCH_SIZE || String(DEFAULT_CONFIG.sync!.batch_size)),
        retry_times: parseInt(env.RALPH_SYNC_RETRY_TIMES || String(DEFAULT_CONFIG.sync!.retry_times)),
      },
      git: {
        enabled: parseBool(env.RALPH_GIT_ENABLED, DEFAULT_CONFIG.git!.enabled),
        branch: env.RALPH_GIT_BRANCH || DEFAULT_CONFIG.git!.branch,
        pull_before_task: parseBool(env.RALPH_GIT_PULL_BEFORE_TASK, DEFAULT_CONFIG.git!.pull_before_task),
        commit_after_task: parseBool(env.RALPH_GIT_COMMIT_AFTER_TASK, DEFAULT_CONFIG.git!.commit_after_task),
        commit_prefix: env.RALPH_GIT_COMMIT_PREFIX || DEFAULT_CONFIG.git!.commit_prefix,
      },
    };
    
    return config;
  } catch (error) {
    console.error('❌ 读取 .env 文件失败:', error);
    return {
      ...DEFAULT_CONFIG,
      enabled: false,
    } as FeishuConfig;
  }
}

/**
 * 验证配置是否完整
 */
export function validateConfig(config: FeishuConfig): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!config.enabled) {
    return { valid: true, missing: [] };
  }
  
  if (!config.base.app_token) missing.push('FEISHU_BASE_APP_TOKEN');
  if (!config.base.table_id) missing.push('FEISHU_BASE_TABLE_ID');
  if (!config.im.chat_id) missing.push('FEISHU_CHAT_ID');
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

export default loadConfig;
