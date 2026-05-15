import { createSignal } from 'solid-js';
import type { ShotScene3D, CylinderObject, ShotCamera } from './types';
import { CAMERA_PRESETS } from './camera-presets';

/**
 * 3D Shot Store - 管理 3D 场景状态
 */

export function createShot3DStore() {
  const defaultScene: ShotScene3D = {
    id: 'scene-001',
    title: 'Camera Shot 3D',
    prompt: '生成一个 5x4 的圆柱体方阵，低机位广角，相机在左前方，中心圆柱更高并发光。',
    camera: { ...CAMERA_PRESETS[0].camera },
    cylinders: []
  };

  const [scene, setScene] = createSignal<ShotScene3D>(defaultScene);

  let exportPNGAction: (() => void) | undefined;
  let copyPromptAction: (() => void) | undefined;

  const updateCamera = (updates: Partial<ShotCamera>) => {
    setScene(prev => ({
      ...prev,
      camera: { ...prev.camera, ...updates }
    }));
  };

  const updateCameraPosition = (position: { x?: number; y?: number; z?: number }) => {
    setScene(prev => ({
      ...prev,
      camera: {
        ...prev.camera,
        position: { ...prev.camera.position, ...position }
      }
    }));
  };

  const updateCameraTarget = (target: { x?: number; y?: number; z?: number }) => {
    setScene(prev => ({
      ...prev,
      camera: {
        ...prev.camera,
        target: { ...prev.camera.target, ...target }
      }
    }));
  };

  const setCylinders = (cylinders: CylinderObject[]) => {
    setScene(prev => ({ ...prev, cylinders }));
  };

  const updateCylinder = (id: string, updates: Partial<CylinderObject>) => {
    setScene(prev => ({
      ...prev,
      cylinders: prev.cylinders.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  };

  const selectCylinder = (id: string | undefined) => {
    setScene(prev => ({
      ...prev,
      selectedObjectId: id,
      cylinders: prev.cylinders.map(c => ({
        ...c,
        selected: c.id === id
      }))
    }));
  };

  const setPrompt = (prompt: string) => {
    setScene(prev => ({ ...prev, prompt }));
  };

  const registerExportPNG = (action: () => void) => {
    exportPNGAction = action;
  };

  const triggerExportPNG = () => {
    exportPNGAction?.();
  };

  const registerCopyPrompt = (action: () => void) => {
    copyPromptAction = action;
  };

  const triggerCopyPrompt = () => {
    copyPromptAction?.();
  };

  return {
    scene,
    updateCamera,
    updateCameraPosition,
    updateCameraTarget,
    setCylinders,
    updateCylinder,
    selectCylinder,
    setPrompt,
    registerExportPNG,
    triggerExportPNG,
    registerCopyPrompt,
    triggerCopyPrompt
  };
}

export type Shot3DStore = ReturnType<typeof createShot3DStore>;
