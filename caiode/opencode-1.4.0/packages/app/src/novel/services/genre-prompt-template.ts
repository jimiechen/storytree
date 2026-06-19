/**
 * @file services/genre-prompt-template.ts
 * @description 类型化 Prompt 模板 — P1-B 服务层
 *
 * 为不同小说类型提供静态 prompt 模板。
 * P1 阶段不接真实 LLM，模板用于 MockAgentAdapter 构建上下文。
 */

/** 支持的小说类型 */
export type NovelGenre = '玄幻' | '悬疑' | '都市' | '言情' | '科幻' | '历史';

/** Prompt 模板接口 */
export interface GenrePromptTemplate {
  /** 系统角色设定 */
  systemPrompt: string;
  /** 续写指令模板（含 {context} 占位符） */
  continueTemplate: string;
  /** 改写指令模板 */
  rewriteTemplate: string;
  /** 扩写指令模板 */
  expandTemplate: string;
  /** 润色指令模板 */
  polishTemplate: string;
  /** 总结指令模板 */
  summarizeTemplate: string;
  /** 信息提取指令模板 */
  extractTemplate: string;
}

/**
 * 各类型的 Prompt 模板映射。
 * P1 阶段为 Mock 数据提供风格差异化依据。
 */
export const GENRE_TEMPLATES: Record<NovelGenre, GenrePromptTemplate> = {
  '玄幻': {
    systemPrompt: '你是一位擅长东方玄幻小说创作的 AI 写作助手。注重灵气体系、修为境界、法宝功法的描写。',
    continueTemplate: '请根据以下上下文续写玄幻小说正文。保持修仙世界的设定一致性：\n\n{context}',
    rewriteTemplate: '请用更生动的笔法改写以下玄幻段落，增强战斗场面或修炼场景的张力：\n\n{text}',
    expandTemplate: '请扩写以下玄幻情节，增加环境描写、心理活动和功法运转细节：\n\n{text}',
    polishTemplate: '请润色以下玄幻文本，统一术语（如境界名称、法宝等级），优化节奏感：\n\n{text}',
    summarizeTemplate: '请总结本章的修炼进展、战斗结果和关键伏笔：\n\n{text}',
    extractTemplate: '从以下玄幻章节中提取：1.新增功法/法宝 2.角色境界变化 3.埋下的伏笔 4.世界规则揭示',
  },
  '悬疑': {
    systemPrompt: '你是一位擅长悬疑推理小说的 AI 写作助手。注重线索布局、悬念营造、逻辑自洽。',
    continueTemplate: '请根据以下上下文续写悬疑推理小说。保持悬念节奏，适时抛出新线索：\n\n{context}',
    rewriteTemplate: '请改写以下悬疑段落，增强氛围渲染和心理压迫感：\n\n{text}',
    expandTemplate: '请扩写以下悬疑情节，增加细节暗示和环境烘托：\n\n{text}',
    polishTemplate: '请润色以下悬疑文本，确保时间线一致、线索不矛盾：\n\n{text}',
    summarizeTemplate: '请总结本章的新发现、嫌疑动向和未解之谜：\n\n{text}',
    extractTemplate: '从以下悬疑章节中提取：1.新线索/证据 2.可疑人物行为 3.时间线异常 4.隐藏动机暗示',
  },
  '都市': {
    systemPrompt: '你是一位擅长现代都市题材的 AI 写作助手。注重职场细节、社会关系、现实感。',
    continueTemplate: '请根据以下上下文续写都市小说。保持人物关系和社会背景的真实性：\n\n{context}',
    rewriteTemplate: '请改写以下都市段落，增强对话自然度和场景真实感：\n\n{text}',
    expandTemplate: '请扩写以下都市情节，增加职场互动或生活细节描写：\n\n{text}',
    polishTemplate: '请润色以下都市文本，统一人设语气，优化叙事节奏：\n\n{text}',
    summarizeTemplate: '请总结本章的人物动态、职场变化和情感走向：\n\n{text}',
    extractTemplate: '从以下都市章节中提取：1.关键人物关系变化 2.职场/商业信息 3.重要对话要点 4.伏笔暗示',
  },
  '言情': {
    systemPrompt: '你是一位擅长言情小说的 AI 写作助手。注重情感细腻度、心理描写、氛围营造。',
    continueTemplate: '请根据以下上下文续写言情小说。保持情感线连贯，细腻刻画内心活动：\n\n{context}',
    rewriteTemplate: '请改写以下言情段落，增强情感张力和画面美感：\n\n{text}',
    expandTemplate: '请扩写以下言情情节，增加感官描写和微表情刻画：\n\n{text}',
    polishTemplate: '请润色以下言情文本，统一人称视角，优化抒情节奏：\n\n{text}',
    summarizeTemplate: '请总结本章的情感转折、关系变化和内心成长：\n\n{text}',
    extractTemplate: '从以下言情章节中提取：1.情感状态变化 2.关系推进/后退信号 3.关键对话 4.象征性意象',
  },
  '科幻': {
    systemPrompt: '你是一位擅长科幻小说的 AI 写作助手。注重科学设定自洽、技术细节可信、未来感营造。',
    continueTemplate: '请根据以下上下文续写科幻小说。保持科技设定的逻辑一致性：\n\n{context}',
    rewriteTemplate: '请改写以下科幻段落，增强科技感和世界观沉浸感：\n\n{text}',
    expandTemplate: '请扩写以下科幻情节，增加技术原理说明和环境细节：\n\n{text}',
    polishTemplate: '请润色以下科幻文本，统一术语使用，优化硬核程度平衡：\n\n{text}',
    summarizeTemplate: '请总结本章的技术突破、世界变化和危机发展：\n\n{text}',
    extractTemplate: '从以下科幻章节中提取：1.新技术/设备 2.世界观扩展 3.科学原理应用 4.未来趋势暗示',
  },
  '历史': {
    systemPrompt: '你是一位擅长历史小说的 AI 写作助手。注重时代背景准确、语言风格古雅、礼仪制度考据。',
    continueTemplate: '请根据以下上下文续写历史小说。保持朝代背景和历史事件的真实性：\n\n{context}',
    rewriteTemplate: '请改写以下历史段落，增强时代氛围和文言韵味：\n\n{text}',
    expandTemplate: '请扩写以下历史情节，增加服饰、建筑、礼仪等细节描写：\n\n{text}',
    polishTemplate: '请润色以下历史文本，统一称谓用语，优化史实融合：\n\n{text}',
    summarizeTemplate: '请总结本章的政治格局变化、人物命运走向和历史事件影响：\n\n{text}',
    extractTemplate: '从以下历史章节中提取：1.政治势力变化 2.关键历史事件 3.人物身份变动 4.文化习俗细节',
  },
};

/**
 * 获取指定类型的 Prompt 模板。
 * @param genre 小说类型
 * @returns 对应模板，未知类型返回默认（玄幻）
 */
export function getGenreTemplate(genre: string): GenrePromptTemplate {
  return GENRE_TEMPLATES[genre as NovelGenre] ?? GENRE_TEMPLATES['玄幻'];
}
