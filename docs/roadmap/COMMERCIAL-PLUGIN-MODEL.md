# COMMERCIAL-PLUGIN-MODEL.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-004  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、免费核心能力

基础层只提供最小工作台能力，目的是让用户能进入生态。

| 模块 | 是否付费 | 说明 |
|------|---------|------|
| Workspace Core | 免费/基础授权 | 项目、文件、任务、资产基础管理 |
| Plugin Runtime | 免费 | 插件加载、扩展点、权限系统 |
| Mock Provider | 免费 | 用于试用和演示 |
| Basic Asset Library | 免费 | 基础资产管理 |
| Basic Task Center | 免费 | 本地任务状态和日志 |

---

## 二、单模块付费插件

每个创作环节做成独立付费插件。

| 插件 | 付费方式 | 核心价值 |
|------|---------|---------|
| Novel Studio Plugin | 单模块购买 / 订阅 | 小说、角色、世界观、章节 |
| Script Studio Plugin | 单模块购买 / 订阅 | 小说转剧本、对白、动作行 |
| Storyboard Studio Plugin | 单模块购买 / 订阅 | 剧本转分镜、镜头卡 |
| 3D Shot Draft Plugin | 单模块购买 / 订阅 | Three.js 3D 镜头草稿 |
| Image Prompt Plugin | 单模块购买 / 订阅 | 图像提示词与参考图 |
| Image Generation Plugin | 订阅 + 额度 | 接入图像生成 Provider |
| Video Prompt Plugin | 单模块购买 / 订阅 | 视频提示词、镜头运动 |
| Video Generation Plugin | 订阅 + 额度 | 接入视频生成 Provider |
| Voice & Subtitle Plugin | 单模块购买 / 额度 | 旁白、字幕、TTS |
| Timeline Draft Plugin | 单模块购买 | 短片时间线、FFmpeg 合成 |
| Long Video Manager Plugin | 高级订阅 | 长视频项目、批量任务 |
| Consistency Plugin | 高级订阅 | 角色/风格/剧情一致性 |
| Team Collaboration Plugin | 团队订阅 | 多人协作、权限、审阅 |

---

## 三、插件组合包

为了提升客单价，设计组合包。

| 套餐 | 包含模块 | 目标用户 |
|------|---------|---------|
| Writer Pack | Novel + Script | 小说作者、网文作者 |
| Visual Story Pack | Script + Storyboard + Image Prompt | 分镜师、短视频策划 |
| Short Video Pack | Storyboard + Image + Video + Subtitle + Timeline | 短视频创作者 |
| 3D Director Pack | Storyboard + 3D Shot Draft + Camera Tools | 分镜导演、AI 视觉策划 |
| Long Video Pack | 全部核心插件 + Consistency + Long Video Manager | 动画团队、IP 内容团队 |
| Team Studio Pack | Long Video Pack + Collaboration + Cost Dashboard | 小团队/工作室 |

---

## 四、生成额度

LLM、图像、视频、TTS 都不直接混入插件售价，而作为额度或 Provider 成本单独管理。

```text
插件费 = 功能使用权
生成额度 = 模型/接口消耗
Skill Pack = 高级提示词/工作流模板
```

| 能力 | 额度计费方式 |
|------|-------------|
| LLM 调用 | 按 token 数计费 |
| 图像生成 | 按张数计费 |
| 视频生成 | 按秒数/分辨率计费 |
| TTS | 按字符数计费 |
| 字幕识别 | 按分钟计费 |
| 大规模批量任务 | 按任务数计费 |

---

## 五、Skill Pack

Skill Pack 是高级提示词/工作流模板，单独售卖。

| Skill Pack | 内容 | 定价方式 |
|-----------|------|---------|
| Novel Skill Pack | 小说续写、改写、摘要模板 | 单独购买 |
| Script Skill Pack | 剧本格式转换、对白优化模板 | 单独购买 |
| Shot Design Skill Pack | 分镜设计、镜头语言模板 | 单独购买 |
| Image Prompt Skill Pack | 图像提示词优化、风格模板 | 单独购买 |
| Video Prompt Skill Pack | 视频提示词、运动描述模板 | 单独购买 |
| Editing Skill Pack | 剪辑节奏、转场模板 | 单独购买 |

---

## 六、模板包

模板包是预设的项目结构、角色卡、场景模板等。

| 模板包 | 内容 | 定价方式 |
|--------|------|---------|
| 网文小说模板 | 角色卡、世界观、章节结构 | 单独购买 |
| 短视频剧本模板 | 15秒/30秒/60秒剧本结构 | 单独购买 |
| 分镜模板 | 常见景别、机位、运动模板 | 单独购买 |
| 3D 场景模板 | 室内/室外/战斗场景预设 | 单独购买 |

---

## 七、团队版

团队版提供多人协作能力。

| 功能 | 说明 |
|------|------|
| 团队工作区 | 共享项目空间 |
| 角色权限 | 管理员/编辑/查看者 |
| 评论 | 资产和任务评论 |
| 审阅 | 版本审批流程 |
| 任务分配 | 指派任务给团队成员 |
| 成本看板 | 团队额度使用统计 |

定价方式：按席位订阅。

---

## 八、License 状态

每个插件都有独立的 License 状态。

| 状态 | 说明 | UI 展示 |
|------|------|---------|
| not_installed | 未安装 | "未安装，点击了解" |
| trial | 试用中 | "试用中，剩余 X 天" |
| purchased | 已购买 | "已购买" |
| expired | 已过期 | "已过期，点击续费" |
| quota_exceeded | 额度不足 | "额度不足，点击充值" |

---

## 九、试用模式

每个付费插件默认提供试用模式。

| 属性 | 说明 |
|------|------|
| 试用时长 | 7~14 天（可配置） |
| 功能限制 | 完整功能，但有限额 |
| 额度限制 | 例如：100 次 LLM 调用、10 张图像生成 |
| 到期提醒 | 提前 3 天提醒 |
| 到期后 | 保留数据，只读模式 |

---

*[READY_FOR_REVIEW]*
