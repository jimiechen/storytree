import { createSignal } from 'solid-js';
import type { Shot3DStore } from '../shot-3d-store';
import { parsePrompt } from '../mock-prompt-parser';
import { generateCylinderArray } from '../cylinder-array';

interface PromptPanelProps {
  store: Shot3DStore;
}

export default function PromptPanel(props: PromptPanelProps) {
  const [input, setInput] = createSignal(props.store.scene().prompt);

  const handleGenerate = () => {
    const prompt = input();
    props.store.setPrompt(prompt);
    const config = parsePrompt(prompt);
    const cylinders = generateCylinderArray(config);
    props.store.setCylinders(cylinders);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        gap: '8px',
        'align-items': 'center',
        'z-index': 100,
        'pointer-events': 'auto'
      }}
    >
      <input
        type="text"
        value={input()}
        onInput={e => setInput(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleGenerate();
        }}
        placeholder="输入 prompt，例如：生成 5x4 圆柱体方阵，低机位广角..."
        style={{
          flex: 1,
          padding: '10px 14px',
          'border-radius': '8px',
          border: '1px solid #3a3a3a',
          background: '#25262b',
          color: '#e0e0e0',
          'font-size': '14px',
          outline: 'none',
          'pointer-events': 'auto'
        }}
      />
      <button
        onClick={handleGenerate}
        style={{
          padding: '10px 18px',
          'border-radius': '8px',
          border: 'none',
          background: '#3d6cff',
          color: '#fff',
          'font-size': '14px',
          cursor: 'pointer',
          'pointer-events': 'auto',
          'white-space': 'nowrap'
        }}
      >
        生成
      </button>
      <button
        onClick={() => props.store.triggerExportPNG()}
        style={{
          padding: '10px 14px',
          'border-radius': '8px',
          border: '1px solid #444',
          background: '#25262b',
          color: '#e0e0e0',
          'font-size': '14px',
          cursor: 'pointer',
          'pointer-events': 'auto',
          'white-space': 'nowrap'
        }}
        title="导出 PNG"
      >
        PNG
      </button>
      <button
        onClick={() => props.store.triggerCopyPrompt()}
        style={{
          padding: '10px 14px',
          'border-radius': '8px',
          border: '1px solid #444',
          background: '#25262b',
          color: '#e0e0e0',
          'font-size': '14px',
          cursor: 'pointer',
          'pointer-events': 'auto',
          'white-space': 'nowrap'
        }}
        title="复制 Prompt"
      >
        Copy
      </button>
    </div>
  );
}
