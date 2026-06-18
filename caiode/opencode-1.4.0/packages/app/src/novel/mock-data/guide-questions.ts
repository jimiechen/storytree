import type { GuideQuestion } from '../types/novel-guide'

export const guideQuestions: GuideQuestion[] = [
  {
    id: 1,
    question: '你想写什么类型的小说？',
    type: 'single-choice',
    options: [
      { value: '玄幻', label: '玄幻修仙', emoji: '🐉' },
      { value: '都市', label: '现代都市', emoji: '🏙️' },
      { value: '穿越', label: '穿越重生', emoji: '⏰' },
      { value: '科幻', label: '科幻未来', emoji: '🚀' },
      { value: '仙侠', label: '仙侠武侠', emoji: '⚔️' },
      { value: '悬疑', label: '悬疑推理', emoji: '🔍' },
      { value: '言情', label: '言情甜宠', emoji: '💕' },
    ]
  },
  {
    id: 2,
    question: '主角的性别是？',
    type: 'single-choice',
    options: [
      { value: '男', label: '男性', emoji: '👨' },
      { value: '女', label: '女性', emoji: '👩' },
      { value: '其他', label: '其他/无性别', emoji: '🌈' },
    ]
  },
  {
    id: 3,
    question: '主角的性格偏向？',
    subtitle: '选择最符合你设想的主角性格',
    type: 'single-choice',
    options: [
      { value: '冷静理智', label: '冷静理智', emoji: '🧊' },
      { value: '热血冲动', label: '热血冲动', emoji: '🔥' },
      { value: '腹黑深沉', label: '腹黑深沉', emoji: '🎭' },
      { value: '乐观开朗', label: '乐观开朗', emoji: '☀️' },
      { value: '坚韧不拔', label: '坚韧不拔', emoji: '🪨' },
    ]
  },
  {
    id: 4,
    question: '故事的核心冲突是什么？',
    type: 'single-choice',
    options: [
      { value: '复仇', label: '复仇之路', emoji: '⚔️' },
      { value: '成长', label: '强者成长', emoji: '📈' },
      { value: '守护', label: '守护珍视之物', emoji: '🛡️' },
      { value: '探索', label: '探索未知世界', emoji: '🗺️' },
      { value: '逆袭', label: '废柴逆袭', emoji: '👑' },
    ]
  },
  {
    id: 5,
    question: '你希望的故事节奏？',
    type: 'single-choice',
    options: [
      { value: '慢热', label: '慢热细腻', description: '注重细节铺垫，情感递进' },
      { value: '快节奏', label: '快节奏爽文', description: '打脸不断，高潮迭起' },
      { value: '跌宕起伏', label: '跌宕起伏', description: '张弛有度，悬念丛生' },
    ]
  },
  {
    id: 6,
    question: '反派类型偏好？',
    type: 'single-choice',
    options: [
      { value: '宿命对手', label: '宿命对手', emoji: '🎭' },
      { value: '邪恶组织', label: '邪恶组织', emoji: '🏴‍☠️' },
      { value: '内心阴影', label: '内心阴影', emoji: '🌑' },
      { value: '体制压迫', label: '体制压迫', emoji: '⚙️' },
    ]
  },
  {
    id: 7,
    question: '感情线设置？',
    type: 'single-choice',
    options: [
      { value: '单女主', label: '单女主/单男主', emoji: '💑' },
      { value: '后宫', label: '多角关系', emoji: '💐' },
      { value: '无cp', label: '无感情线', emoji: '🚫' },
      { value: '暧昧', label: '暧昧不清', emoji: '💫' },
    ]
  },
  {
    id: 8,
    question: '世界设定偏好？',
    type: 'single-choice',
    options: [
      { value: '东方玄幻', label: '东方玄幻', emoji: '🏯' },
      { value: '西方奇幻', label: '西方奇幻', emoji: '🏰' },
      { value: '现代科技', label: '现代科技', emoji: '🤖' },
      { value: '末日废土', label: '末日废土', emoji: '☢️' },
      { value: '赛博朋克', label: '赛博朋克', emoji: '🌃' },
    ]
  },
  {
    id: 9,
    question: '主角的起点设定？',
    type: 'single-choice',
    options: [
      { value: '废柴', label: '废柴开局', emoji: '📉' },
      { value: '天才', label: '天才开局', emoji: '🌟' },
      { value: '平凡', label: '平凡普通人', emoji: '😐' },
      { value: '转生', label: '转生/穿越者', emoji: '🌀' },
    ]
  },
  {
    id: 10,
    question: '期待的结局类型？',
    type: 'single-choice',
    options: [
      { value: '大圆满', label: '大圆满', emoji: '🎉' },
      { value: '开放式', label: '开放式', emoji: '❓' },
      { value: '悲剧', label: '悲剧收场', emoji: '😢' },
      { value: '轮回', label: '轮回重启', emoji: '🔄' },
    ]
  },
]
