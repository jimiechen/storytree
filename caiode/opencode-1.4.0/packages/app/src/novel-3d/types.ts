/**
 * 3D Camera Shot MVP 类型定义
 */

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type ShotCamera = {
  mode: 'perspective' | 'orthographic';
  position: Vec3;
  target: Vec3;
  fov: number;
  near: number;
  far: number;
};

export type CylinderObject = {
  id: string;
  label: string;
  position: Vec3;
  radius: number;
  height: number;
  color: string;
  glow: boolean;
  selected: boolean;
  importance: 'hero' | 'secondary' | 'background';
};

export type ShotScene3D = {
  id: string;
  title: string;
  prompt: string;
  camera: ShotCamera;
  cylinders: CylinderObject[];
  selectedObjectId?: string;
};

export type CameraPreset = {
  key: string;
  label: string;
  camera: ShotCamera;
};

export type PromptParseResult = {
  rows: number;
  cols: number;
  spacingX: number;
  spacingZ: number;
  baseRadius: number;
  baseHeight: number;
  centerHeroCylinder: boolean;
  cameraPreset: string;
  fov: number;
};
