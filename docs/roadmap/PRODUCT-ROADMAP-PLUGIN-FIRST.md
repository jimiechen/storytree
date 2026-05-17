# PRODUCT-ROADMAP-PLUGIN-FIRST.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-002  
> **日期**: 2026-05-15  
> **版本**: v2.0 (架构优化后)  
> **状态**: [READY_FOR_REVIEW]

---

## 一、项目定位

**项目名称**: OpenCode Creative Studio  
**一句话定义**: 一个从小说、剧本、分镜、3D 草稿到短视频/长视频生产的模块化 AI 创作工作台。  
**技术底座**: Claude-Code-Style Agent Runtime + OpenCode 组件补充  
**核心形态**: 插件化平台，底座统一、模块独立、能力可插拔。

---

## 二、为什么采用插件化

1. **降低开发风险**: 不必一次性开发完整平台，每个插件独立迭代。
2. **提前商业化**: 单模块可独立售卖，快速验证市场。
3. **按需付费**: 用户只购买需要的模块，降低准入门槛。
4. **组合销售**: 通过组合包提升客单价。
5. **生态扩展**: 未来可开放第三方插件市场。

---

## 三、架构总览

```text
Claude-Code-Style Agent Runtime (底层)
  ├── CreativeQueryEngine    — 会话生命周期、Agent 请求入口
  ├── AgentLoop              — 主循环：模型响应、工具调用、观察结果
  ├── ContextBuilder         — 构造小说、角色、镜头、资产上下文
  ├── TaskRuntime            — 所有生成任务统一调度
  ├── ToolRuntime            — 具体可执行动作注册与执行
  ├── SkillLoader            — 发现 .claude/skills/*/SKILL.md，按需加载
  ├── PluginRuntime          — 插件加载、扩展点、权限系统
  ├── HookPipeline           — 插件生命周期、任务前后触发
  ├── CommandRegistry        — 插件命令、生成命令、导出命令
  ├── StateStore             — 会话状态、项目状态、任务状态
  └── CostTracker            — OpenRouter、图像、视频、TTS 成本统计

OpenCode Creative Core (免费/基础授权)
  ├── Novel Editor Core     — 小说编辑器（Core Product，非插件）
  ├── Project Workspace     — 项目、文件、任务、资产基础管理
  ├── Task Center           — 所有生成任务统一调度
  ├── Asset Library         — 资产对象、版本、来源、引用关系
  ├── Provider Registry     — OpenRouter/图像/视频 Provider 注册
  ├── License Gate          — 单模块付费权限校验
  └── Workflow Orchestrator — 多步骤工作流、批处理

Paid Creative Plugins (独立付费)
  ├── Script Studio
  ├── Storyboard Studio
  ├── 3D Shot Draft
  ├── Image Prompt / Generation
  ├── Video Prompt / Generation
  ├── Voice & Subtitle
  ├── Timeline Draft
  ├── Long Video Manager
  └── Consistency Checker
```

---

## 四、核心概念定义

必须严格使用以下定义：

```text
Skill   = Agent 按需加载的 SKILL.md 任务说明包
Plugin  = 产品模块和商业模块
Provider = 外部服务适配器
Tool    = Agent 可调用的具体执行动作
Task    = 可追踪、可取消、可恢复的任务实例
Asset   = 任务产物
License Gate = 插件和功能权限控制
```

**禁止把 Skill 写成 Plugin。**  
**禁止把 OpenRouter 写成 Skill。**  
**禁止让 UI 直接调用插件生成逻辑。**  
**任务必须通过 Task Runtime 运行。**  
**任务过程中通过 Skill 指导 Agent 调用 Plugin Capability。**

---

## 五、从小说到长视频的完整创作流

```text
Novel Editor Core (小说)
    ↓
Script Studio (剧本)
    ↓
Storyboard Studio (分镜)
    ↓
3D Shot Draft (3D 构图草稿)
    ↓
Image Prompt → Image Generation (图像资产)
    ↓
Video Prompt → Video Generation (视频资产)
    ↓
Timeline Draft + FFmpeg Export (短片合成)
    ↓
Long Video Manager (长视频项目管理)
    ↓
Consistency Checker (一致性校验)
```

---

## 六、Skill 调用插件模块的标准链路

```text
用户在 UI 发起任务
  ↓
Core 创建 Creative Task
  ↓
Task Runtime 检查 License Gate
  ↓
Task Runtime 选择并加载 Skill
  ↓
Skill Loader 读取 .claude/skills/<name>/SKILL.md
  ↓
Agent 根据 Skill 指令调用 Plugin Capability
  ↓
Plugin Capability 调用 Tool / Provider
  ↓
Asset Library 保存产物
  ↓
Task Center 更新状态
```

---

## 七、小说编辑器是 Core Product

**Novel Editor Core** 不是普通插件，而是 OpenCode Creative Studio 的基础入口和所有下游插件的内容源。

Novel Core 内置：

```text
Project
StoryWorld
Character
Location
Timeline
Chapter
Scene
Beat
Draft
Revision
ContinuityNote
```

下游插件都消费 Novel Core 的数据：

```text
Novel Scene
  ↓
Script Studio：改写成剧本场景
  ↓
Storyboard Studio：拆成镜头
  ↓
3D Shot Draft：生成 3D 构图草稿
  ↓
Image Prompt：生成图像提示词
  ↓
Image Generation：生成图像资产
  ↓
Video Prompt：生成视频提示词
  ↓
Video Generation：生成视频资产
  ↓
Timeline Draft：拼接剪辑草稿
  ↓
Long Video Manager：管理长项目结构
```

---

## 八、不做单体，只做模块化生态

| 对比项 | 大一统平台 | OpenCode Creative Studio |
|--------|-----------|-------------------------|
| 开发方式 | 一次性全量开发 | 分模块迭代 |
| 付费方式 | 整体订阅 | 单模块 + 组合包 + 额度 |
| 用户选择 | 被迫购买全部 | 按需购买 |
| 风险 | 高 | 低 |
| 商业化速度 | 慢 | 快 |

---

*[READY_FOR_REVIEW]*
