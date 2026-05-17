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
  groupId?: string;
};

export type BoxObject = {
  id: string;
  label: string;
  position: Vec3;
  width: number;
  height: number;
  depth: number;
  color: string;
  glow: boolean;
  selected: boolean;
  groupId?: string;
};

export type LightObject = {
  id: string;
  kind: 'light';
  label: string;
  position: Vec3;
  rotation: { x: number; y: number; z: number };
  color: string;
  intensity: number;
  range: number;
  angleDeg: number;
  selected: boolean;
  groupId?: string;
};

export type SceneObject = CylinderObject | BoxObject | LightObject;

export function isCylinder(obj: SceneObject): obj is CylinderObject {
  return 'radius' in obj && 'importance' in obj;
}

export function isBox(obj: SceneObject): obj is BoxObject {
  return 'width' in obj && 'depth' in obj;
}

export function isLight(obj: SceneObject): obj is LightObject {
  return 'kind' in obj && obj.kind === 'light';
}

export type Theme = 'light' | 'dark';

export type ShotScene3D = {
  id: string;
  title: string;
  prompt: string;
  camera: ShotCamera;
  cylinders: CylinderObject[];
  boxes: BoxObject[];
  lights: LightObject[];
  selectedObjectId?: string;
  theme: Theme;
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
