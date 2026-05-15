# TWO-YEAR-DEVELOPMENT-PLAN.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-005  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 阶段总览

| 阶段 | 时间 | 核心目标 | 商业目标 |
|------|------|---------|---------|
| Phase 0 | 2026.05-2026.06 | 插件底座与项目路书 | 确定商业架构 |
| Phase 1 | 2026.06-2026.08 | Story-to-Shot MVP | 内测 Writer Pack |
| Phase 2 | 2026.09-2026.11 | 分镜 + 3D Shot Draft | 推出 Visual Story Pack |
| Phase 3 | 2026.12-2027.02 | 图像/视频 Prompt 与资产库 | Short Video Pack Alpha |
| Phase 4 | 2027.03-2027.05 | 图像/视频 Provider 接入 | 生成额度计费 |
| Phase 5 | 2027.06-2027.08 | 短片时间线与 FFmpeg 合成 | Short Video Pack 正式版 |
| Phase 6 | 2027.09-2027.11 | 长视频项目管理 | Long Video Pack Beta |
| Phase 7 | 2027.12-2028.02 | 一致性系统与批量生产 | Studio Pack |
| Phase 8 | 2028.03-2028.05 | 插件市场与团队协作 | 商业化 v2.0 |

---

## Phase 0：插件底座与项目路书 (2026.05-2026.06)

### 目标

先不做业务大而全，先把插件化开发的地基确定下来。

### 插件

- Plugin Runtime
- Plugin Manifest
- License Manager Mock
- Provider Registry
- Skill Registry
- Task Center Core
- Asset Library Core
- Workspace Extension Points

### Skill

- 无（本阶段为底座建设）

### Provider

- Mock LLM Provider
- Mock Image Provider
- Mock Video Provider

### 验收标准

- 能加载一个 Mock 插件
- 能在工作台注册一个页面
- 能在命令面板注册一个命令
- 能创建一个 Mock 任务
- 能写入一个 Mock 资产
- 能判断插件是否已授权
- 能显示"未购买/试用/已购买/过期"

### 商业版本

- 不收费，但埋好付费点
- 每个插件都有 SKU
- 每个功能有 feature flag
- 每个生成任务有 cost metadata
- 每个 Provider 有 quota metadata

---

## Phase 1：Story-to-Shot MVP (2026.06-2026.08)

### 目标

完成从故事到镜头的最小闭环，形成第一个可演示产品。

### 插件

- **Novel Studio Plugin**
  - 项目设定
  - 世界观
  - 角色卡
  - 章节大纲
  - 章节正文
  - AI 续写 Mock
  - AI 改写 Mock
  - AI 摘要 Mock

- **Script Studio Plugin**
  - 章节转剧本场景
  - 场景头
  - 动作行
  - 对白
  - 旁白
  - 场景摘要

- **Storyboard Studio Plugin Alpha**
  - 剧本场景转 Shot 卡
  - 景别
  - 机位
  - 镜头运动
  - 情绪目标
  - 图像 prompt 草稿

### Skill

- NovelSkill
- ScriptConvertSkill
- StoryboardGenerateSkill

### Provider

- OpenRouter Text Provider (可选，保留 Mock 模式)

### 验收标准

- 输入一个故事概念
- 生成 3 个角色
- 生成 1 个章节大纲
- 生成 3 个剧本场景
- 每个场景生成 3 个 Shot
- 每个 Shot 有镜头描述和 prompt 草稿
- 所有任务进入 Task Center
- 所有产物进入 Asset Library

### 商业版本

- Writer Pack 内测版
- 包含 Novel Studio + Script Studio
- Storyboard Alpha 免费试用

---

## Phase 2：分镜 + 3D Shot Draft (2026.09-2026.11)

### 目标

让用户能把分镜变成 3D 构图草稿。

### 插件

- **3D Shot Draft Plugin**
  - Three.js 3D 视口
  - 地面网格
  - 方位轴
  - 透视相机
  - OrbitControls
  - TransformControls
  - 基础几何体：圆柱、方块、球体、平面、墙体
  - 角色占位
  - 相机预设
  - 导出当前视角 PNG
  - 保存 Shot3DDraft

- **Shot Camera Plugin**
  - 相机位置
  - 相机目标
  - FOV
  - 景别模板
  - 镜头运动模板
  - Godot 风格 Perspective View
  - 镜头参考图导出

### Skill

- Shot3DLayoutSkill
- CameraPresetSkill

### Provider

- 无新增

### 验收标准

- 每个 Shot 能打开 3D 草稿
- 能生成圆柱/方块/角色占位
- 能旋转、平移、缩放视角
- 能移动物体
- 能调整相机
- 能导出当前视角参考图
- 参考图自动进入 Asset Library

### 商业版本

- Visual Story Pack
- = Storyboard Studio + 3D Shot Draft + Shot Camera

---

## Phase 3：图像/视频 Prompt 与资产库 (2026.12-2027.02)

### 目标

把分镜和 3D 草稿转成图像/视频生成资产包。

### 插件

- **Image Prompt Plugin**
  - Shot → 图像 prompt
  - 角色视觉描述
  - 场景视觉描述
  - 风格模板
  - 负面 prompt
  - 参考图绑定
  - Prompt 版本管理

- **Video Prompt Plugin**
  - Shot → 视频 prompt
  - 镜头运动描述
  - 角色动作描述
  - 时长
  - 帧率建议
  - 运动强度
  - 视频生成参数

- **Asset Library Pro Plugin**
  - 资产标签
  - 版本管理
  - 引用关系
  - Shot 绑定
  - Prompt 绑定
  - 参考图绑定
  - 批量导出

### Skill

- ImagePromptGenerateSkill
- VideoPromptGenerateSkill
- AssetOrganizeSkill

### Provider

- 无新增（Prompt 阶段不接真实生成）

### 验收标准

- 每个 Shot 能生成图像 prompt
- 每个 Shot 能生成视频 prompt
- 每个 prompt 有版本
- 每个 prompt 能绑定参考图
- 资产库能按项目/场景/Shot 筛选

### 商业版本

- Short Video Pack Alpha
- = Storyboard + Image Prompt + Video Prompt + Asset Library Pro

---

## Phase 4：图像/视频 Provider 接入 (2027.03-2027.05)

### 目标

开始接入真实图像/视频生成服务，但仍通过 Provider 抽象和任务中心管理。

### 插件

- **Image Generation Plugin**
  - 图像 Provider 注册
  - 生成任务
  - 候选图
  - 失败重试
  - 成本记录
  - 结果入库

- **Video Generation Plugin**
  - 视频 Provider 注册
  - Shot 视频生成
  - 候选视频
  - 失败重试
  - 任务队列
  - 结果入库

### Skill

- ImageGenerateSkill
- VideoGenerateSkill

### Provider

- ImageGenerationProvider
- VideoGenerationProvider
- OpenRouterTextProvider
- TTSProvider

### 验收标准

- 能对一个 Shot 生成候选图
- 能把候选图保存到资产库
- 能对一个 Shot 创建视频生成任务
- 能查看任务状态
- 失败任务可重试
- 生成成本可记录

### 商业版本

- 插件订阅 + 生成额度
- Image Generation Plugin 收功能费
- 图像生成消耗走额度
- Video Generation Plugin 收功能费
- 视频生成消耗走额度

---

## Phase 5：短片时间线与 FFmpeg 合成 (2027.06-2027.08)

### 目标

把多个镜头素材组织成 30-90 秒短片草稿。

### 插件

- **Timeline Draft Plugin**
  - 镜头排序
  - 时长设置
  - 图片/视频片段放入时间线
  - 字幕轨
  - 旁白轨
  - 背景音乐占位
  - 转场标记
  - 预览草稿

- **FFmpeg Export Plugin**
  - 图片序列合成
  - 视频片段拼接
  - 字幕烧录
  - 音频合成
  - 导出 mp4
  - 导出日志

### Skill

- TimelineEditSkill
- FFmpegExportSkill

### Provider

- FFmpegProvider

### 验收标准

- 能把 5-10 个 Shot 片段放入时间线
- 能设置每个片段时长
- 能生成字幕
- 能添加旁白音频或占位
- 能导出 30-90 秒 mp4 草稿

### 商业版本

- Short Video Pack 正式版
- = Storyboard + Image/Video Prompt + Image/Video Generation + Timeline + FFmpeg Export

---

## Phase 6：长视频项目管理 (2027.09-2027.11)

### 目标

从短片扩展到长视频生产管理，但不追求全自动成片。

### 插件

- **Long Video Manager Plugin**
  - 长视频项目
  - 章节
  - 场景
  - 镜头
  - 素材完成度
  - 批量任务
  - 进度看板
  - 版本管理

- **Batch Generation Plugin**
  - 批量生成 Shot
  - 批量生成 prompt
  - 批量提交图像任务
  - 批量提交视频任务
  - 批量重试
  - 批量导出

### Skill

- BatchTaskSkill
- ProgressTrackSkill

### Provider

- 无新增

### 验收标准

- 能创建 10-30 分钟视频项目
- 能拆成章节/场景/镜头
- 能查看每个场景完成度
- 能批量生成 prompt
- 能批量提交生成任务
- 能查看批量任务状态

### 商业版本

- Long Video Pack Beta
- = Long Video Manager + Batch Generation + Asset Library Pro

---

## Phase 7：一致性系统与半自动生产 (2027.12-2028.02)

### 目标

解决长视频最核心的角色一致性、风格一致性、剧情连续性。

### 插件

- **Consistency Checker Plugin**
  - 角色一致性检查
  - 场景一致性检查
  - 风格一致性检查
  - 剧情连续性检查
  - Prompt 差异检查
  - 资产差异检查

- **Style Bible Plugin**
  - 角色视觉圣经
  - 场景视觉圣经
  - 镜头语言模板
  - 色彩风格模板
  - Prompt 锁定字段
  - 参考图管理

- **Human Review Gate Plugin**
  - 人工审核节点
  - 通过/驳回
  - 修订建议
  - 版本对比
  - 批量确认

### Skill

- ConsistencyCheckSkill
- StyleBibleGenerateSkill
- HumanReviewSkill

### Provider

- 无新增

### 验收标准

- 系统能检查同一角色在多个 Shot 中的描述差异
- 系统能检查同一场景风格偏移
- 系统能输出一致性风险报告
- 批量生产流程中可以插入人工确认

### 商业版本

- Studio Pack
- = Long Video Pack + Consistency + Style Bible + Human Review Gate

---

## Phase 8：插件市场、团队协作与商业化 v2.0 (2028.03-2028.05)

### 目标

把产品从单机/小团队工具升级为可商业化平台。

### 插件

- **Team Collaboration Plugin**
  - 团队工作区
  - 角色权限
  - 评论
  - 审阅
  - 任务分配
  - 版本审批

- **Plugin Marketplace**
  - 插件安装
  - 插件更新
  - 插件购买
  - Skill Pack 购买
  - 模板购买
  - License 管理

- **Publishing Pack Plugin**
  - 短视频标题
  - 简介
  - 标签
  - 封面文案
  - 发布素材包
  - 平台格式检查

### Skill

- TeamSyncSkill
- MarketplaceSearchSkill
- PublishingPrepareSkill

### Provider

- 无新增

### 验收标准

- 用户能按模块购买插件
- 用户能安装/卸载插件
- 团队能协作审阅项目
- 项目能导出完整发布包
- 系统能统计插件使用和生成成本

### 商业版本

- Creative Production Studio v2.0

---

*[READY_FOR_REVIEW]*
