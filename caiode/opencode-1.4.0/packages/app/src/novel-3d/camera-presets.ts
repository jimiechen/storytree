import type { CameraPreset } from './types';

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    key: 'godotPerspective',
    label: 'Godot Perspective',
    camera: {
      mode: 'perspective',
      position: { x: -6, y: 3, z: 8 },
      target: { x: 0, y: 1.5, z: 0 },
      fov: 60,
      near: 0.1,
      far: 1000
    }
  },
  {
    key: 'lowAngleLeft',
    label: 'Low Angle Left',
    camera: {
      mode: 'perspective',
      position: { x: -6, y: 1.2, z: 8 },
      target: { x: 0, y: 1.8, z: 0 },
      fov: 70,
      near: 0.1,
      far: 1000
    }
  },
  {
    key: 'frontWide',
    label: 'Front Wide',
    camera: {
      mode: 'perspective',
      position: { x: 0, y: 2.2, z: 9 },
      target: { x: 0, y: 1.4, z: 0 },
      fov: 65,
      near: 0.1,
      far: 1000
    }
  },
  {
    key: 'topDown',
    label: 'Top Down',
    camera: {
      mode: 'perspective',
      position: { x: 0, y: 10, z: 0.01 },
      target: { x: 0, y: 0, z: 0 },
      fov: 45,
      near: 0.1,
      far: 1000
    }
  },
  {
    key: 'sideView',
    label: 'Left Side',
    camera: {
      mode: 'perspective',
      position: { x: -10, y: 3, z: 0 },
      target: { x: 0, y: 1.2, z: 0 },
      fov: 50,
      near: 0.1,
      far: 1000
    }
  }
];

export function getPresetByKey(key: string): CameraPreset | undefined {
  return CAMERA_PRESETS.find(p => p.key === key);
}
