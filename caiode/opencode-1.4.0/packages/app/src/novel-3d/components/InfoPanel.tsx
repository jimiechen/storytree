import { Show, createMemo } from 'solid-js';
import type { Shot3DStore } from '../shot-3d-store';
import type { SceneObject, CylinderObject, BoxObject, LightObject } from '../types';
import { isCylinder, isBox, isLight } from '../types';

export function InfoPanel(props: { store: Shot3DStore }) {
  const store = props.store;

  const selected = () => {
    const s = store.scene();
    if (!s.selectedObjectId) return undefined;
    return (
      s.cylinders.find(c => c.id === s.selectedObjectId) ||
      s.boxes.find(b => b.id === s.selectedObjectId) ||
      s.lights.find(l => l.id === s.selectedObjectId)
    );
  };

  const mode = () => store.transformMode();

  const setMode = (m: 'translate' | 'scale') => store.setTransformMode(m);

  const updatePosition = (obj: SceneObject, axis: 'x' | 'y' | 'z', value: number) => {
    const newPos = { ...obj.position, [axis]: value };
    if (isCylinder(obj)) {
      store.updateCylinder(obj.id, { position: newPos });
    } else if (isBox(obj)) {
      store.updateBox(obj.id, { position: newPos });
    } else if (isLight(obj)) {
      store.updateLight(obj.id, { position: newPos });
    }
  };

  const Num = (p: { label: string; value: number; onChange: (v: number) => void; step?: number }) => (
    <div class="flex items-center gap-1">
      <span class="text-[10px] w-4 text-right opacity-50">{p.label}</span>
      <input
        type="number"
        class="w-14 bg-neutral-800/50 border border-neutral-700 rounded px-1 py-0.5 text-xs text-right"
        value={Number.isFinite(p.value) ? p.value.toFixed(2) : '0.00'}
        step={p.step ?? 0.1}
        onInput={e => {
          const v = parseFloat((e.target as HTMLInputElement).value);
          if (!Number.isNaN(v)) p.onChange(v);
        }}
      />
    </div>
  );

  const CylinderFields = (p: { obj: CylinderObject }) => (
    <div class="space-y-2 mb-3">
      <div>
        <label class="text-xs opacity-60">Radius</label>
        <Num label="R" value={p.obj.radius} onChange={v => store.updateCylinder(p.obj.id, { radius: v })} step={0.05} />
      </div>
      <div>
        <label class="text-xs opacity-60">Height</label>
        <Num label="H" value={p.obj.height} onChange={v => store.updateCylinder(p.obj.id, { height: v })} step={0.1} />
      </div>
    </div>
  );

  const BoxFields = (p: { obj: BoxObject }) => (
    <div class="space-y-2 mb-3">
      <div>
        <label class="text-xs opacity-60">Width</label>
        <Num label="W" value={p.obj.width} onChange={v => store.updateBox(p.obj.id, { width: v })} step={0.1} />
      </div>
      <div>
        <label class="text-xs opacity-60">Height</label>
        <Num label="H" value={p.obj.height} onChange={v => store.updateBox(p.obj.id, { height: v })} step={0.1} />
      </div>
      <div>
        <label class="text-xs opacity-60">Depth</label>
        <Num label="D" value={p.obj.depth} onChange={v => store.updateBox(p.obj.id, { depth: v })} step={0.1} />
      </div>
    </div>
  );

  const LightFields = (p: { obj: LightObject }) => (
    <div class="space-y-2 mb-3">
      <div>
        <label class="text-xs opacity-60">Intensity</label>
        <Num label="I" value={p.obj.intensity} onChange={v => store.updateLight(p.obj.id, { intensity: v })} step={0.1} />
      </div>
      <div>
        <label class="text-xs opacity-60">Range</label>
        <Num label="R" value={p.obj.range} onChange={v => store.updateLight(p.obj.id, { range: v })} step={0.5} />
      </div>
      <div>
        <label class="text-xs opacity-60">Angle (°)</label>
        <Num label="A" value={p.obj.angleDeg} onChange={v => store.updateLight(p.obj.id, { angleDeg: v })} step={1} />
      </div>
    </div>
  );

  return (
    <Show when={selected()}>
      {(obj) => {
        const o = obj();
        return (
          <div class="absolute top-4 right-4 w-56 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-lg p-3 text-neutral-100 z-50"
            style={{ color: '#e0e0e0', 'font-size': '13px' }}>
            <div class="text-sm font-semibold mb-2 border-b border-neutral-700 pb-1">
              Object
            </div>

            <div class="space-y-1 mb-3">
              <div class="text-xs opacity-60">ID</div>
              <div class="text-xs font-mono truncate">{o.id}</div>
              <div class="text-xs opacity-60">Label</div>
              <div class="text-xs">{o.label}</div>
              <div class="text-xs opacity-60">Type</div>
              <div class="text-xs">
                {isCylinder(o) ? 'Cylinder' : isBox(o) ? 'Box' : 'Light'}
              </div>
            </div>

            {isCylinder(o) && <CylinderFields obj={o} />}
            {isBox(o) && <BoxFields obj={o} />}
            {isLight(o) && <LightFields obj={o} />}

            {/* Position (common) */}
            <div class="space-y-2 mb-3">
              <label class="text-xs opacity-60">Position</label>
              <div class="grid grid-cols-3 gap-1">
                <Num label="X" value={o.position.x} onChange={v => updatePosition(o, 'x', v)} />
                <Num label="Y" value={o.position.y} onChange={v => updatePosition(o, 'y', v)} />
                <Num label="Z" value={o.position.z} onChange={v => updatePosition(o, 'z', v)} />
              </div>
            </div>

            {/* Transform mode */}
            <div class="flex gap-2">
              <button
                class={`flex-1 py-1 px-2 rounded text-xs border transition-colors ${
                  mode() === 'translate'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                    : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
                onClick={() => setMode('translate')}
              >
                移动
              </button>
              <button
                class={`flex-1 py-1 px-2 rounded text-xs border transition-colors ${
                  mode() === 'scale'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                    : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
                onClick={() => setMode('scale')}
              >
                缩放
              </button>
            </div>
          </div>
        );
      }}
    </Show>
  );
}
