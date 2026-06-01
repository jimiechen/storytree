# DESIGN_TOKENS.md - 设计令牌规范

> **版本**: v0.1  
> **日期**: 2026-05-31  
> **状态**: ⚠️ Pending 主控审批  
> **用途**: 全局设计变量统一管理

---

## 一、颜色令牌 (Colors)

### 1.1 品牌色

```css
:root {
  /* 主色调 - 紫罗兰渐变 (Pending 审批) */
  --color-primary: #7C3AED;
  --color-primary-hover: #6D28D9;
  --color-primary-light: #A855F7;
  --color-primary-bg: #F5F3FF;

  /* 辅助色 */
  --color-secondary: #06B6D4;
  --color-accent: #F59E0B;
}
```

### 1.2 语义色

```css
:root {
  /* 成功/错误/警告/信息 */
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;

  /* 中性色 */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-border: #E5E7EB;
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-bg-tertiary: #F3F4F6;
}
```

### 1.3 渐变色

```css
:root {
  --gradient-primary: linear-gradient(135deg, #7C3AED, #A855F7);
  --gradient-hero: linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%);
}
```

---

## 二、间距令牌 (Spacing)

采用 **4 倍数系统**，所有间距必须是 4 的倍数：

```css
:root {
  /* 基础单位 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;   /* 特例：用于紧凑场景 */
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
}
```

**使用规则**:
- 元素内边距: `--space-4` ~ `--space-6`
- 区块间距: `--space-6` ~ `--space-12`
- 页面边距: `--space-12` ~ `--space-24`
- **禁止**: 使用非 4 倍数的像素值（除 `--space-5` 外）

---

## 三、字号令牌 (Typography)

```css
:root {
  /* 字体族 */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-family-display: 'Plus Jakarta Sans', sans-serif;

  /* 字号 */
  --text-xs: 12px;    /* 0.75rem */
  --text-sm: 14px;    /* 0.875rem */
  --text-base: 16px;  /* 1rem */
  --text-lg: 18px;    /* 1.125rem */
  --text-xl: 20px;    /* 1.25rem */
  --text-2xl: 24px;   /* 1.5rem */
  --text-3xl: 30px;   /* 1.875rem */
  --text-4xl: 36px;   /* 2.25rem */

  /* 字重 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* 行高 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

---

## 四、圆角令牌 (Border Radius)

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}
```

---

## 五、阴影令牌 (Shadows)

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

---

## 六、断点令牌 (Breakpoints)

```css
:root {
  /* 移动端优先 */
  --breakpoint-sm: 375px;   /* 手机 */
  --breakpoint-md: 768px;   /* 平板 */
  --breakpoint-lg: 1024px;  /* 小桌面 */
  --breakpoint-xl: 1440px;  /* 桌面 */
}
```

---

## 七、Z-Index 层级

```css
:root {
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-toast: 80;
}
```

---

## 八、动画令牌 (Animations)

> **⚠️ P1 阶段禁用动效**

```css
:root {
  /* 过渡时长 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;

  /* 缓动函数 */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## 九、CSS 变量使用规范

### 9.1 在 SolidJS 中使用

```tsx
// ✅ 正确：使用 CSS 变量
<div style={{ color: 'var(--color-primary)' }} />

// ❌ 错误：硬编码颜色
<div style={{ color: '#7C3AED' }} />
```

### 9.2 在 Tailwind 中使用（如启用）

```html
<!-- ✅ 正确 -->
<div class="text-[var(--color-primary)] p-[var(--space-4)]" />

<!-- ❌ 错误 -->
<div class="text-purple-600 p-4" />
```

---

## 十、待审批决策

| 决策项 | 提案值 | 状态 | DECISION_LOG ID |
|--------|-------|------|----------------|
| 主色调 | 紫罗兰渐变 #7C3AED→#A855F7 | **Pending** | D-007 |
| 字体 | Inter + Plus Jakarta Sans | **Pending** | D-008 |
| 圆角风格 | 中等圆润 (8~16px) | **Pending** | D-009 |

---

*设计令牌版本: v0.1*
*最后更新: 2026-05-31*
*审批状态: 待主控批准*
