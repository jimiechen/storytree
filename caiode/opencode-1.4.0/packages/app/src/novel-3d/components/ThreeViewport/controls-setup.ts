import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Shot3DStore } from '../../shot-3d-store';

export interface ControlsContext {
  orbit: OrbitControls;
  dispose: () => void;
}

export function createControls(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  store: Shot3DStore
): ControlsContext {
  const orbit = new OrbitControls(camera, renderer.domElement);

  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.screenSpacePanning = false;
  orbit.minDistance = 1;
  orbit.maxDistance = 50;
  orbit.maxPolarAngle = Math.PI / 2 - 0.02;
  orbit.target.set(
    store.scene().camera.target.x,
    store.scene().camera.target.y,
    store.scene().camera.target.z
  );
  orbit.update();

  const onChange = () => {
    const pos = camera.position;
    store.updateCameraPosition({ x: pos.x, y: pos.y, z: pos.z });
    const tgt = orbit.target;
    store.updateCameraTarget({ x: tgt.x, y: tgt.y, z: tgt.z });
  };

  orbit.addEventListener('change', onChange);

  const dispose = () => {
    orbit.removeEventListener('change', onChange);
    orbit.dispose();
  };

  return { orbit, dispose };
}

export function syncControlsTarget(
  orbit: OrbitControls,
  target: { x: number; y: number; z: number }
): void {
  orbit.target.set(target.x, target.y, target.z);
  orbit.update();
}
