import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { Shot3DStore } from '../../shot-3d-store';

export interface TransformContext {
  transform: TransformControls;
  attach: (mesh: THREE.Object3D | null) => void;
  setMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  dispose: () => void;
}

export function createTransformControls(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  store: Shot3DStore
): TransformContext {
  const transform = new TransformControls(camera, renderer.domElement);

  transform.addEventListener('dragging-changed', (e) => {
    const event = e as unknown as { value: boolean };
    // 可以在这里暂停 orbit controls，如果需要的话由外部处理
    void event.value;
  });

  transform.addEventListener('change', () => {
    const attached = transform.object;
    if (!attached) return;
    const id = attached.userData.cylinderId as string | undefined;
    if (!id) return;
    const pos = attached.position;
    store.updateCylinder(id, {
      position: { x: pos.x, y: pos.y, z: pos.z }
    });
  });

  const attach = (mesh: THREE.Object3D | null) => {
    if (mesh) {
      transform.attach(mesh);
      (transform as unknown as THREE.Object3D).visible = true;
    } else {
      transform.detach();
      (transform as unknown as THREE.Object3D).visible = false;
    }
  };

  const setMode = (mode: 'translate' | 'rotate' | 'scale') => {
    transform.setMode(mode);
  };

  const dispose = () => {
    transform.detach();
    transform.dispose();
  };

  return { transform, attach, setMode, dispose };
}
