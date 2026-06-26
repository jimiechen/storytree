/**
 * @file name-bank.ts
 * @description PAGE-14 名字生成器字库
 *
 * 按风格 × 性别组合，分姓氏 / 名字两部分，随机模式下从字库中按长度抽取组合。
 */

import type { NameGender, NameStyle } from '../../types/name-generator';

interface StyleBank {
  surnames: string[];
  givenNames: string[];
}

type Bank = Record<NameGender, StyleBank>;

const BANK: Record<NameStyle, Bank> = {
  minimal: {
    male: {
      surnames: ['林', '陈', '王', '李', '张', '周', '吴', '郑'],
      givenNames: ['宇', '轩', '哲', '明', '杰', '俊', '睿', '博'],
    },
    female: {
      surnames: ['苏', '沈', '顾', '柳', '叶', '白', '夏', '安'],
      givenNames: ['静', '婉', '柔', '雅', '妍', '萱', '琳', '瑶'],
    },
    neutral: {
      surnames: ['叶', '言', '溪', '云', '风', '林', '安', '白'],
      givenNames: ['之', '安', '然', '予', '宁', '清', '和', '辰'],
    },
  },
  ancient: {
    male: {
      surnames: ['萧', '夜', '墨', '寒', '玉', '风', '云', '苏'],
      givenNames: ['珩', '渊', '珝', '珏', '璟', '玦', '墨', '尘'],
    },
    female: {
      surnames: ['云', '月', '琴', '霜', '雪', '花', '柳', '苏'],
      givenNames: ['璃', '芷', '若', '婉', '清', '徽', '音', '宁'],
    },
    neutral: {
      surnames: ['风', '雪', '霜', '月', '云', '夜', '寒', '玉'],
      givenNames: ['无', '念', '尘', '影', '痕', '渊', '清', '徽'],
    },
  },
  fantasy: {
    male: {
      surnames: ['龙', '凤', '雷', '魔', '神', '圣', '天', '玄'],
      givenNames: ['霆', '焰', '弑', '破', '裂', '煌', '炽', '煌'],
    },
    female: {
      surnames: ['凰', '冰', '霜', '幻', '灵', '幽', '紫', '雪'],
      givenNames: ['凛', '璃', '璇', '华', '嫣', '霜', '梦', '璃'],
    },
    neutral: {
      surnames: ['玄', '冥', '幽', '魔', '神', '圣', '天', '虚'],
      givenNames: ['影', '刹', '渊', '烬', '冥', '虚', '无', '绝'],
    },
  },
  modern: {
    male: {
      surnames: ['杰', '凯', '宇', '俊', '辰', '皓', '泽', '铭'],
      givenNames: ['浩', '俊', '睿', '博', '辰', '皓', '泽', '铭'],
    },
    female: {
      surnames: ['悦', '欣', '雨', '诗', '瑶', '琳', '妍', '萱'],
      givenNames: ['萱', '瑶', '琳', '妍', '悦', '欣', '雨', '诗'],
    },
    neutral: {
      surnames: ['晨', '晓', '曦', '辰', '光', '明', '星', '月'],
      givenNames: ['辰', '光', '明', '星', '月', '晓', '曦', '晨'],
    },
  },
  cool: {
    male: {
      surnames: ['烈', '焰', '刃', '狂', '暴', '绝', '煞', '血'],
      givenNames: ['狂', '暴', '绝', '煞', '血', '刃', '焰', '烈'],
    },
    female: {
      surnames: ['艳', '媚', '烈', '娇', '辣', '飒', '凛', '冷'],
      givenNames: ['娇', '辣', '飒', '凛', '冷', '艳', '媚', '烈'],
    },
    neutral: {
      surnames: ['极', '巅', '锋', '锐', '狂', '绝', '煞', '血'],
      givenNames: ['锐', '狂', '绝', '煞', '血', '锋', '巅', '极'],
    },
  },
  cute: {
    male: {
      surnames: ['小', '阿', '宝', '豆', '糖', '果', '团', '圆'],
      givenNames: ['宝', '贝', '糖', '豆', '果', '团', '圆', '软'],
    },
    female: {
      surnames: ['咪', '喵', '兔', '糖', '果', '酱', '花', '桃'],
      givenNames: ['糖', '果', '酱', '花', '桃', '咪', '喵', '兔'],
    },
    neutral: {
      surnames: ['团', '圆', '软', '糯', '甜', '糖', '果', '酱'],
      givenNames: ['软', '糯', '甜', '糖', '果', '酱', '团', '圆'],
    },
  },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 从字库中随机生成名字
 * - length=2: 仅姓氏（1字）+ 名字（1字）
 * - length=3: 姓氏（1字）+ 名字（2字，抽取 2 个不同字）
 * - length>=4: 姓氏（1字）+ 名字（length-1 字，按需重复抽取）
 */
export function generateRandomName(
  gender: NameGender,
  style: NameStyle,
  length: number,
): string {
  const bank = BANK[style][gender];
  const surname = pickRandom(bank.surnames);

  const targetGiven = Math.max(1, length - 1);
  const givenChars: string[] = [];
  for (let i = 0; i < targetGiven; i++) {
    // 避免连续重复字
    let next = pickRandom(bank.givenNames);
    let attempts = 0;
    while (givenChars.length > 0 && givenChars[givenChars.length - 1] === next && attempts < 5) {
      next = pickRandom(bank.givenNames);
      attempts++;
    }
    givenChars.push(next);
  }

  return surname + givenChars.join('');
}
