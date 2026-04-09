import { Skill, SkillRegistry as ISkillRegistry } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class SkillRegistry implements ISkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private sandboxSkills: Map<string, Set<string>> = new Map();
  private skillsDir: string;
  private builtinSkills: Skill[] = [
    {
      id: 'novel-writing',
      name: '小说写作',
      description: '专注于小说创作，激活读写文件工具，禁用命令执行',
      enabledTools: ['ReadFileTool', 'WriteFileTool'],
      systemPromptFragment: '你是一名专业的网文作者，擅长创作引人入胜的故事情节和生动的人物刻画。请保持语言流畅，情节连贯，人物形象鲜明。',
      triggerKeywords: ['写小说', '创作', '故事', '章节', '情节']
    },
    {
      id: 'code-review',
      name: '代码审查',
      description: '专注于代码审查，激活文件读取和搜索工具，禁用文件写入',
      enabledTools: ['ReadFileTool', 'GrepTool'],
      systemPromptFragment: '你是一名专业的代码审查专家，擅长发现代码中的潜在问题、优化空间和最佳实践。请提供详细的审查意见和改进建议。',
      triggerKeywords: ['代码审查', 'review', '代码分析', '优化', 'bug']
    },
    {
      id: 'file-organizer',
      name: '文件整理',
      description: '专注于文件整理和管理，激活文件操作工具',
      enabledTools: ['ReadFileTool', 'WriteFileTool', 'BashTool'],
      systemPromptFragment: '你是一名专业的文件管理专家，擅长整理和组织文件系统。请保持文件结构清晰，命名规范，分类合理。',
      triggerKeywords: ['整理文件', '文件组织', '重命名', '分类', '归档']
    },
    {
      id: 'researcher',
      name: '资料收集',
      description: '专注于资料收集和研究，激活网络搜索工具',
      enabledTools: ['ReadFileTool', 'WebFetchTool'],
      systemPromptFragment: '你是一名专业的资料收集研究员，擅长通过网络搜索获取准确、全面的信息。请提供详细的资料汇总和分析。',
      triggerKeywords: ['搜索', '资料', '研究', '信息', '数据']
    }
  ];

  constructor(skillsDir: string = '.caiode/skills') {
    this.skillsDir = skillsDir;
    this.ensureSkillsDir();
    this.initializeBuiltinSkills();
    this.loadCustomSkills();
  }

  private ensureSkillsDir(): void {
    const fullPath = path.resolve(this.skillsDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  private initializeBuiltinSkills(): void {
    for (const skill of this.builtinSkills) {
      this.skills.set(skill.id, skill);
    }
  }

  private loadCustomSkills(): void {
    try {
      const skillFiles = fs.readdirSync(this.skillsDir);
      for (const file of skillFiles) {
        if (file.endsWith('.json')) {
          const skillPath = path.join(this.skillsDir, file);
          const content = fs.readFileSync(skillPath, 'utf8');
          const skill = JSON.parse(content) as Skill;
          this.skills.set(skill.id, skill);
        }
      }
    } catch (error) {
      console.error('Error loading custom skills:', error);
    }
  }

  loadSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);
    
    // 保存自定义技能到文件
    if (!this.isBuiltinSkill(skill.id)) {
      const skillPath = path.join(this.skillsDir, `${skill.id}.json`);
      fs.writeFileSync(skillPath, JSON.stringify(skill, null, 2));
    }
  }

  removeSkill(id: string): void {
    if (this.isBuiltinSkill(id)) {
      console.warn('Cannot remove built-in skills');
      return;
    }

    this.skills.delete(id);
    
    // 删除技能文件
    const skillPath = path.join(this.skillsDir, `${id}.json`);
    if (fs.existsSync(skillPath)) {
      fs.unlinkSync(skillPath);
    }
    
    // 从所有沙箱解绑
    for (const [sandbox, skills] of this.sandboxSkills.entries()) {
      skills.delete(id);
    }
  }

  getSandboxSkills(sandboxName: string): Skill[] {
    const skillIds = this.sandboxSkills.get(sandboxName) || new Set();
    return Array.from(skillIds).map(id => this.skills.get(id)).filter((skill): skill is Skill => skill !== undefined);
  }

  bindSkillToSandbox(sandboxName: string, skillId: string): void {
    if (!this.skills.has(skillId)) {
      console.warn(`Skill ${skillId} not found`);
      return;
    }

    if (!this.sandboxSkills.has(sandboxName)) {
      this.sandboxSkills.set(sandboxName, new Set());
    }
    
    this.sandboxSkills.get(sandboxName)!.add(skillId);
    this.saveSandboxSkills();
  }

  unbindSkillFromSandbox(sandboxName: string, skillId: string): void {
    const skills = this.sandboxSkills.get(sandboxName);
    if (skills) {
      skills.delete(skillId);
      this.saveSandboxSkills();
    }
  }

  private isBuiltinSkill(id: string): boolean {
    return this.builtinSkills.some(skill => skill.id === id);
  }

  private saveSandboxSkills(): void {
    const sandboxSkillsPath = path.join(this.skillsDir, 'sandbox-bindings.json');
    const bindings = Object.fromEntries(
      Array.from(this.sandboxSkills.entries()).map(([sandbox, skills]) => [sandbox, Array.from(skills)])
    );
    fs.writeFileSync(sandboxSkillsPath, JSON.stringify(bindings, null, 2));
  }

  private loadSandboxSkills(): void {
    const sandboxSkillsPath = path.join(this.skillsDir, 'sandbox-bindings.json');
    if (fs.existsSync(sandboxSkillsPath)) {
      try {
        const content = fs.readFileSync(sandboxSkillsPath, 'utf8');
        const bindings = JSON.parse(content) as Record<string, string[]>;
        for (const [sandbox, skillIds] of Object.entries(bindings)) {
          this.sandboxSkills.set(sandbox, new Set(skillIds));
        }
      } catch (error) {
        console.error('Error loading sandbox skills:', error);
      }
    }
  }
}