import { Show } from 'solid-js';
import type { Shot3DStore } from '../shot-3d-store';

interface InfoPanelProps {
  store: Shot3DStore;
}

export default function InfoPanel(props: InfoPanelProps) {
  const selected = () => {
    const s = props.store.scene();
    if (!s.selectedObjectId) return undefined;
    return s.cylinders.find(c => c.id === s.selectedObjectId);
  };

  const mode = () => props.store.transformMode();

  return (
    <Show when={selected()}>
      {cyl => (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '200px',
            padding: '12px',
            'border-radius': '10px',
            background: 'rgba(30,31,34,0.92)',
            border: '1px solid #3a3a3a',
            color: '#e0e0e0',
            'font-size': '13px',
            'z-index': 10,
            display: 'flex',
            'flex-direction': 'column',
            gap: '8px'
          }}
        >
          <div style={{ 'font-weight': 600 }}>Object</div>
          <div>ID: {cyl().id}</div>
          <div>Label: {cyl().label}</div>
          <div>Importance: {cyl().importance}</div>

          <div style={{ display: 'flex', gap: '4px', 'margin-top': '4px' }}>
            <button
              onClick={() => props.store.setTransformMode('translate')}
              style={{
                flex: 1,
                padding: '6px',
                'border-radius': '6px',
                border: '1px solid #444',
                background: mode() === 'translate' ? '#3d6cff' : '#25262b',
                color: '#e0e0e0',
                cursor: 'pointer',
                'font-size': '12px'
              }}
            >
              移动
            </button>
            <button
              onClick={() => props.store.setTransformMode('scale')}
              style={{
                flex: 1,
                padding: '6px',
                'border-radius': '6px',
                border: '1px solid #444',
                background: mode() === 'scale' ? '#3d6cff' : '#25262b',
                color: '#e0e0e0',
                cursor: 'pointer',
                'font-size': '12px'
              }}
            >
              缩放
            </button>
          </div>

          <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr 1fr', gap: '4px' }}>
            <div>X</div>
            <div>Y</div>
            <div>Z</div>
            <Num value={cyl().position.x} onChange={v => props.store.updateCylinder(cyl().id, { position: { ...cyl().position, x: v } })} />
            <Num value={cyl().position.y} onChange={v => props.store.updateCylinder(cyl().id, { position: { ...cyl().position, y: v } })} />
            <Num value={cyl().position.z} onChange={v => props.store.updateCylinder(cyl().id, { position: { ...cyl().position, z: v } })} />
          </div>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <span>Radius</span>
            <Num value={cyl().radius} onChange={v => props.store.updateCylinder(cyl().id, { radius: v })} />
          </div>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <span>Height</span>
            <Num value={cyl().height} onChange={v => props.store.updateCylinder(cyl().id, { height: v })} />
          </div>
        </div>
      )}
    </Show>
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
