# PRODUCT-ROADMAP-PLUGIN-FIRST.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-002  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、项目定位

**项目名称**: OpenCode Creative Studio  
**一句话定义**: 一个从小说、剧本、分镜、3D 草稿到短视频/长视频生产的模块化 AI 创作工作台。  
**技术底座**: 基于 OpenCode 二次开发  
**核心形态**: 插件化平台，底座统一、模块独立、能力可插拔。

---

## 二、为什么采用插件化

1. **降低开发风险**: 不必一次性开发完整平台，每个插件独立迭代。
2. **提前商业化**: 单模块可独立售卖，快速验证市场。
3. **按需付费**: 用户只购买需要的模块，降低准入门槛。
4. **组合销售**: 通过组合包提升客单价。
5. **生态扩展**: 未来可开放第三方插件市场。

---

## 三、OpenCode Core 与 Paid Plugins 的关系

```text
OpenCode Creative Core (免费/基础授权)
  ├── Workspace Core      — 项目、文件、任务、资产基础管理
  ├── Plugin Runtime      — 插件加载、扩展点、权限系统
  ├── License Manager     — 单模块付费权限校验
  ├── Task Center         — 所有生成任务统一调度
  ├── Asset Library       — 资产对象、版本、来源、引用关系
  ├── Provider Registry   — OpenRouter/图像/视频 Provider 注册
  └── Skill Registry      — Skill 注册与调用

Paid Creative Plugins (独立付费)
  ├── Novel Studio
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

## 四、从小说到长视频的完整创作流

```text
Novel Studio (小说)
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

## 五、插件优先开发原则

1. **不做大一统平台**: 每个模块独立开发、独立测试、独立发布。
2. **Mock 先行**: 所有 Provider 先实现 Mock 版本，不接真实 API。
3. **License Gate 贯穿始终**: 每个插件能力都经过权限校验。
4. **任务中心统一调度**: 所有 AI 生成任务进入 Task Center，统一状态管理。
5. **资产库统一存储**: 所有产物进入 Asset Library，统一版本和引用关系。

---

## 六、不做单体，只做模块化生态

| 对比项 | 大一统平台 | OpenCode Creative Studio |
|--------|-----------|-------------------------|
| 开发方式 | 一次性全量开发 | 分模块迭代 |
| 付费方式 | 整体订阅 | 单模块 + 组合包 + 额度 |
| 用户选择 | 被迫购买全部 | 按需购买 |
| 风险 | 高 | 低 |
| 商业化速度 | 慢 | 快 |

---

*[READY_FOR_REVIEW]*
