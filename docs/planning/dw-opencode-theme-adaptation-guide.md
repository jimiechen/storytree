# DreamWeaver 适配 OpenCode 主题系统指南

## 1. 主题系统对比

### DreamWeaver 主题系统
- **实现方式**: 使用 next-themes 库 + CSS 变量
- **主题定义**: 在 `globals.css` 中硬编码浅色和深色变量
- **切换机制**: 通过 `.dark` 类和 next-themes 状态管理
- **文件位置**: `dreamweaver/src/app/globals.css`

### OpenCode 主题系统
- **实现方式**: 基于 JSON 配置文件 + 动态 CSS 生成
- **主题定义**: 每个主题文件同时定义 `light` 和 `dark` 两种模式
- **切换机制**: 通过 `applyTheme` 函数和媒体查询
- **文件位置**: `opencode/packages/ui/src/theme/themes/`

## 2. 适配步骤

### 步骤 1: 了解 OpenCode 主题结构

OpenCode 主题文件结构:

```json
{
  "$schema": "https://opencode.ai/desktop-theme.json",
  "name": "主题名称",
  "id": "主题ID",
  "light": {
    "palette": {
      "neutral": "#f7f7f7",
      "ink": "#171311",
      "primary": "#dcde8d",
      "success": "#12c905",
      "warning": "#ffdc17",
      "error": "#fc533a",
      "info": "#a753ae",
      "interactive": "#034cff",
      "diffAdd": "#9ff29a",
      "diffDelete": "#fc533a"
    },
    "overrides": {
      // 可选的主题令牌覆盖
    }
  },
  "dark": {
    "palette": {
      // 深色模式颜色
    },
    "overrides": {
      // 可选的主题令牌覆盖
    }
  }
}
```

### 步骤 2: 创建 DreamWeaver 主题文件

在 OpenCode 主题目录中创建 DreamWeaver 主题文件:

**文件路径**: `/workspace/caiode/opencode/packages/ui/src/theme/themes/dreamweaver.json`

```json
{
  "$schema": "https://opencode.ai/desktop-theme.json",
  "name": "DreamWeaver",
  "id": "dreamweaver",
  "light": {
    "palette": {
      "neutral": "#fdfbff",
      "ink": "#1a1b21",
      "primary": "#00658f",
      "success": "#106d20",
      "warning": "#785900",
      "error": "#ba1a1a",
      "info": "#75d1ff",
      "interactive": "#00658f",
      "diffAdd": "#a0f6a0",
      "diffDelete": "#ffdad6"
    },
    "overrides": {
      "text-strong": "#1a1b21",
      "text-base": "#45464f",
      "text-weak": "#767680",
      "surface-base": "#fdfbff",
      "surface-raised-base": "#f1eef4",
      "border-weak-base": "#e1e2ec",
      "icon-base": "#767680"
    }
  },
  "dark": {
    "palette": {
      "neutral": "#111125",
      "ink": "#e2e0fc",
      "primary": "#75d1ff",
      "success": "#83da85",
      "warning": "#ffb954",
      "error": "#ffb4ab",
      "info": "#75d1ff",
      "interactive": "#75d1ff",
      "diffAdd": "#002908",
      "diffDelete": "#93000a"
    },
    "overrides": {
      "text-strong": "#e2e0fc",
      "text-base": "#c6c6ce",
      "text-weak": "#909098",
      "surface-base": "#111125",
      "surface-raised-base": "#1e1e32",
      "border-weak-base": "#333348",
      "icon-base": "#909098"
    }
  }
}
```

### 步骤 3: 适配 DreamWeaver 组件样式

#### 3.1 移除旧的主题系统

1. **移除 next-themes 依赖**:

```bash
# 在 dreamweaver 目录中执行
npm uninstall next-themes
```

2. **移除 ThemeProvider 组件**:

删除 `/workspace/dreamweaver/src/components/ThemeProvider.tsx` 文件

3. **移除 globals.css 中的主题定义**:

保留 Tailwind CSS 导入，移除自定义主题变量定义

#### 3.2 适配组件使用 OpenCode 主题

修改 DreamWeaver 组件，使用 OpenCode 的主题系统:

```tsx
// 从:
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <div className={`bg-${theme === 'dark' ? 'gray-900' : 'white'}`}>
      {/* 组件内容 */}
    </div>
  );
}

// 改为:
import { applyTheme, setColorScheme } from '@opencode/ui/theme';
import dreamweaverTheme from '@opencode/ui/theme/themes/dreamweaver.json';

function MyComponent() {
  // 应用 DreamWeaver 主题
  useEffect(() => {
    applyTheme(dreamweaverTheme);
  }, []);

  // 切换主题模式
  const toggleTheme = () => {
    const currentScheme = document.documentElement.style.getPropertyValue('color-scheme');
    const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme as 'light' | 'dark');
  };

  return (
    <div className="bg-surface text-on-surface">
      {/* 组件内容 */}
    </div>
  );
}
```

### 步骤 4: 集成到 OpenCode 扩展

在 OpenCode 扩展中加载和应用 DreamWeaver 主题:

**文件路径**: `/workspace/caiode/opencode/packages/extensions/ralph-panel/src/theme/index.ts`

```typescript
import { applyTheme, setColorScheme } from '@opencode/ui/theme';
import dreamweaverTheme from '@opencode/ui/theme/themes/dreamweaver.json';

export function initializeTheme() {
  // 应用 DreamWeaver 主题
  applyTheme(dreamweaverTheme);
  
  // 设置默认主题模式
  setColorScheme('auto');
}

export function toggleThemeMode() {
  const currentScheme = document.documentElement.style.getPropertyValue('color-scheme');
  const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
  setColorScheme(newScheme as 'light' | 'dark');
  return newScheme;
}

export function getCurrentThemeMode() {
  const scheme = document.documentElement.style.getPropertyValue('color-scheme');
  return scheme || 'auto';
}
```

## 3. 样式适配最佳实践

### 3.1 使用 OpenCode 主题令牌

| DreamWeaver 变量 | OpenCode 令牌 | 描述 |
|-----------------|---------------|------|
| `--background` | `surface-base` | 背景颜色 |
| `--foreground` | `text-strong` | 前景文本颜色 |
| `--primary` | `primary` | 主色调 |
| `--secondary` | `warning` | 次要色调 |
| `--error` | `error` | 错误颜色 |
| `--success` | `success` | 成功颜色 |
| `--outline` | `border-weak-base` | 边框颜色 |
| `--surface-variant` | `surface-raised-base` | 表面变体颜色 |

### 3.2 适配 Tailwind CSS 类

使用 OpenCode 的 Tailwind CSS 配置，确保类名与主题令牌对应:

```tsx
// 从:
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* 内容 */}
</div>

// 改为:
<div className="bg-surface text-on-surface">
  {/* 内容 */}
</div>
```

### 3.3 处理主题切换

使用 OpenCode 的主题切换机制，确保组件能够响应主题变化:

```tsx
import { useEffect, useState } from 'react';
import { getCurrentThemeMode, toggleThemeMode } from './theme';

function ThemeToggle() {
  const [themeMode, setThemeMode] = useState(getCurrentThemeMode());

  const handleToggle = () => {
    const newMode = toggleThemeMode();
    setThemeMode(newMode);
  };

  return (
    <button onClick={handleToggle}>
      {themeMode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    </button>
  );
}
```

## 4. 技术挑战与解决方案

### 4.1 挑战：CSS 变量命名差异

**解决方案**:
- 创建变量映射表，将 DreamWeaver 的变量名映射到 OpenCode 的主题令牌
- 使用 Tailwind CSS 的自定义类，确保样式一致性

### 4.2 挑战：主题切换机制不同

**解决方案**:
- 替换 next-themes 的 useTheme hook 为 OpenCode 的 setColorScheme 函数
- 使用 OpenCode 的 applyTheme 函数加载主题配置

### 4.3 挑战：组件样式兼容性

**解决方案**:
- 逐步适配组件，先核心组件后次要组件
- 保持 Tailwind CSS 类名的一致性
- 利用 OpenCode 的 UI 组件库，减少自定义样式

## 5. 实施时间线

| 阶段 | 任务 | 时间 |
|------|------|------|
| 阶段 1 | 创建 DreamWeaver 主题文件 | 1 天 |
| 阶段 2 | 移除旧的主题系统 | 1 天 |
| 阶段 3 | 适配核心组件样式 | 2 天 |
| 阶段 4 | 适配次要组件样式 | 2 天 |
| 阶段 5 | 测试和优化 | 1 天 |
| **总计** | | **7 天** |

## 6. 测试计划

### 6.1 功能测试
- [ ] 主题加载正确
- [ ] 浅色/深色模式切换正常
- [ ] 所有组件样式适配正确
- [ ] 响应式设计正常

### 6.2 视觉测试
- [ ] 浅色模式视觉效果
- [ ] 深色模式视觉效果
- [ ] 主题切换动画效果
- [ ] 与 OpenCode 其他部分的视觉一致性

### 6.3 兼容性测试
- [ ] 与 OpenCode 核心功能兼容
- [ ] 与其他扩展兼容
- [ ] 跨浏览器兼容

## 7. 结论

通过以上步骤，DreamWeaver 可以成功适配 OpenCode 的主题系统，实现统一的视觉体验和主题管理。这种适配不仅保持了 DreamWeaver 的设计风格，还利用了 OpenCode 的主题系统优势，为用户提供更一致、更灵活的主题体验。

**预期成果**:
- DreamWeaver 主题在 OpenCode 中正常显示
- 支持浅色和深色两种模式
- 与 OpenCode 的主题系统完全集成
- 保持 DreamWeaver 的设计风格和用户体验

[READY_FOR_REVIEW]