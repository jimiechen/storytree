import { createMemo } from 'solid-js';
import type { Shot3DStore } from '../shot-3d-store';

export function ShapeToolbar(props: {
  store: Shot3DStore;
}) {
  const theme = createMemo(() => props.store.scene().theme);

  const btnBase =
    'px-3 py-2 rounded-md text-sm border transition-colors flex items-center gap-1';

  const btnNormal = () =>
    theme() === 'dark'
      ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
      : 'bg-white border-neutral-300 hover:bg-neutral-100';

  const btnAccent = () =>
    theme() === 'dark'
      ? 'bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30'
      : 'bg-amber-100 border-amber-300 hover:bg-amber-200';

  const btnDanger = () =>
    theme() === 'dark'
      ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
      : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200';

  return (
    <div
      class="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-[150]"
      style={{ color: '#e0e0e0', 'font-size': '13px' }}
    >
      <button
        class={`${btnBase} ${btnNormal()}`}
        onClick={() => props.store.addCylinder()}
        style={{ color: '#e0e0e0' }}
      >
        ◎ 圆柱体
      </button>

      <button
        class={`${btnBase} ${btnNormal()}`}
        onClick={() => props.store.addBox()}
        style={{ color: '#e0e0e0' }}
      >
        ▣ 长方体
      </button>

      <button
        class={`${btnBase} ${btnNormal()}`}
        onClick={() => props.store.addLight()}
        style={{ color: '#e0e0e0' }}
      >
        ✦ 光源
      </button>

      <div class="w-px bg-neutral-500/40 mx-1" />

      <button
        class={`${btnBase} ${btnAccent()}`}
        onClick={() => props.store.toggleTheme()}
        title="切换画布明暗"
        style={{ color: theme() === 'dark' ? '#fcd34d' : '#d97706' }}
      >
        {theme() === 'dark' ? '☀ 浅色' : '☾ 深色'}
      </button>

      <div class="w-px bg-neutral-500/40 mx-1" />

      <button
        class={`${btnBase} ${btnDanger()}`}
        onClick={() => props.store.clearScene()}
        title="清空场景"
        style={{ color: theme() === 'dark' ? '#fca5a5' : '#dc2626' }}
      >
        ✕ 清空
      </button>
    </div>
  );
}
