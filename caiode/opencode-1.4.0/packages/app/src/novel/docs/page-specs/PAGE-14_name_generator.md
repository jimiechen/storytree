# PAGE-14 名字生成器页级规范

> **PRD 来源**: §3.19 名字生成器（19_名字生成器）
> **页面路径**: `/novel?view=name-generator`
> **状态**: `[READY_FOR_PAGE-14_REVIEW]`

---

## 1. 页面概述

名字生成器是辅助工具页面，提供两种生成模式：
- **随机生成**：基于内置字库随机组合，离线运行
- **AI 智能生成**：调用 LLM 根据用户设定生成（受 FeatureGate 控制，未启用时降级为随机生成 + 提示）

用户可配置：性别（男/女/通用）、风格（简约/古风/玄幻/现代/酷炫/可爱）、名字长度（2-6 字）。

## 2. 页面元素清单

| 元素类型 | 元素名称 | 功能描述 | data-testid |
|----------|----------|----------|-------------|
| 页面标题 | 名字生成器 | 页面标题 | `ng-page-title` |
| 返回链接 | 返回管理中心 | 返回书架 | `ng-back-btn` |
| Tab | 随机生成 | 随机模式 | `ng-tab-random` |
| Tab | AI智能生成 | AI 模式 | `ng-tab-ai` |
| 性别按钮 | ♂ 男 | 男性名字 | `ng-gender-male` |
| 性别按钮 | ♀ 女 | 女性名字 | `ng-gender-female` |
| 性别按钮 | ⚥ 通用 | 中性名字 | `ng-gender-neutral` |
| 风格按钮 | 简约 | 简约风格 | `ng-style-minimal` |
| 风格按钮 | 古风 | 古风名字 | `ng-style-ancient` |
| 风格按钮 | 玄幻 | 玄幻风格 | `ng-style-fantasy` |
| 风格按钮 | 现代 | 现代风格 | `ng-style-modern` |
| 风格按钮 | 酷炫 | 酷炫名字 | `ng-style-cool` |
| 风格按钮 | 可爱 | 可爱风格 | `ng-style-cute` |
| 滑块 | 名字长度 | 调节 2-6 字 | `ng-length-slider` |
| 长度显示 | 当前长度值 | 显示当前值 | `ng-length-value` |
| 生成按钮 | 生成名字 | 生成名字 | `ng-generate-btn` |
| 结果区 | 生成结果 | 显示生成的名字 | `ng-result` |
| 复制按钮 | 复制 | 复制到剪贴板 | `ng-copy-btn` |
| 历史记录 | 历史 | 最近 10 条 | `ng-history` |

## 3. 数据模型

```typescript
// types/name-generator.ts
export type GeneratorMode = 'random' | 'ai';
export type NameGender = 'male' | 'female' | 'neutral';
export type NameStyle = 'minimal' | 'ancient' | 'fantasy' | 'modern' | 'cool' | 'cute';

export interface NameGeneratorConfig {
  mode: GeneratorMode;
  gender: NameGender;
  style: NameStyle;
  length: number; // 2-6
}

export interface GeneratedName {
  text: string;
  config: NameGeneratorConfig;
  createdAt: string; // ISO timestamp
}
```

## 4. 字库设计

每种风格 × 性别组合内置 30+ 字符，随机模式下从字库中按长度抽取组合：

| 风格 | 男（姓氏+名字） | 女 | 通用 |
|------|---------------|-----|------|
| 简约 | 林、陈、王 + 宇、轩、哲 | 苏、沈、顾 + 静、婉、柔 | 叶、言、溪 + 之、安、然 |
| 古风 | 萧、夜、墨 + 珩、渊、珝 | 云、月、琴 + 璃、芷、若 | 风、雪、霜 + 无、念、尘 |
| 玄幻 | 龙、凤、雷 + 霆、焰、弑 | 凰、冰、霜 + 凛、璃、璇 | 玄、冥、幽 + 影、刹、渊 |
| 现代 | 杰、凯、宇 + 浩、俊、睿 | 悦、欣、雨 + 萱、瑶、琳 | 晨、晓、曦 + 辰、光、明 |
| 酷炫 | 烈、焰、刃 + 狂、暴、绝 | 艳、媚、烈 + 娇、辣、飒 | 极、巅、锋 + 锐、狂、绝 |
| 可爱 | 小、阿、宝 + 宝、贝、糖 | 咪、喵、兔 + 糖、果、酱 | 团、圆、软 + 软、糯、甜 |

## 5. AI 模式降级策略

```
if (gates.realLLMEnabled && gates.targetLLMAdapterEnabled) {
  // 调用 LLM 生成（使用 use-llm-generation.ts 框架）
} else {
  // 降级为随机生成 + 显示"AI 模式未启用，已使用随机生成"提示
}
```

## 6. localStorage 持久化

- **Key**: `novel:name-generator:history`
- **存储内容**: `GeneratedName[]`（最近 10 条）
- **限制**: 超过 10 条时移除最旧记录

## 7. FeatureGate

- `nameGeneratorEnabled: true`（PAGE-14 启用）
- AI 模式受 `realLLMEnabled && targetLLMAdapterEnabled` 控制

## 8. Exit Criteria

- [x] 1. 页面标题"名字生成器"可见
- [x] 2. 返回按钮可返回书架
- [x] 3. 两个 Tab（随机/AI）可切换
- [x] 4. 3 个性别按钮可选择
- [x] 5. 6 个风格按钮可选择
- [x] 6. 名字长度滑块 2-6 范围
- [x] 7. 生成按钮可生成名字
- [x] 8. 结果区显示生成的名字
- [x] 9. 复制按钮可复制到剪贴板
- [x] 10. 历史记录显示最近 10 条
- [x] 11. typecheck + UT + precommit + E2E 全部通过
