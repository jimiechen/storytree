import { createShot3DStore } from '../shot-3d-store';
import { ThreeViewport } from './ThreeViewport';
import CameraPanel from './CameraPanel';
import InfoPanel from './InfoPanel';
import PromptPanel from './PromptPanel';

export default function Shot3DPage() {
  const store = createShot3DStore();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <ThreeViewport store={store} />
      <CameraPanel store={store} />
      <InfoPanel store={store} />
      <PromptPanel store={store} />
    </div>
  );
}
