/**
 * 大纲/细纲类型定义
 *
 * 设计决策：
 * - OutlineNode: 大纲树节点，支持卷 > 章两级层级
 * - OutlineViewMode: 三种视图模式（大纲/细纲/章节）
 * - 细纲数据复用已有 ChapterOutline（goal/conflict/keyPlot），不重复定义
 */

/** 大纲视图模式 */
export type OutlineViewMode = 'outline' | 'detail' | 'chapter';

/** 大纲节点类型 */
export type OutlineNodeType = 'volume' | 'chapter';

/**
 * 大纲树节点
 *
 * 结构：顶层为 volume（卷），children 为 chapter（章）
 * 扁平列表与 children 混合：便于渲染和遍历
 */
export interface OutlineNode {
  /** 唯一标识 */
  id: string;
  /** 节点类型：卷 或 章 */
  type: OutlineNodeType;
  /** 显示标题 */
  title: string;
  /** 排序索引（同级内） */
  orderIndex: number;
  /** 关联的章节ID（仅 chapter 类型） */
  chapterId?: string;
  /** 所属卷 ID（仅 chapter 类型） */
  volumeId?: string;
  /** 是否星标（重要标记） */
  starred?: boolean;
  /** 子节点（仅 volume 类型有值） */
  children?: OutlineNode[];
}
