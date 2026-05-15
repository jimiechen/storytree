import * as THREE from 'three';
import type { ShotCamera } from '../../types';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  grid: THREE.GridHelper;
  axes: THREE.AxesHelper;
}

export function createScene(container: HTMLElement): SceneContext {
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1e1f22');

  // Camera
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(-6, 3, 8);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lights
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight('#ffffff', 0.8);
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight('#aaccff', 0.3);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);

  // Grid
  const grid = new THREE.GridHelper(30, 30, '#3d6cff', '#2a2a2a');
  scene.add(grid);

  // Axes
  const axes = new THREE.AxesHelper(3);
  scene.add(axes);

  return { scene, camera, renderer, grid, axes };
}

export function updateCameraFromStore(
  camera: THREE.PerspectiveCamera,
  shotCamera: ShotCamera
): void {
  camera.position.set(
    shotCamera.position.x,
    shotCamera.position.y,
    shotCamera.position.z
  );
  camera.fov = shotCamera.fov;
  camera.near = shotCamera.near;
  camera.far = shotCamera.far;
  camera.updateProjectionMatrix();
}

export function updateCameraTarget(
  camera: THREE.PerspectiveCamera,
  target: { x: number; y: number; z: number }
): void {
  camera.lookAt(target.x, target.y, target.z);
}
