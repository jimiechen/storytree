import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Shot3DStore } from '../../shot-3d-store';

export interface TransformContext {
  transform: TransformControls;
  helper: THREE.Object3D;
  attach: (mesh: THREE.Object3D | null) => void;
  setMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  getMode: () => string;
  dispose: () => void;
}

export function createObjectChangeHandler(store: Shot3DStore) {
  return (obj: THREE.Object3D) => {
    const id = obj.userData?.id as string | undefined;
    const kind = obj.userData?.kind as string | undefined;
    if (!id || !kind) return;

    const pos = { x: obj.position.x, y: obj.position.y, z: obj.position.z };

    switch (kind) {
      case 'cylinder': {
        const height = (obj.userData.height ?? 0) as number;
        store.updateCylinder(id, { position: { ...pos, y: pos.y - height / 2 } });
        break;
      }
      case 'box':
        store.updateBox(id, { position: pos });
        break;
      case 'light':
        store.updateLight(id, {
          position: pos,
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        });
        break;
    }
  };
}

export function createTransformControls(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  store: Shot3DStore,
  orbit?: OrbitControls
): TransformContext {
  const transform = new TransformControls(camera, renderer.domElement);
  const helper = transform.getHelper() as THREE.Object3D;

  transform.setMode('translate');
  transform.setSize(1.0);

  let rafPending = false;
  let lastObj: THREE.Object3D | null = null;

  const objectChangeHandler = createObjectChangeHandler(store);

  transform.addEventListener('dragging-changed', (e) => {
    const event = e as unknown as { value: boolean };
    if (orbit) {
      orbit.enabled = !event.value;
    }
    helper.visible = !!transform.object;
  });

  transform.addEventListener('objectChange', () => {
    lastObj = transform.object;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (lastObj) {
        if (lastObj.type === 'Group') {
          const children = lastObj.children;
          for (const child of children) {
            if ((child as THREE.Mesh).userData?.id) {
              objectChangeHandler(child as THREE.Object3D);
            }
          }
        } else {
          objectChangeHandler(lastObj);
        }
      }
    });
  });

  const attach = (mesh: THREE.Object3D | null) => {
    if (mesh) {
      if (transform.object !== mesh) {
        transform.attach(mesh);
      }
      helper.visible = true;
    } else {
      transform.detach();
      helper.visible = false;
    }
  };

  const setMode = (mode: 'translate' | 'rotate' | 'scale') => {
    transform.setMode(mode);
  };

  const getMode = () => transform.getMode();

  const dispose = () => {
    transform.detach();
    helper.visible = false;
    transform.dispose();
  };

  return { transform, helper, attach, setMode, getMode, dispose };
}
