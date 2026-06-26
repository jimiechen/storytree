/**
 * @file protagonist-tab.tsx
 * @description 创建项目弹窗 — 主角设定 Tab（PAGE-05）
 *
 * PRD §3.5 元素：姓名+随机按钮 / 性别下拉 / 年龄 / 性格 / 外貌 / 背景 / 动机 / 软肋
 */

import { For } from 'solid-js';
import type { Component } from 'solid-js';
import type { Gender } from '../../types';
import { NovelIcon } from '../layout/novel-icon';

// 随机姓名用字池
const SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
const NAME_CHARS_MALE = ['轩', '宇', '辰', '睿', '皓', '霆', '霄', '枫', '逸', '尘', '墨', '渊', '凛', '炎', '煜'];
const NAME_CHARS_FEMALE = ['瑶', '琴', '萱', '蕊', '璃', '月', '雪', '霜', '莲', '茹', '婉', '清', '灵', '梦'];
const NAME_CHARS_NEUTRAL = ['宁', '安', '和', '静', '明', '远', '岚', '溪'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomName(): string {
  const surname = randomItem(SURNAMES);
  const pools = [NAME_CHARS_MALE, NAME_CHARS_FEMALE, NAME_CHARS_NEUTRAL];
  const pool = randomItem(pools);
  const char1 = randomItem(pool);
  // 50% 概率两字名，50% 三字名
  const useTwoChars = Math.random() < 0.5;
  if (useTwoChars) {
    return surname + char1;
  }
  const char2 = randomItem(randomItem(pools));
  return surname + char1 + char2;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
];

export interface ProtagonistTabProps {
  name: () => string;
  setName: (v: string) => void;
  gender: () => Gender;
  setGender: (v: Gender) => void;
  age: () => string;
  setAge: (v: string) => void;
  personality: () => string;
  setPersonality: (v: string) => void;
  appearance: () => string;
  setAppearance: (v: string) => void;
  background: () => string;
  setBackground: (v: string) => void;
  motivation: () => string;
  setMotivation: (v: string) => void;
  weakness: () => string;
  setWeakness: (v: string) => void;
}

export const ProtagonistTab: Component<ProtagonistTabProps> = (props) => {
  const inputBase =
    'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';
  const labelBase = 'block text-xs font-medium text-[#494454] mb-1';
  const sectionTitle = 'text-sm font-medium text-[#0d1c2f] font-bold flex items-center gap-2 mb-4';

  const handleRandomName = () => {
    props.setName(generateRandomName());
  };

  return (
    <div class="space-y-4">
      <h3 class={sectionTitle}>
        <NovelIcon name="person" size={20} class="text-[#6b38d4]" />
        主角设定
      </h3>

      {/* 姓名 + 随机按钮 */}
      <div class="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label class={labelBase}>主角姓名</label>
          <input
            type="text"
            placeholder="主角名字"
            value={props.name()}
            onInput={(e) => props.setName((e.target as HTMLInputElement).value)}
            class={inputBase}
          />
        </div>
        <div class="flex flex-col justify-end">
          <button
            onClick={handleRandomName}
            title="随机生成姓名"
            class="px-4 py-3 rounded-lg border border-[#cbc3d7] bg-[#f8f9ff] text-[#6b38d4] text-sm font-medium hover:bg-[#eff4ff] transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <NovelIcon name="casino" size={16} />
            随机
          </button>
        </div>
      </div>

      {/* 性别 + 年龄 */}
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class={labelBase}>性别</label>
          <div class="relative">
            <select
              value={props.gender()}
              onChange={(e) => props.setGender((e.target as HTMLSelectElement).value as Gender)}
              class={`${inputBase} appearance-none`}
            >
              <For each={GENDER_OPTIONS}>
                {(opt) => <option value={opt.value}>{opt.label}</option>}
              </For>
            </select>
            <NovelIcon
              name="expand_more"
              size={20}
              class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#494454]"
            />
          </div>
        </div>
        <div>
          <label class={labelBase}>年龄</label>
          <input
            type="number"
            placeholder="如：18"
            value={props.age()}
            onInput={(e) => props.setAge((e.target as HTMLInputElement).value)}
            class={inputBase}
            min="0"
          />
        </div>
      </div>

      {/* 性格特点 */}
      <div>
        <label class={labelBase}>性格特点</label>
        <textarea
          placeholder="描述主角的性格特点，如：外冷内热、机智果断..."
          value={props.personality()}
          onInput={(e) => props.setPersonality((e.target as HTMLTextAreaElement).value)}
          rows={2}
          class={`${inputBase} resize-none`}
        />
      </div>

      {/* 外貌描述 */}
      <div>
        <label class={labelBase}>外貌描述</label>
        <textarea
          placeholder="描述主角的外貌特征，如：剑眉星目、身形修长..."
          value={props.appearance()}
          onInput={(e) => props.setAppearance((e.target as HTMLTextAreaElement).value)}
          rows={2}
          class={`${inputBase} resize-none`}
        />
      </div>

      {/* 背景故事 */}
      <div>
        <label class={labelBase}>背景故事</label>
        <textarea
          placeholder="描述主角的身世背景，如：出身名门却家道中落..."
          value={props.background()}
          onInput={(e) => props.setBackground((e.target as HTMLTextAreaElement).value)}
          rows={2}
          class={`${inputBase} resize-none`}
        />
      </div>

      {/* 核心动机 + 致命软肋 */}
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class={labelBase}>核心动机</label>
          <textarea
            placeholder="主角的目标，如：复仇、守护、寻道..."
            value={props.motivation()}
            onInput={(e) => props.setMotivation((e.target as HTMLTextAreaElement).value)}
            rows={2}
            class={`${inputBase} resize-none`}
          />
        </div>
        <div>
          <label class={labelBase}>致命软肋</label>
          <textarea
            placeholder="主角的弱点，如：亲人被威胁时失控..."
            value={props.weakness()}
            onInput={(e) => props.setWeakness((e.target as HTMLTextAreaElement).value)}
            rows={2}
            class={`${inputBase} resize-none`}
          />
        </div>
      </div>
    </div>
  );
};
