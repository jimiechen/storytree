import { For } from 'solid-js';
import type { Shot3DStore } from '../shot-3d-store';
import { CAMERA_PRESETS } from '../camera-presets';

interface CameraPanelProps {
  store: Shot3DStore;
}

export default function CameraPanel(props: CameraPanelProps) {
  const cam = () => props.store.scene().camera;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        width: '220px',
        padding: '12px',
        'border-radius': '10px',
        background: 'rgba(30,31,34,0.92)',
        border: '1px solid #3a3a3a',
        color: '#e0e0e0',
        'font-size': '13px',
        'z-index': 10,
        display: 'flex',
        'flex-direction': 'column',
        gap: '10px'
      }}
    >
      <div style={{ 'font-weight': 600, 'margin-bottom': '4px' }}>Camera</div>

      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
        <For each={CAMERA_PRESETS}>
          {preset => (
            <button
              onClick={() => props.store.updateCamera({ ...preset.camera })}
              style={{
                padding: '6px 10px',
                'border-radius': '6px',
                border: '1px solid #444',
                background: '#25262b',
                color: '#e0e0e0',
                cursor: 'pointer',
                'text-align': 'left',
                'font-size': '12px'
              }}
            >
              {preset.label}
            </button>
          )}
        </For>
      </div>

      <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr 1fr', gap: '4px', 'margin-top': '4px' }}>
        <div>Pos X</div>
        <div>Pos Y</div>
        <div>Pos Z</div>
        <Num value={cam().position.x} onChange={v => props.store.updateCameraPosition({ x: v })} />
        <Num value={cam().position.y} onChange={v => props.store.updateCameraPosition({ y: v })} />
        <Num value={cam().position.z} onChange={v => props.store.updateCameraPosition({ z: v })} />
      </div>

      <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr 1fr', gap: '4px' }}>
        <div>Tgt X</div>
        <div>Tgt Y</div>
        <div>Tgt Z</div>
        <Num value={cam().target.x} onChange={v => props.store.updateCameraTarget({ x: v })} />
        <Num value={cam().target.y} onChange={v => props.store.updateCameraTarget({ y: v })} />
        <Num value={cam().target.z} onChange={v => props.store.updateCameraTarget({ z: v })} />
      </div>

      <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'margin-top': '4px' }}>
        <span>FOV</span>
        <Num value={cam().fov} onChange={v => props.store.updateCamera({ fov: v })} />
      </div>
    </div>
  );
}

function Num(props: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      step={0.1}
      value={props.value}
      onInput={e => props.onChange(parseFloat(e.currentTarget.value) || 0)}
      style={{
        width: '100%',
        padding: '4px',
        'border-radius': '4px',
        border: '1px solid #444',
        background: '#1e1f22',
        color: '#e0e0e0',
        'font-size': '12px'
      }}
    />
  );
}
