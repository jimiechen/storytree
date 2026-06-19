/**
 * @file adapters/mock-agent-adapter.ts
 * @description Mock AI Agent 适配器 — P1-A 基础层
 *
 * 实现 NovelAgentAdapter 接口，产出确定性 Mock 数据 + Info-Lite 信息审计。
 *
 * 修正项:
 *   #1 — 不涉及 Signal（Adapter 层无 UI 状态）
 *   #4 — uid() 确定性 ID，无 Date.now/Math.random
 *   #6 — status 仅返回 'completed'（终态）
 *   #7 — entropy/selfInformation/auditScore 均为确定性值
 *   #3 — InformationLink 包含 mystery 类型
 */

import type { NovelAgentAdapter } from './novel-agent-adapter';
import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type {
  ChapterInformationState,
  InformationAtom,
  InformationLink,
  SaveTheCatBeatId,
  InformationAtomType,
  InformationLinkRelationType,
} from '../types/information-flow';
import { uid } from '../types/information-flow';

// ─── 确定性评分函数 ────────────────────────────────────────────────────

/**
 * 确定性伪随机评分。
 * 相同 (chapterIndex, genre, base) 永远产出相同结果 → E2E 可断言。
 */
function deterministicScore(chapterIndex: number, genre: string, base: number): number {
  const hash = (chapterIndex * (genre?.length || 1) + base) % 100;
  return parseFloat((base + (hash % 30) / 10).toFixed(1));
}

/**
 * 确定性熵值。
 * phase='before' 和 'after' 使用不同偏移，确保 delta 非零。
 */
function deterministicEntropy(chapterIndex: number, phase: 'before' | 'after'): number {
  const offset = phase === 'before' ? 0 : 15;
  const base = 35 + chapterIndex * 3 + offset;
  return parseFloat((base + (chapterIndex * 7 % 50) / 10).toFixed(2));
}

// ─── 节拍分配（按章节序号循环） ──────────────────────────────────────

const BEAT_CYCLE: SaveTheCatBeatId[] = [
  'opening-image', 'theme-stated', 'setup', 'catalyst', 'debate',
  'break-into-two', 'b-story', 'fun-and-games', 'midpoint',
  'bad-guys-close-in', 'all-is-lost', 'dark-night-of-soul',
  'break-into-three', 'finale', 'final-image',
];

function getBeatForChapter(chapterIndex: number): SaveTheCatBeatId | undefined {
  if (chapterIndex < 0 || chapterIndex >= BEAT_CYCLE.length) return undefined;
  return BEAT_CYCLE[chapterIndex];
}

// ─── Mock 信息原子模板 ─────────────────────────────────────────────────

const ATOM_TEMPLATES: Record<string, { type: InformationAtomType; title: string; desc: string }[]> = {
  '玄幻': [
    { type: 'fact', title: '灵气浓度上升', desc: '秘境内灵气浓度达到外界三倍' },
    { type: 'character-state', title: '修为突破', desc: '主角感悟剑意，境界提升至金丹期' },
    { type: 'item', title: '神器现世', desc: '霜寒剑认主，散发蓝色寒光' },
    { type: 'foreshadow', title: '长老异常', desc: '执事长老在比武前与陌生人密谈' },
    { type: 'event', title: '决赛开始', desc: '门派年度比武大会正式开幕' },
  ],
  '悬疑': [
    { type: 'mystery', title: '午夜钢琴声', desc: '每晚12点旧教学楼传来断续钢琴声' },
    { type: 'question', title: '失踪者身份', desc: '三年前失踪的学生与当前事件高度关联' },
    { type: 'reveal', title: '密室钥匙', desc: '音乐教室储物柜发现一把生锈铜钥' },
    { type: 'foreshadow', title: '日记残页', desc: '失踪者日记中提到"它回来了"' },
    { type: 'emotion', title: '恐惧蔓延', desc: '校园内学生间开始传播不安情绪' },
  ],
  '都市': [
    { type: 'fact', title: '公司并购', desc: '集团宣布收购竞争对手 60% 股权' },
    { type: 'character-state', title: '升职受阻', desc: '主角的晋升申请被莫名搁置' },
    { type: 'relationship', title: '旧情复燃', desc: '前任突然出现在同一场商务晚宴' },
    { type: 'world-rule', title: '行业潜规则', desc: '揭示行业内不成文的利益分配规则' },
    { type: 'event', title: '董事会冲突', desc: '股东大会上爆发激烈争论' },
  ],
  '言情': [
    { type: 'emotion', title: '心动瞬间', desc: '四目相对时时间仿佛静止' },
    { type: 'relationship', title: '误会加深', desc: '一次无意间的目击导致信任危机' },
    { type: 'character-state', title: '自我怀疑', desc: '主角开始质疑自己是否值得被爱' },
    { type: 'theme', title: '爱的代价', desc: '探讨真爱是否需要牺牲自我' },
    { type: 'event', title: '告白前夕', desc: '决定明天的见面说出心里话' },
  ],
};

// ─── Mock 信息链接模板 ─────────────────────────────────────────────────

const LINK_TEMPLATES: Record<string, { source: string; target: string; rel: InformationLinkRelationType; strength: number }[]> = {
  '玄幻': [
    { source: '灵气浓度上升', target: '修为突破', rel: 'plot-cause', strength: 0.9 },
    { source: '神器现世', target: '决赛开始', rel: 'foreshadow', strength: 0.7 },
    { source: '长老异常', target: '神器现世', rel: 'mystery', strength: 0.85 },
  ],
  '悬疑': [
    { source: '午夜钢琴声', target: '失踪者身份', rel: 'mystery', strength: 0.95 }, // ← 修正#3
    { source: '密室钥匙', target: '日记残页', rel: 'foreshadow', strength: 0.8 },
    { source: '恐惧蔓延', target: '午夜钢琴声', rel: 'emotional-echo', strength: 0.6 },
  ],
  '都市': [
    { source: '公司并购', target: '董事会冲突', rel: 'plot-cause', strength: 0.95 },
    { source: '升职受阻', target: '旧情复燃', rel: 'character', strength: 0.5 },
    { source: '行业潜规则', target: '董事会冲突', rel: 'theme', strength: 0.7 },
  ],
  '言情': [
    { source: '心动瞬间', target: '告白前夕', rel: 'plot-cause', strength: 0.85 },
    { source: '误会加深', target: '自我怀疑', rel: 'emotional-echo', strength: 0.9 },
    { source: '爱的代价', target: '自我怀疑', rel: 'theme', strength: 0.75 },
  ],
};

// ─── Mock 正文生成 ──────────────────────────────────────────────────────

const MOCK_TEXT_TEMPLATES: Record<string, string[]> = {
  '玄幻': [
    '比武场中央，李云轩深吸一口气，周身灵气开始剧烈波动。对面的林清风嘴角微扬，手中长剑已然出鞘三分。',
    '"今日，便让你见识何为真正的剑意。"林清风话音未落，身形已如鬼魅般欺近。李云轩瞳孔骤缩，本能地横剑格挡。',
    '铿然一声巨响，两剑相交激起的气浪掀翻了前排的石凳。裁判席上，执事长老面色微变，低声说了句什么。',
  ],
  '悬疑': [
    '旧教学楼的走廊里，脚步声在空旷中回荡。手电筒的光束划过剥落的墙皮，最终停在 404 教室的门牌上。',
    '门缝里透出一丝微弱的光——不像是灯光，更像是某种冷色调的荧光。她屏住呼吸，缓缓推开了那扇沉重的木门。',
    '钢琴声。是那首《月光》，但节奏不对，每一个音符都像是在倒数着什么。',
  ],
  '都市': [
    '会议室里的空气几乎凝固了。PPT 停留在最后一页——"关于收购星辰科技的议案"，而董事长正用一种意味深长的目光扫视全场。',
    '"我认为我们需要重新评估这次收购的风险。"说话的是市场部总监，声音不大，但每个人都听得清清楚楚。',
    '她低头翻动手中的文件，第 17 页有一行被荧光笔标记的文字：目标公司存在未披露的法律诉讼。',
  ],
  '言情': [
    '雨天的咖啡店总是格外安静。她坐在靠窗的位置，手指无意识地搅动着已经凉掉的拿铁，目光却始终停留在街对面那个熟悉的身影上。',
    '三年了，他似乎一点都没变。还是那样喜欢穿深色大衣，走路时微微侧头倾听的样子，和记忆中一模一样。',
    '"好久不见。"他的声音从头顶传来，带着一丝她熟悉的笑意。她抬起头，正好撞进那双温柔的眼睛里。',
  ],
};

function buildMockText(genre: string, commandType: string): string {
  const templates = MOCK_TEXT_TEMPLATES[genre] || MOCK_TEXT_TEMPLATES['玄幻'];
  if (commandType === 'summarize') {
    return `本章主要描述了${templates[0].slice(0, 30)}...等关键情节的发展。`;
  }
  return templates.join('\n\n');
}

// ─── MockAgentAdapter 实现 ──────────────────────────────────────────────

/**
 * Mock Agent 适配器。
 * 不调用真实 LLM，基于输入参数生成确定性的 Mock 数据。
 */
export class MockAgentAdapter implements NovelAgentAdapter {
  readonly name = 'MockAgentAdapter';

  /** 全局执行尝试计数器（每次 run() 自增 1，retry 必不同） */
  private static _attemptCounter = 0;

  async run(command: NovelCommand): Promise<NovelAgentResult> {
    const { chapterIndex, genre, chapterId, projectId, type: cmdType } = command;
    const g = genre || '玄幻';

    // ── 确定性 ID ──
    const taskId = uid('atk', chapterIndex, g, 0);

    // ── 执行尝试 ID（全局递增，每次调用唯一）──
    const attemptId = ++MockAgentAdapter._attemptCounter;

    // ── Info-Lite 信息审计数据（确定性） ──
    const infoState = this.buildInformationState(chapterId, projectId, chapterIndex, g);

    // ── Mock 正文 ──
    const text = buildMockText(g, cmdType);
    const wordCount = text.length;

    // ── 摘要 ──
    const summary = this.buildSummary(g, chapterIndex);

    return {
      taskId,
      attemptId,
      status: 'completed',       // ← 修正#6: 仅终态
      text,
      wordCount,
      summary,
      durationMs: 120 + (chapterIndex % 5) * 30,
      informationState: infoState,
    };
  }

  // ── 构建 ChapterInformationState ──

  private buildInformationState(
    chapterId: string,
    projectId: string,
    chapterIndex: number,
    genre: string,
  ): ChapterInformationState {
    const beatId = getBeatForChapter(chapterIndex);

    const entropyBefore = deterministicEntropy(chapterIndex, 'before');
    const entropyAfter = deterministicEntropy(chapterIndex, 'after');

    const newAtoms = this.buildAtoms(projectId, chapterId, chapterIndex, genre);
    const newLinks = this.buildLinks(projectId, chapterIndex, genre);

    return {
      chapterId,
      projectId,
      beatId,
      beatName: beatId ? this.getBeatName(beatId) : undefined,
      entropyBefore,
      entropyAfter,
      entropyDelta: parseFloat((entropyAfter - entropyBefore).toFixed(2)), // ← 修正#2: 预计算字段
      selfInformationScore: deterministicScore(chapterIndex, genre, 5),
      newAtoms,
      newLinks,
      auditScore: deterministicScore(chapterIndex, genre, 7) * 10, // 缩放到 0-100
    };
  }

  // ── 构建信息原子列表 ──

  private buildAtoms(
    projectId: string,
    chapterId: string,
    chapterIndex: number,
    genre: string,
  ): InformationAtom[] {
    const templates = ATOM_TEMPLATES[genre] || ATOM_TEMPLATES['玄幻'];
    return templates.map((t, i) => ({
      id: uid('info-atom', chapterIndex, genre, i),
      projectId,
      chapterId,
      type: t.type,
      title: t.title,
      description: t.desc,
      importance: 5 + (i % 6),           // 5-10
      visibility: (i % 3 === 0 ? 'author-only' : 'public') as InformationAtom['visibility'],
      selfInformationScore: deterministicScore(chapterIndex, genre, 2 + i),
      plantedIn: chapterIndex,
    }));
  }

  // ── 构建信息链接列表 ──

  private buildLinks(
    projectId: string,
    chapterIndex: number,
    genre: string,
  ): InformationLink[] {
    const templates = LINK_TEMPLATES[genre] || LINK_TEMPLATES['玄幻'];
    return templates.map((t, i) => ({
      id: uid('info-link', chapterIndex, genre, i),
      projectId,
      sourceTitle: t.source,
      targetTitle: t.target,
      relationType: t.rel,
      strength: t.strength,
      plantedIn: chapterIndex,
    }));
  }

  // ── 辅助方法 ──

  private getBeatName(beatId: SaveTheCatBeatId): string {
    const names: Record<SaveTheCatBeatId, string> = {
      'opening-image': '开场画面',
      'theme-stated': '主题陈述',
      'setup': '铺垫',
      'catalyst': '催化事件',
      'debate': '争论',
      'break-into-two': '第二幕转折',
      'b-story': 'B 故事线',
      'fun-and-games': '游戏时间',
      'midpoint': '中点',
      'bad-guys-close-in': '坏人逼近',
      'all-is-lost': '一无所有',
      'dark-night-of-soul': '灵魂黑夜',
      'break-into-three': '第三幕转折',
      'finale': '终局',
      'final-image': '终场画面',
    };
    return names[beatId];
  }

  private buildSummary(genre: string, chapterIndex: number): string {
    const summaries: Record<string, string[]> = {
      '玄幻': [
        '主角参加门派比武大会，在决赛中与宿敌交锋，凭借惊人悟性领悟剑意，获得进入秘境资格。',
        '主角在修炼中发现体内封印松动，疑似与上古神器有关联，引得长老层暗中关注。',
        '主角团队深入秘境探索，遭遇妖兽袭击，战斗中意外触发遗迹机关。',
      ],
      '悬疑': [
        '调查者重返母校追查三年前的失踪案，在旧教学楼发现关键线索指向音乐教室。',
        '深夜探访 404 教室时听到神秘钢琴声，与失踪者日记中记录的"它"高度吻合。',
        '找到密室钥匙后打开储物柜，发现一叠照片揭示失踪者生前最后的调查方向。',
      ],
      '都市': [
        '职场斗争升级，主角发现公司收购案背后隐藏着更大规模的利益输送链条。',
        '前任意外出现打乱生活节奏，同时工作中遭遇不明势力的暗中阻挠。',
        '通过层层线索追踪，终于锁定内鬼身份，却在关键时刻收到威胁警告。',
      ],
      '言情': [
        '久别重逢的咖啡店偶遇，让尘封三年的感情再次泛起涟漪。',
        '误会因一次偶然加深，两人关系降至冰点，但内心深处依然牵挂对方。',
        '真相大白后的坦诚对话，决定放下过往重新开始，或彻底告别。',
      ],
    };
    const list = summaries[genre] || summaries['玄幻'];
    return list[chapterIndex % list.length];
  }
}

// ─── 导出单例 ───────────────────────────────────────────────────────────

/** 默认 Mock Agent 适配器实例 */
export const mockAgentAdapter = new MockAgentAdapter();
