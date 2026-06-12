/**
 * Stitch 设计令牌 (Design Tokens)
 *
 * 从 stitch/stitch_ai_novel_writing_dashboard/04_小说项目工作台/code.html 提取
 * 所有页面/组件必须使用此文件中的令牌，禁止硬编码颜色值
 */

// ==================== 颜色系统 ====================

/** 主色系 — 深紫色主题 */
export const colors = {
  // 主色
  primary: '#6b38d4',
  primaryLight: '#8455ef',
  primaryFixed: '#e9ddff',
  primaryFixedDim: '#d0bcff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#fffbff',
  surfaceTint: '#6d3bd7',

  // 辅助色
  secondary: '#9d4300',
  secondaryContainer: '#fd761a',
  secondaryFixed: '#ffdbca',
  secondaryFixedDim: '#ffb690',
  onSecondary: '#ffffff',

  // 第三色（蓝）
  tertiary: '#0058be',
  tertiaryContainer: '#2170e4',
  tertiaryFixed: '#d8e2ff',
  tertiaryFixedDim: '#adc6ff',
  onTertiary: '#ffffff',

  // 错误色
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  // 背景系 — 淡蓝白基调
  background: '#f8f9ff',
  surface: '#f8f9ff',
  surfaceBright: '#ffffff',
  surfaceDim: '#ccdbf4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e6eeff',
  surfaceContainerHigh: '#dde9ff',
  surfaceContainerHighest: '#d5e3fd',

  // 文字系
  onBackground: '#0d1c2f',
  onSurface: '#0d1c2f',
  onSurfaceVariant: '#494454',
  outline: '#7b7486',
  outlineVariant: '#cbc3d7',

  // 反色
  inverseSurface: '#233144',
  inverseOnSurface: '#ebf1ff',
  inversePrimary: '#d0bcff',
} as const;

// ==================== 字体系统 ====================

export const fonts = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Work Sans', sans-serif",
  label: "'Work Sans', sans-serif",
} as const;

export const fontSizes = {
  headlineLg: '32px',
  headlineMd: '24px',
  headlineSm: '20px',
  bodyLg: '18px',
  bodyMd: '16px',
  labelMd: '14px',
  labelSm: '12px',
} as const;

export const lineHeights = {
  tight: '1.2',
  normal: '1.3',
  relaxed: '1.4',
  loose: '1.7',
  veryLoose: '1.8',
} as const;

export const fontWeights = {
  bold: '700',
  semibold: '600',
  medium: '500',
  regular: '400',
} as const;

// ==================== 间距系统 ====================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  gutter: '20px',
  marginDesktop: '40px',
  marginMobile: '16px',
} as const;

// ==================== 圆角系统 ====================

export const radii = {
  default: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
} as const;

// ==================== 阴影系统 ====================

export const shadows = {
  sm: '0 1px 3px rgba(13, 28, 47, 0.06)',
  md: '0 2px 12px rgba(0, 0, 0, 0.02)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
  buttonPrimary: '0 2px 8px rgba(107, 56, 212, 0.3)',
  buttonPrimaryHover: '0 4px 12px rgba(107, 56, 212, 0.4)',
  card: '0 2px 12px rgba(0, 0, 0, 0.02)',
  panelLeft: '0.125rem 0 0.75rem rgba(0, 0, 0, 0.04)',
  panelRight: '-0.125rem 0 0.75rem rgba(0, 0, 0, 0.04)',
} as const;

// ==================== 渐变系统 ====================

export const gradients = {
  primary: 'linear-gradient(to right, #6b38d4, #6d3bd7)',
  primaryToPink: 'linear-gradient(to right, #a855f7, #ec4899)',
  primaryButton: 'linear-gradient(to right, #6b38d4, #8455ef)',
  surfaceTint: 'linear-gradient(to right, #6d3bd7, transparent)',
} as const;

// ==================== 过渡动画 ====================

export const transitions = {
  fast: '150ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
  scale: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  translateX: 'all 200ms ease-out',
} as const;

// ==================== Tailwind CSS 自定义类映射 ====================

/**
 * 将 design token 映射为 Tailwind class 名的速查表
 * 使用方式: tailwindClass.bg.background → 'bg-[#f8f9ff]'
 */
export const tw = {
  bg: {
    background: 'bg-[#f8f9ff]',
    surface: 'bg-[#f8f9ff]',
    surfaceBright: 'bg-white',
    surfaceLow: 'bg-[#eff4ff]',
    container: 'bg-[#e6eeff]',
    containerHigh: 'bg-[#dde9ff]',
    containerHighest: 'bg-[#d5e3fd]',
    primary: 'bg-[#6b38d4]',
    primaryLight: 'bg-[#8455ef]',
    primaryContainer: 'bg-[#e9ddff]',
    secondaryContainer: 'bg-[#fd761a]',
    tertiaryContainer: 'bg-[#2170e4]',
    errorContainer: 'bg-[#ffdad6]',
  },
  text: {
    onBackground: 'text-[#0d1c2f]',
    onSurface: 'text-[#0d1c2f]',
    onSurfaceVariant: 'text-[#494454]',
    onPrimary: 'text-white',
    primary: 'text-[#6b38d4]',
    outline: 'text-[#7b7486]',
    error: 'text-[#ba1a1a]',
  },
  border: {
    outline: 'border-[#cbc3d7]',
    outlineVariant: 'border-[#cbc3d7]',
    primary: 'border-[#6b38d4]',
  },
} as const;
