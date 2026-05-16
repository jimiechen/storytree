# PLUGIN-LOAD-AND-LICENSE-FLOW.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-013  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、插件加载流程

```text
Plugin Runtime 加载插件
  ↓
解析 Plugin Manifest
  ↓
检查依赖（coreVersion, plugins, providers, skills）
  ↓
注册 Extension Points（pages, panels, commands, assetTypes, taskTypes）
  ↓
注册 Plugin Capabilities
  ↓
激活插件（active）
  ↓
触发 Hook：plugin.activated
```

---

## 二、License Gate 校验流程

```text
用户发起任务
  ↓
Core 创建 Creative Task
  ↓
Task Runtime 检查 License Gate
  ↓
License Gate 查询插件状态
  ↓
状态判断：
  - not_installed → 提示安装
  - trial → 检查试用天数
  - purchased → 允许执行
  - expired → 提示续费
  - quota_exceeded → 提示充值
  ↓
允许执行 → 继续任务
拒绝执行 → 返回错误，提示升级
```

---

## 三、License 状态机

```text
not_installed
    ↓ 安装
inactive
    ↓ 启用
trial
    ↓ 购买
purchased
    ↓ 过期
expired
    ↓ 续费
purchased
    ↓ 额度用完
quota_exceeded
    ↓ 充值
purchased
```

---

## 四、UI 状态展示

| 状态 | UI 展示 |
|------|---------|
| not_installed | "未安装，点击了解" |
| trial | "试用中，剩余 X 天" |
| purchased | "已购买" |
| expired | "已过期，点击续费" |
| quota_exceeded | "额度不足，点击充值" |

---

## 五、试用模式

| 属性 | 规则 |
|------|------|
| 试用时长 | 7~14 天（可配置） |
| 功能限制 | 完整功能，但有限额 |
| 额度限制 | 例如：100 次 LLM 调用、10 张图像生成 |
| 到期提醒 | 提前 3 天提醒 |
| 到期后 | 保留数据，只读模式 |

---

*[READY_FOR_REVIEW]*
