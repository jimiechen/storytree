import { SandboxRule, RuleResult, ActionContext } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

export class RuleEngine {
  private rulesCache: Map<string, SandboxRule> = new Map();
  private rulesDir: string;

  constructor(rulesDir: string = '.caiode/rules') {
    this.rulesDir = rulesDir;
    this.ensureRulesDir();
  }

  private ensureRulesDir(): void {
    const fullPath = path.resolve(this.rulesDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  // 加载指定沙箱的规则
  loadRules(sandboxName: string): SandboxRule {
    const rulePath = path.join(this.rulesDir, `${sandboxName}.json`);
    
    if (this.rulesCache.has(sandboxName)) {
      return this.rulesCache.get(sandboxName)!;
    }

    try {
      if (fs.existsSync(rulePath)) {
        const content = fs.readFileSync(rulePath, 'utf8');
        const rules = JSON.parse(content) as SandboxRule;
        this.rulesCache.set(sandboxName, rules);
        return rules;
      } else {
        // 生成默认规则
        const defaultRules = this.generateDefaultRules(sandboxName);
        this.saveRules(sandboxName, defaultRules);
        this.rulesCache.set(sandboxName, defaultRules);
        return defaultRules;
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      const defaultRules = this.generateDefaultRules(sandboxName);
      this.rulesCache.set(sandboxName, defaultRules);
      return defaultRules;
    }
  }

  // 生成默认规则
  private generateDefaultRules(sandboxName: string): SandboxRule {
    return {
      allowedPaths: [`src/${sandboxName}/**`],
      deniedPaths: ['node_modules/**', '.git/**'],
      allowedCommands: ['ls', 'cat', 'echo'],
      deniedCommands: ['rm', 'cp', 'mv'],
      allowedModels: ['claude-3-opus-20240229', 'gpt-4-turbo'],
      maxTokensPerRequest: 8192,
      taskScope: `You are an AI assistant working in sandbox ${sandboxName}. Focus on the assigned task.`,
      maxIterations: 50
    };
  }

  // 保存规则
  saveRules(sandboxName: string, rules: SandboxRule): void {
    const rulePath = path.join(this.rulesDir, `${sandboxName}.json`);
    fs.writeFileSync(rulePath, JSON.stringify(rules, null, 2));
    this.rulesCache.set(sandboxName, rules);
  }

  // 评估操作是否符合规则
  evaluate(action: ActionContext): RuleResult {
    const rules = this.loadRules(action.sandboxName);

    switch (action.type) {
      case 'fileRead':
      case 'fileWrite':
        return this.evaluateFileAction(action, rules);
      
      case 'commandExecute':
        return this.evaluateCommandAction(action, rules);
      
      case 'modelCall':
        return this.evaluateModelAction(action, rules);
      
      case 'taskIteration':
        return this.evaluateTaskAction(action, rules);
      
      default:
        return { allowed: true };
    }
  }

  // 评估文件操作
  private evaluateFileAction(action: ActionContext, rules: SandboxRule): RuleResult {
    if (!action.path) {
      return { allowed: false, reason: 'No path provided' };
    }

    // 检查黑名单
    for (const pattern of rules.deniedPaths) {
      if (glob.sync(pattern).some(p => action.path!.startsWith(p))) {
        return {
          allowed: false,
          reason: `Path ${action.path} is in denied paths`,
          violatedRule: 'deniedPaths'
        };
      }
    }

    // 检查白名单
    if (rules.allowedPaths.length > 0) {
      const allowed = rules.allowedPaths.some(pattern => 
        glob.sync(pattern).some(p => action.path!.startsWith(p))
      );
      if (!allowed) {
        return {
          allowed: false,
          reason: `Path ${action.path} is not in allowed paths`,
          violatedRule: 'allowedPaths'
        };
      }
    }

    return { allowed: true };
  }

  // 评估命令执行
  private evaluateCommandAction(action: ActionContext, rules: SandboxRule): RuleResult {
    if (!action.command) {
      return { allowed: false, reason: 'No command provided' };
    }

    const commandName = action.command.split(' ')[0];

    // 检查黑名单
    if (rules.deniedCommands.includes(commandName)) {
      return {
        allowed: false,
        reason: `Command ${commandName} is denied`,
        violatedRule: 'deniedCommands'
      };
    }

    // 检查白名单
    if (rules.allowedCommands.length > 0 && !rules.allowedCommands.includes(commandName)) {
      return {
        allowed: false,
        reason: `Command ${commandName} is not in allowed commands`,
        violatedRule: 'allowedCommands'
      };
    }

    return { allowed: true };
  }

  // 评估模型调用
  private evaluateModelAction(action: ActionContext, rules: SandboxRule): RuleResult {
    if (!action.model) {
      return { allowed: false, reason: 'No model provided' };
    }

    if (!rules.allowedModels.includes(action.model)) {
      return {
        allowed: false,
        reason: `Model ${action.model} is not allowed`,
        violatedRule: 'allowedModels'
      };
    }

    if (action.tokens && action.tokens > rules.maxTokensPerRequest) {
      return {
        allowed: false,
        reason: `Token count ${action.tokens} exceeds limit ${rules.maxTokensPerRequest}`,
        violatedRule: 'maxTokensPerRequest'
      };
    }

    return { allowed: true };
  }

  // 评估任务迭代
  private evaluateTaskAction(action: ActionContext, rules: SandboxRule): RuleResult {
    if (action.iteration && action.iteration > rules.maxIterations) {
      return {
        allowed: false,
        reason: `Iteration count ${action.iteration} exceeds limit ${rules.maxIterations}`,
        violatedRule: 'maxIterations'
      };
    }

    return { allowed: true };
  }

  // 列出所有可用的规则文件
  listRules(): string[] {
    const pattern = path.join(this.rulesDir, '*.json');
    return glob.sync(pattern).map(p => path.basename(p, '.json'));
  }

  // 删除规则
  deleteRules(sandboxName: string): void {
    const rulePath = path.join(this.rulesDir, `${sandboxName}.json`);
    if (fs.existsSync(rulePath)) {
      fs.unlinkSync(rulePath);
    }
    this.rulesCache.delete(sandboxName);
  }
}