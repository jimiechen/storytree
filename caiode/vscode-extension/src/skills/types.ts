// 技能接口定义
export interface Skill {
  id: string;
  name: string;
  description: string;
  
  // 激活哪些工具
  enabledTools: string[];       // ['BashTool', 'ReadFileTool', 'WriteFileTool']
  
  // 注入的 system prompt 片段
  systemPromptFragment: string;
  
  // 技能触发词（用于 Agent Loop 识别何时调用）
  triggerKeywords: string[];
}

// 技能注册表接口
export interface SkillRegistry {
  // 加载技能
  loadSkill(id: string): Skill | undefined;
  
  // 列出所有技能
  listSkills(): Skill[];
  
  // 注册技能
  registerSkill(skill: Skill): void;
  
  // 移除技能
  removeSkill(id: string): void;
  
  // 获取沙箱绑定的技能
  getSandboxSkills(sandboxName: string): Skill[];
  
  // 绑定技能到沙箱
  bindSkillToSandbox(sandboxName: string, skillId: string): void;
  
  // 从沙箱解绑技能
  unbindSkillFromSandbox(sandboxName: string, skillId: string): void;
}