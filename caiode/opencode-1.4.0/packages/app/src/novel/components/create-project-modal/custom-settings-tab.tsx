import { For, type Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';

/**
 * PAGE-08 自定义设定 Tab（PRD §3.8）
 * 4 个预设按钮（修仙体系/西方贵族/科幻体系/都市体系）+ 添加设定 + textarea
 */

interface CustomSettingsTabProps {
  value: string;
  setValue: (v: string) => void;
}

interface PresetTemplate {
  label: string;
  icon: string;
  content: string;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    label: '修仙体系',
    icon: 'auto_awesome',
    content: `## 修仙体系

### 境界划分
- 练气期：感应灵气，引气入体
- 筑基期：构建修仙根基
- 金丹期：凝结金丹，可御剑飞行
- 元婴期：元神出窍，寿元大增
- 化神期：感悟天地法则

### 功法体系
- 主修功法：
- 辅助功法：

### 丹药
- 基础丹药：培元丹、回气丹
- 进阶丹药：筑基丹、金丹

### 法宝
- 本命法宝：
- 辅助法宝：
`,
  },
  {
    label: '西方贵族',
    icon: 'workspace_premium',
    content: `## 西方贵族体系

### 爵位制度
- 公爵（Duke）：最高贵族，领地最大
- 侯爵（Marquis）：边境守卫者
- 伯爵（Earl）：地方行政长官
- 子爵（Viscount）：伯爵副手
- 男爵（Baron）：最低贵族

### 领地制度
- 领地名称：
- 附庸家族：

### 家族
- 主角家族：
- 盟友家族：
- 敌对家族：
`,
  },
  {
    label: '科幻体系',
    icon: 'rocket_launch',
    content: `## 科幻体系

### 科技等级
- 一级文明：行星级（核聚变、基因改造）
- 二级文明：恒星级（戴森球、星际航行）
- 三级文明：星系级（超光速、维度技术）

### 种族
- 人类联盟：
- 外星种族：

### 星际势力
- 主要阵营：
- 资源争夺：
`,
  },
  {
    label: '都市体系',
    icon: 'location_city',
    content: `## 都市体系

### 势力格局
- 世家门阀：
- 隐世组织：
- 商业集团：

### 经济体系
- 核心产业：
- 地下经济：

### 异能体系
- 异能等级：F / E / D / C / B / A / S / SS
- 主角异能：
`,
  },
];

const EMPTY_TEMPLATE = `## 自定义设定

### 设定名称：

### 详细描述：

`;

const inputBase =
  'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base text-[#0d1c2f] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';
const labelBase = 'block text-xs font-medium text-[#494454] mb-1';

export const CustomSettingsTab: Component<CustomSettingsTabProps> = (props) => {
  const appendContent = (content: string) => {
    const current = props.value.trim();
    props.setValue(current ? `${current}\n\n${content}` : content);
  };

  return (
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-[#0d1c2f] font-bold flex items-center gap-2">
        <NovelIcon name="tune" size={20} class="text-[#6b38d4]" />
        自定义设定
      </h3>

      <div>
        <label class={labelBase}>预设模板（点击追加）</label>
        <div class="flex flex-wrap gap-2">
          <For each={PRESET_TEMPLATES}>
            {(tpl) => (
              <button
                onClick={() => appendContent(tpl.content)}
                class="px-3 py-1.5 rounded-lg border border-[#cbc3d7] bg-[#f8f9ff] text-xs font-medium text-[#494454] hover:border-[#6b38d4] hover:text-[#6b38d4] transition-colors flex items-center gap-1"
              >
                <NovelIcon name={tpl.icon} size={14} />
                {tpl.label}
              </button>
            )}
          </For>
          <button
            onClick={() => appendContent(EMPTY_TEMPLATE)}
            class="px-3 py-1.5 rounded-lg bg-[#6b38d4] text-white text-xs font-medium hover:bg-[#5a2db8] transition-colors flex items-center gap-1"
          >
            <NovelIcon name="add" size={14} />
            添加设定
          </button>
        </div>
      </div>

      <div>
        <label class={labelBase}>自定义设定描述</label>
        <textarea
          placeholder="添加修仙体系、科技设定等自定义内容..."
          value={props.value}
          onInput={(e) => props.setValue((e.target as HTMLTextAreaElement).value)}
          rows={8}
          class={`${inputBase} resize-none`}
          style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
        />
      </div>
    </div>
  );
};
