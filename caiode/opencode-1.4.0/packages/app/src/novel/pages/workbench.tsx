import { createSignal, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { createNovelProjectProvider } from '../providers/novel-project';
import type { Project } from '../types';

const provider = createNovelProjectProvider();

export default function WorkbenchPage() {
  const params = useParams();
  const [project, setProject] = createSignal<Project | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [activeTab, setActiveTab] = createSignal<'outline' | 'detail' | 'chapter'>('outline');

  // STDD 骨架：加载项目
  const loadProject = async () => {
    setLoading(true);
    const projectId = params.projectId;
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    const data = await provider.getProject(projectId);
    setProject(data);
    setLoading(false);
  };

  if (typeof window !== 'undefined') {
    loadProject();
  }

  return (
    <div class="min-h-screen bg-[#f8f9ff] flex">
      {/* 左侧面板 */}
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Tab 切换 */}
        <div class="flex border-b border-gray-200">
          <button
            class={`flex-1 py-3 text-sm font-medium ${activeTab() === 'outline' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('outline')}
          >
            大纲
          </button>
          <button
            class={`flex-1 py-3 text-sm font-medium ${activeTab() === 'detail' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('detail')}
          >
            细纲
          </button>
          <button
            class={`flex-1 py-3 text-sm font-medium ${activeTab() === 'chapter' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('chapter')}
          >
            章节
          </button>
        </div>

        {/* 列表区 */}
        <div class="flex-1 overflow-auto p-4">
          <Show when={!loading()} fallback={<div class="text-center py-8 text-gray-400">加载中...</div>}>
            <div class="space-y-2">
              <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" class="rounded" />
                <span class="text-sm text-gray-600">第1章</span>
                <span class="text-sm font-medium flex-1 truncate">觉醒</span>
                <span class="text-yellow-500">★</span>
              </div>
              <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" class="rounded" />
                <span class="text-sm text-gray-600">第2章</span>
                <span class="text-sm font-medium flex-1 truncate">星际联盟</span>
              </div>
              <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" class="rounded" />
                <span class="text-sm text-gray-600">第3章</span>
                <span class="text-sm font-medium flex-1 truncate">暗流涌动</span>
              </div>
            </div>
          </Show>
        </div>

        {/* 底部按钮 */}
        <div class="p-4 border-t border-gray-200 space-y-2">
          <button class="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-medium">
            AI 生成大纲
          </button>
          <button class="w-full py-2 border border-purple-300 text-purple-600 rounded-lg text-sm">
            生成细纲
          </button>
        </div>
      </aside>

      {/* 中间内容区 */}
      <main class="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div class="bg-white border-b border-gray-200 px-6 py-4">
          <Show when={project()}>
            {(p) => (
              <div>
                <h1 class="text-lg font-bold text-gray-800">{p().name}</h1>
                <p class="text-sm text-gray-500 mt-1">{p().genre} · {p().totalWordCount.toLocaleString()} 字 · {p().chapterCount} 章</p>
              </div>
            )}
          </Show>
        </div>

        {/* 内容区 */}
        <div class="flex-1 p-6 overflow-auto">
          <Show when={!loading()} fallback={<div class="text-center py-20 text-gray-400">加载中...</div>}>
            <div class="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
              <p class="text-gray-400 text-center py-20">
                📝 工作台内容区域<br />
                <span class="text-sm">（STDD 骨架阶段，后续接入实际编辑器）</span>
              </p>
            </div>
          </Show>
        </div>
      </main>

      {/* 右侧面板 */}
      <aside class="w-72 bg-white border-l border-gray-200 p-4">
        <h3 class="font-bold text-gray-800 mb-4">生成设置</h3>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600">目标字数</label>
            <div class="flex items-center gap-2 mt-1">
              <button class="w-8 h-8 rounded border border-gray-200 flex items-center justify-center">-</button>
              <span class="flex-1 text-center font-medium">3000</span>
              <button class="w-8 h-8 rounded border border-gray-200 flex items-center justify-center">+</button>
            </div>
          </div>

          <div>
            <label class="text-sm text-gray-600">字数容差</label>
            <div class="mt-1 text-sm text-gray-500">±300 字</div>
          </div>

          <div>
            <label class="text-sm text-gray-600">参考章节数</label>
            <select class="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2">
              <option>3 章</option>
              <option>5 章</option>
              <option>10 章</option>
            </select>
          </div>

          <div>
            <label class="text-sm text-gray-600">AI 模型</label>
            <select class="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2">
              <option>豆包模型</option>
              <option>文心模型</option>
              <option>通义模型</option>
            </select>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-200">
          <h4 class="text-sm font-medium text-gray-700 mb-2">上下文参考</h4>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" checked disabled class="rounded" />
              <span class="text-gray-500">大纲和细纲</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" checked class="rounded" />
              <span>已有正文摘要</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" checked class="rounded" />
              <span>主角状态追踪</span>
            </label>
          </div>
        </div>

        <div class="mt-6 space-y-2">
          <button class="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-medium">
            开始生成
          </button>
          <button class="w-full py-2 border border-purple-300 text-purple-600 rounded-lg text-sm">
            批量生成
          </button>
        </div>
      </aside>
    </div>
  );
}
