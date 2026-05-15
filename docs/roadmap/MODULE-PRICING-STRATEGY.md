# MODULE-PRICING-STRATEGY.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-006  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、单模块付费策略

### 1.1 基础插件

适合一次性购买或低价订阅。

| 插件 | 定价方式 | 原因 |
|------|---------|------|
| Novel Studio | 一次性 / 低价订阅 | 用户入口，开发可控 |
| Script Studio | 一次性 / 低价订阅 | 与 Novel 强关联 |
| Storyboard Studio | 一次性 / 低价订阅 | 连接文本和视频的关键 |
| 3D Shot Draft | 一次性 / 低价订阅 | 差异化强，视觉价值高 |
| Timeline Draft | 一次性 | 短片闭环工具 |

### 1.2 专业插件

适合中价订阅，持续迭代。

| 插件 | 定价方式 | 原因 |
|------|---------|------|
| Image Generation | 订阅 + 额度 | 可以产生额度收入 |
| Video Generation | 订阅 + 额度 | 成本高但价值大 |
| Long Video Manager | 高级订阅 | 第二年重点 |
| Consistency Checker | 高级订阅 | 高级用户付费能力 |
| Team Collaboration | 按席位订阅 | 团队版商业化 |

### 1.3 Prompt 插件

适合单模块购买，作为生成插件的前置。

| 插件 | 定价方式 | 原因 |
|------|---------|------|
| Image Prompt Plugin | 单模块购买 / 订阅 | 立刻服务图像生成 |
| Video Prompt Plugin | 单模块购买 / 订阅 | 短视频核心 |

---

## 二、组合包策略

### 2.1 组合包定价原则

- 组合包价格 < 单独购买总和的 80%
- 提供明确的用户价值主张
- 支持升级路径（从单模块升级到组合包）

### 2.2 组合包列表

| 套餐 | 包含模块 | 目标用户 | 定价策略 |
|------|---------|---------|---------|
| Writer Pack | Novel + Script | 小说作者、网文作者 | 单模块总和的 75% |
| Visual Story Pack | Script + Storyboard + Image Prompt | 分镜师、短视频策划 | 单模块总和的 70% |
| Short Video Pack | Storyboard + Image + Video + Subtitle + Timeline | 短视频创作者 | 单模块总和的 65% |
| 3D Director Pack | Storyboard + 3D Shot Draft + Camera Tools | 分镜导演、AI 视觉策划 | 单模块总和的 70% |
| Long Video Pack | 全部核心插件 + Consistency + Long Video Manager | 动画团队、IP 内容团队 | 单模块总和的 60% |
| Team Studio Pack | Long Video Pack + Collaboration + Cost Dashboard | 小团队/工作室 | 按席位 + 组合折扣 |

---

## 三、额度策略

### 3.1 额度类型

| 类型 | 计费单位 | 适用场景 |
|------|---------|---------|
| LLM Token | 千 tokens | 文本生成、续写、改写 |
| 图像张数 | 张 | 图像生成 |
| 视频秒数 | 秒 | 视频生成 |
| TTS 字符 | 千字符 | 语音合成 |
| 字幕分钟 | 分钟 | 字幕识别 |
| 批量任务 | 任务数 | 大规模批量操作 |

### 3.2 额度套餐

| 套餐 | 内容 | 目标用户 |
|------|------|---------|
| 试用额度 | 免费，有限额 | 新用户体验 |
| 基础额度包 | 小额充值 | 轻度用户 |
| 专业额度包 | 中额充值，有折扣 | 重度用户 |
| 团队额度包 | 大额充值，有管理后台 | 团队用户 |

### 3.3 额度有效期

- 充值额度：永久有效
- 订阅赠送额度：按月/按年重置
- 试用额度：试用期内有效

---

## 四、试用策略

### 4.1 试用规则

| 属性 | 规则 |
|------|------|
| 试用时长 | 7~14 天（可配置） |
| 功能限制 | 完整功能，但有限额 |
| 额度限制 | 例如：100 次 LLM 调用、10 张图像生成 |
| 到期提醒 | 提前 3 天提醒 |
| 到期后 | 保留数据，只读模式 |

### 4.2 试用转付费路径

```text
试用开始
    ↓
试用中（完整功能 + 有限额）
    ↓
到期提醒（提前 3 天）
    ↓
选择：购买 / 订阅 / 续试用 / 放弃
    ↓
放弃：数据保留，只读模式
```

---

## 五、付费模式总结

| 类型 | 适合模块 | 定价方式 |
|------|---------|---------|
| 一次性购买 | Novel, Script, Storyboard, 3D Shot Draft, Timeline | 固定价格 |
| 订阅 | Image Generation, Video Generation, Long Video Manager, Consistency | 月付/年付 |
| 订阅 + 额度 | 所有生成类插件 | 功能费 + 生成消耗 |
| 按席位订阅 | Team Collaboration | 按用户数 |
| 单独购买 | Skill Pack, 模板包 | 固定价格 |
| 按量充值 | Provider 额度 | 按使用量 |

---

*[READY_FOR_REVIEW]*
