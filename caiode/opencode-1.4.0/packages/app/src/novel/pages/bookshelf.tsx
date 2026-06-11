import { createSignal, For, Show } from 'solid-js';
import { createNovelProjectProvider } from '../providers/novel-project';
import type { Project } from '../types';

const provider = createNovelProjectProvider();

export default function BookshelfPage() {
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [loading, setLoading] = createSignal(true);

  // STDD 骨架：加载项目列表
  const loadProjects = async () => {
    setLoading(true);
    const data = await provider.listProjects();
    setProjects(data);
    setLoading(false);
  };

  // 初始加载
  if (typeof window !== 'undefined') {
    loadProjects();
  }

  return (
    <div class="min-h-screen bg-[#f8f9ff]">
      {/* 顶部导航 */}
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">≡</span>
          <span class="text-purple-600 text-xl font-bold">📚 我的书架</span>
          <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-sm">
            {projects().length}本
          </span>
        </div>
        <button class="text-gray-500 hover:text-gray-700">🔄</button>
      </header>

      {/* 搜索栏 */}
      <div class="px-6 py-4">
        <div class="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-2">
          <span class="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="搜索小说..."
            class="flex-1 outline-none text-gray-700"
          />
          <span class="text-gray-400 cursor-pointer">❓</span>
        </div>
      </div>

      {/* 工具栏 */}
      <div class="px-6 pb-4 flex items-center gap-3 flex-wrap">
        <button class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">⚡</button>
        <button class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">⊞</button>
        <button class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">📄</button>
        <button class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">✓</button>
        <button class="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-1">
          <span>+</span> 新建
        </button>
      </div>

      {/* 项目网格 */}
      <div class="px-6 pb-8">
        <Show when={!loading()} fallback={<div class="text-center py-20 text-gray-500">加载中...</div>}>
          <Show when={projects().length > 0} fallback={<EmptyState />}>
            <div class="grid grid-cols-2 gap-4">
              <For each={projects()}>
                {(project) => <ProjectCard project={project} />}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}

// 项目卡片组件
function ProjectCard(props: { project: Project }) {
  const genreColorMap: Record<string, string> = {
    '奇幻': 'from-purple-400 to-purple-600',
    '科幻': 'from-blue-400 to-blue-600',
    '玄幻': 'from-red-400 to-red-600',
    '都市': 'from-green-400 to-green-600',
    '穿越': 'from-yellow-400 to-yellow-600',
  };

  const gradient = genreColorMap[props.project.genre] || 'from-gray-400 to-gray-600';

  return (
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 封面 */}
      <div class={`h-32 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span class="text-white text-4xl opacity-50">📖</span>
      </div>
      {/* 信息 */}
      <div class="p-4">
        <h3 class="font-bold text-gray-800 truncate">{props.project.name}</h3>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{props.project.genre}</span>
        </div>
        <div class="mt-3 text-xs text-gray-500 space-y-1">
          <div>共 {props.project.chapterCount} 章</div>
          <div>共 {props.project.totalWordCount.toLocaleString()} 字</div>
          <div>最后编辑：{formatTime(props.project.lastUpdated)}</div>
        </div>
      </div>
    </div>
  );
}

// 空状态
function EmptyState() {
  return (
    <div class="text-center py-20">
      <div class="text-6xl mb-4">📚</div>
      <h3 class="text-lg font-bold text-gray-700">书架空空如也</h3>
      <p class="text-gray-500 mt-2">创建你的第一部小说...</p>
      <div class="mt-6 flex justify-center gap-3">
        <button class="px-4 py-2 bg-purple-600 text-white rounded-lg">简易创作</button>
        <button class="px-4 py-2 border border-gray-300 rounded-lg">创建新项目</button>
        <button class="px-4 py-2 border border-gray-300 rounded-lg">25道题引导</button>
      </div>
    </div>
  );
}

// 时间格式化
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}
