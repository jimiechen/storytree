import { Show } from 'solid-js';

export function MockModeBanner() {
  return (
    <div class="flex items-center justify-center px-4 py-2 bg-amber-50 border-b border-amber-200">
      <div class="flex items-center gap-2">
        <span class="text-lg">🧪</span>
        <span class="text-sm font-medium text-amber-800">
          Mock Mode — 模拟模式，不调用真实 AI
        </span>
        <span class="text-xs text-amber-600 ml-2">
          FakeAgentProvider
        </span>
      </div>
    </div>
  );
}
