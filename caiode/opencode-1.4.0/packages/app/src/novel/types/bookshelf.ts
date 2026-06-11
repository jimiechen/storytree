/**
 * 书架页面 UI 场景类型（非独立领域模型）
 */

/** 书架搜索过滤状态 */
export interface BookshelfFilter {
  keyword: string;
}

/** 浮动组件数据 */
export interface FloatingWidgetData {
  signinDays: number;
  signinStreak: number;
  achievementCount: number;
  achievementTotal: number;
  activityTitle: string;
  totalWords: string;
  onlineUsers: string;
}

/** 工具栏按钮项 */
export interface ToolbarItem {
  id: string;
  label: string;
  icon: string; // 图标标识，实际渲染时映射为 SVG/emoji
  color: string; // Tailwind 色类
  action?: () => void;
}
