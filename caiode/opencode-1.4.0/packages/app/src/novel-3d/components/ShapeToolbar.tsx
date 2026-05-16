import type { Shot3DStore } from '../shot-3d-store';

interface ShapeToolbarProps {
  store: Shot3DStore;
}

export default function ShapeToolbar(props: ShapeToolbarProps) {
  const addCylinder = () => {
    const s = props.store.scene();
    const id = `cyl-${Date.now()}`;
    const x = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 6;
    props.store.setCylinders([
      ...s.cylinders,
      {
        id,
        label: `Cylinder ${s.cylinders.length + 1}`,
        position: { x, y: 0, z },
        radius: 0.45,
        height: 1.8,
        color: '#3d6cff',
        glow: false,
        selected: false,
        importance: 'secondary'
      }
    ]);
  };

  const addBox = () => {
    const s = props.store.scene();
    const id = `box-${Date.now()}`;
    const x = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 6;
    props.store.setCylinders([
      ...s.cylinders,
      {
        id,
        label: `Box ${s.cylinders.length + 1}`,
        position: { x, y: 0, z },
        radius: 0.5,
        height: 1.5,
        color: '#ff6b6b',
        glow: false,
        selected: false,
        importance: 'secondary'
      }
    ]);
  };

  const clearAll = () => {
    props.store.setCylinders([]);
    props.store.selectCylinder(undefined);
  };

  const toggleMode = () => {
    const current = props.store.transformMode();
    props.store.setTransformMode(current === 'translate' ? 'scale' : 'translate');
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        'align-items': 'center',
        padding: '8px 12px',
        'border-radius': '10px',
        background: 'rgba(30,31,34,0.92)',
        border: '1px solid #3a3a3a',
        'z-index': 100,
        'pointer-events': 'auto'
      }}
    >
      <button
        onClick={addCylinder}
        style={{
          padding: '8px 14px',
          'border-radius': '6px',
          border: '1px solid #444',
          background: '#25262b',
          color: '#e0e0e0',
          'font-size': '13px',
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          gap: '6px'
        }}
        title="添加圆柱体"
      >
        <span style={{ 'font-size': '16px' }}>◎</span>
        圆柱体
      </button>
      <button
        onClick={addBox}
        style={{
          padding: '8px 14px',
          'border-radius': '6px',
          border: '1px solid #444',
          background: '#25262b',
          color: '#e0e0e0',
          'font-size': '13px',
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          gap: '6px'
        }}
        title="添加长方体"
      >
        <span style={{ 'font-size': '16px' }}>▢</span>
        长方体
      </button>
      <div style={{ width: '1px', height: '20px', background: '#444' }} />
      <button
        onClick={toggleMode}
        style={{
          padding: '8px 14px',
          'border-radius': '6px',
          border: '1px solid #444',
          background: '#25262b',
          color: '#e0e0e0',
          'font-size': '13px',
          cursor: 'pointer'
        }}
        title="切换移动/缩放模式"
      >
        {props.store.transformMode() === 'translate' ? '✥ 移动' : '⤡ 缩放'}
      </button>
      <button
        onClick={clearAll}
        style={{
          padding: '8px 14px',
          'border-radius': '6px',
          border: '1px solid #444',
          background: '#25262b',
          color: '#ff6b6b',
          'font-size': '13px',
          cursor: 'pointer'
        }}
        title="清空所有"
      >
        清空
      </button>
    </div>
  );
}
