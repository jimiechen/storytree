import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export interface LoopContext {
  stop: () => void;
}

export function startRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  orbit: OrbitControls,
  transform?: TransformControls,
  groupTransform?: TransformControls
): LoopContext {
  let running = true;
  let rafId = 0;

  const tick = () => {
    if (!running) return;
    rafId = requestAnimationFrame(tick);
    orbit.update();
    if (transform) (transform as any).update();
    if (groupTransform) (groupTransform as any).update();
    renderer.render(scene, camera);
  };

  tick();

  const stop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  };

  return { stop };
}
