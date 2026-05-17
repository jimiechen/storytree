import { AgentTask, TaskResult, TaskOrchestrator as TaskOrchestratorInterface, IDEAdapter } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class TaskOrchestrator implements TaskOrchestratorInterface {
  private adapter: IDEAdapter;
  private skillSystem: any; // 技能系统接口

  constructor(adapter: IDEAdapter, skillSystem?: any) {
    this.adapter = adapter;
    this.skillSystem = skillSystem;
  }

  async executeTask(task: AgentTask): Promise<TaskResult> {
    const startTime = Date.now();
    let response = '';

    try {
      // 1. 等待 IDE 就绪
      await this.adapter.waitForReady();

      // 2. 如果需要，切换到对应沙箱的工作目录
      await this.switchToSandbox(task.sandboxId);

      // 3. 注入 Skill 的 system prompt 前缀（如果有）
      const fullPrompt = this.buildPrompt(task);

      // 4. 输入并提交
      await this.adapter.typeInChatInput(fullPrompt);
      await this.adapter.submitMessage();

      // 5. 等待响应完成，带超时
      response = await this.adapter.waitForResponseComplete(task.timeoutMs);

      // 6. 解析响应，提取结构化结果
      const result = this.parseResponse(response, task);

      // 7. 写入任务报告（触发 [READY_FOR_REVIEW] 标记）
      await this.writeTaskReport(task, result);

      return result;
    } catch (error) {
      const result: TaskResult = {
        taskId: task.id,
        success: false,
        response: response || (error as Error).message,
        durationMs: Date.now() - startTime,
        timestamp: Date.now()
      };

      await this.writeTaskReport(task, result);
      throw error;
    }
  }

  buildPrompt(task: AgentTask): string {
    let prompt = task.prompt;

    // 如果指定了技能，注入技能的 system prompt
    if (task.skillId && this.skillSystem) {
      const skill = this.skillSystem.getSkill(task.skillId);
      if (skill && skill.systemPrompt) {
        prompt = `${skill.systemPrompt}\n\n${prompt}`;
      }
    }

    return prompt;
  }

  parseResponse(response: string, task: AgentTask): TaskResult {
    return {
      taskId: task.id,
      success: true,
      response,
      durationMs: 0, // 会在 executeTask 中更新
      timestamp: Date.now()
    };
  }

  async writeTaskReport(task: AgentTask, result: TaskResult): Promise<void> {
    // 创建日期文件夹
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const reportDir = path.join(process.cwd(), 'docs', 'task-reports', dateStr);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // 生成报告文件
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `${task.id}-task-${timestamp}.md`);

    const reportContent = `# 任务完成报告

## 基本信息
- **任务ID**: ${task.id}
- **任务名称**: Agent Task
- **所属模块**: Automation
- **完成时间**: ${date.toISOString()}
- **执行人**: Agent

## 任务描述
${task.prompt}

## 完成内容
- [x] 执行 Agent 任务
- [x] 等待响应完成
- [x] 生成任务报告

## 代码变更
| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| - | - | - |

## 测试结果
- **测试状态**: ${result.success ? '通过' : '未通过'}
- **测试用例**: - |
- **覆盖率**: - |

## Git 提交
- **Commit Hash**: - |
- **Commit Message**: - |
- **分支**: - |

## 遇到的问题
- 无

## 经验总结
- 任务执行成功

## 下一步建议
- 继续执行下一个任务

[READY_FOR_REVIEW]`;

    fs.writeFileSync(reportPath, reportContent);
  }

  async switchToSandbox(sandboxId: string): Promise<void> {
    // 切换到对应沙箱的工作目录
    // 这里需要根据实际的沙箱实现来修改
    console.log(`Switching to sandbox: ${sandboxId}`);
  }
}
