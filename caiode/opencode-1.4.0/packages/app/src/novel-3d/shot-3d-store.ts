import { createSignal } from 'solid-js';
import type { ShotScene3D, CylinderObject, BoxObject, LightObject, Theme, ShotCamera } from './types';
import { CAMERA_PRESETS } from './camera-presets';

/**
 * 3D Shot Store - 管理 3D 场景状态（三数组方案）
 */

export function createShot3DStore() {
  const defaultScene: ShotScene3D = {
    id: 'scene-001',
    title: 'Camera Shot 3D',
    prompt: '生成一个 5x4 的圆柱体方阵，低机位广角，相机在左前方，中心圆柱更高并发光。',
    camera: { ...CAMERA_PRESETS[0].camera },
    cylinders: [],
    boxes: [],
    lights: [],
    theme: 'dark'
  };

  const [scene, setScene] = createSignal<ShotScene3D>(defaultScene);
  const [transformMode, setTransformMode] = createSignal<'translate' | 'scale'>('translate');

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

  const addCylinder = () => {
    const s = scene();
    const id = `cyl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const x = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 6;
    setScene({
      ...s,
      cylinders: [
        ...s.cylinders,
        {
          id,
          label: `Cylinder ${s.cylinders.length + 1}`,
          position: { x, y: 0, z },
          radius: 0.4,
          height: 1.2,
          color: '#3d6cff',
          glow: false,
          selected: false,
          importance: 'secondary'
        }
      ],
      selectedObjectId: id
    });
  };

  const setBoxes = (boxes: BoxObject[]) => {
    setScene(prev => ({ ...prev, boxes }));
  };

  const updateBox = (id: string, updates: Partial<BoxObject>) => {
    setScene(prev => ({
      ...prev,
      boxes: prev.boxes.map(b =>
        b.id === id ? { ...b, ...updates } : b
      )
    }));
  };

  const addBox = () => {
    const s = scene();
    const id = `box-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const x = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 6;
    setScene({
      ...s,
      boxes: [
        ...s.boxes,
        {
          id,
          label: `Box ${s.boxes.length + 1}`,
          position: { x, y: 0, z },
          width: 1.0,
          height: 1.5,
          depth: 1.0,
          color: '#ff6b6b',
          glow: false,
          selected: false
        }
      ],
      selectedObjectId: id
    });
  };

  const setLights = (lights: LightObject[]) => {
    setScene(prev => ({ ...prev, lights }));
  };

  const updateLight = (id: string, updates: Partial<LightObject>) => {
    setScene(prev => ({
      ...prev,
      lights: prev.lights.map(l =>
        l.id === id ? { ...l, ...updates } : l
      )
    }));
  };

  const addLight = () => {
    const s = scene();
    const id = `light-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const x = (Math.random() - 0.5) * 4;
    const y = 3 + Math.random() * 2;
    const z = (Math.random() - 0.5) * 4;
    setScene({
      ...s,
      lights: [
        ...s.lights,
        {
          id,
          kind: 'light',
          label: `Light ${s.lights.length + 1}`,
          position: { x, y, z },
          rotation: { x: Math.PI / 4, y: 0, z: 0 },
          color: '#ffaa00',
          intensity: 1.0,
          range: 10,
          angleDeg: 30,
          selected: false
        }
      ],
      selectedObjectId: id
    });
  };

  const removeLight = (id: string) => {
    setScene(prev => ({
      ...prev,
      lights: prev.lights.filter(l => l.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? undefined : prev.selectedObjectId
    }));
  };

  const selectAny = (id: string | undefined) => {
    if (scene().selectedObjectId === id) return;
    setScene(s => ({
      ...s,
      selectedObjectId: id,
      cylinders: s.cylinders.map(c => ({ ...c, selected: c.id === id })),
      boxes: s.boxes.map(b => ({ ...b, selected: b.id === id })),
      lights: s.lights.map(l => ({ ...l, selected: l.id === id })),
    }));
  };

  // Group / Formation management
  const groups: Record<string, { id: string; name: string }> = {};

  const createGroup = (name?: string): string => {
    const groupId = `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    groups[groupId] = { id: groupId, name: name || `Group ${Object.keys(groups).length + 1}` };
    return groupId;
  };

  const joinGroup = (objectId: string, groupId: string) => {
    setScene(s => ({
      ...s,
      cylinders: s.cylinders.map(c => c.id === objectId ? { ...c, groupId } : c),
      boxes: s.boxes.map(b => b.id === objectId ? { ...b, groupId } : b),
      lights: s.lights.map(l => l.id === objectId ? { ...l, groupId } : l),
    }));
  };

  const leaveGroup = (objectId: string) => {
    setScene(s => ({
      ...s,
      cylinders: s.cylinders.map(c => c.id === objectId ? { ...c, groupId: undefined } : c),
      boxes: s.boxes.map(b => b.id === objectId ? { ...b, groupId: undefined } : b),
      lights: s.lights.map(l => l.id === objectId ? { ...l, groupId: undefined } : l),
    }));
  };

  const deleteGroup = (groupId: string) => {
    setScene(s => ({
      ...s,
      cylinders: s.cylinders.map(c => c.groupId === groupId ? { ...c, groupId: undefined } : c),
      boxes: s.boxes.map(b => b.groupId === groupId ? { ...b, groupId: undefined } : b),
      lights: s.lights.map(l => l.groupId === groupId ? { ...l, groupId: undefined } : l),
    }));
    delete groups[groupId];
  };

  const getGroupMembers = (groupId: string) => {
    const s = scene();
    return [
      ...s.cylinders.filter(c => c.groupId === groupId),
      ...s.boxes.filter(b => b.groupId === groupId),
      ...s.lights.filter(l => l.groupId === groupId),
    ];
  };

  const selectCylinder = (id: string | undefined) => selectAny(id);
  const selectBox = (id: string | undefined) => selectAny(id);
  const selectLight = (id: string | undefined) => selectAny(id);

  const toggleTheme = () => {
    setScene(s => ({
      ...s,
      theme: s.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const clearScene = () => {
    setScene(s => ({
      ...s,
      cylinders: [],
      boxes: [],
      lights: [],
      selectedObjectId: undefined
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

  const serialize = (): string => {
    const s = scene();
    return JSON.stringify({
      id: s.id,
      title: s.title,
      prompt: s.prompt,
      camera: s.camera,
      cylinders: s.cylinders,
      boxes: s.boxes,
      lights: s.lights,
      theme: s.theme
    }, null, 2);
  };

  const deserialize = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;

      setScene({
        id: data.id || 'scene-imported',
        title: data.title || 'Imported Scene',
        prompt: data.prompt || '',
        camera: data.camera || { ...CAMERA_PRESETS[0].camera },
        cylinders: Array.isArray(data.cylinders) ? data.cylinders : [],
        boxes: Array.isArray(data.boxes) ? data.boxes : [],
        lights: Array.isArray(data.lights) ? data.lights : [],
        theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : 'dark',
        selectedObjectId: undefined
      });
      return true;
    } catch (e) {
      console.warn('[Shot3DStore] Deserialize failed:', e);
      return false;
    }
  };

  return {
    scene,
    transformMode,
    setTransformMode,
    updateCamera,
    updateCameraPosition,
    updateCameraTarget,
    setCylinders,
    updateCylinder,
    addCylinder,
    setBoxes,
    updateBox,
    addBox,
    setLights,
    updateLight,
    addLight,
    removeLight,
    selectAny,
    selectCylinder,
    selectBox,
    selectLight,
    toggleTheme,
    clearScene,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    getGroupMembers,
    setPrompt,
    registerExportPNG,
    triggerExportPNG,
    registerCopyPrompt,
    triggerCopyPrompt,
    serialize,
    deserialize
  };
}

export type Shot3DStore = ReturnType<typeof createShot3DStore>;
