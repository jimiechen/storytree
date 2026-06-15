import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface WorkspaceSideNavActions {
  onOpenOutline?: () => void;
  onOpenChapters?: () => void;
  onOpenCharacters?: () => void;
  onOpenWorldSetting?: () => void;
  onOpenExport?: () => void;
  onOpenHelp?: () => void;
  onOpenFeedback?: () => void;
  onGenerateOutline?: () => void;
  onGenerateDetail?: () => void;
}

interface WorkspaceSideNavProps extends WorkspaceSideNavActions {
  projectName?: string;
  lastEdited?: string;
}

/** 工作台左侧 SideNav — Stitch 04 code.html */
export const WorkspaceSideNav: Component<WorkspaceSideNavProps> = (props) => {
  return (
    <div class="flex flex-col h-full py-6 gap-4">
      {/* Header */}
      <div class="px-4 flex items-center gap-3">
        <div class="w-10 h-10 bg-[#8455ef] text-white rounded-lg flex items-center justify-center shrink-0">
          <NovelIcon name="menu_book" size={20} />
        </div>
        <div class="overflow-hidden">
          <h2
            class="text-base font-bold text-[#6b38d4] truncate"
            style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
          >
            {props.projectName ?? '长篇小说项目'}
          </h2>
          <p class="text-xs text-[#7b7486] truncate">
            {props.lastEdited ?? '最后编辑于 2小时前'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav class="px-2 space-y-1">
        <NavItem icon="auto_stories" label="大纲" active onClick={props.onOpenOutline} />
        <NavItem icon="format_list_bulleted" label="章节" onClick={props.onOpenChapters} />
        <NavItem icon="groups" label="人物" onClick={props.onOpenCharacters} />
        <NavItem icon="psychology" label="设定" onClick={props.onOpenWorldSetting} />
        <NavItem icon="import_export" label="导出" onClick={props.onOpenExport} />
      </nav>

      <hr class="border-[#cbc3d7] mx-4" />

      {/* Action Buttons */}
      <div class="px-4 space-y-2">
        <button
          onClick={props.onGenerateOutline}
          class="w-full bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] text-white py-2.5 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
        >
          <NovelIcon name="magic_button" size={16} />
          <span>AI生成大纲</span>
        </button>
        <button
          onClick={props.onGenerateDetail}
          class="w-full bg-white border border-[#cbc3d7] text-[#6b38d4] py-2.5 rounded-lg text-sm font-medium hover:bg-[#eff4ff] transition-colors"
        >
          生成细纲
        </button>
      </div>

      {/* Footer Tabs */}
      <div class="mt-auto pt-4 px-2 border-t border-[#cbc3d7] space-y-1">
        <NavItem icon="help" label="帮助中心" onClick={props.onOpenHelp} />
        <NavItem icon="feedback" label="反馈" onClick={props.onOpenFeedback} />
      </div>
    </div>
  );
};

/** SideNav 单项 */
function NavItem(props: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={props.onClick}
      class={`w-full flex items-center px-3 py-2 rounded-md transition-all text-left ${
        props.active
          ? 'text-[#6b38d4] border-l-4 border-[#6b38d4] bg-[#8455ef]/10 font-medium'
          : 'text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent'
      }`}
    >
      <NovelIcon name={props.icon} size={20} class="mr-3" fill={props.active} />
      <span class="text-sm">{props.label}</span>
    </button>
  );
}
