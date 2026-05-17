import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Shot3DStore } from '../../shot-3d-store';

export interface GroupTransformContext {
  transform: TransformControls;
  group: THREE.Group;
  attachGroup: (meshes: THREE.Object3D[]) => void;
  detachGroup: () => void;
  setMode: (mode: 'translate' | 'scale') => void;
  getMode: () => string;
  dispose: () => void;
}

export function createGroupTransform(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  store: Shot3DStore,
  orbit?: OrbitControls
): GroupTransformContext {
  const transform = new TransformControls(camera, renderer.domElement);
  const group = new THREE.Group();
  group.name = 'group-transform-target';
  const savedParents = new Map<THREE.Object3D, THREE.Object3D>();

  transform.addEventListener('dragging-changed', (e) => {
    const event = e as unknown as { value: boolean };
    if (orbit) {
      orbit.enabled = !event.value;
    }
  });

  transform.addEventListener('change', () => {
    const mode = transform.getMode();
    const children = group.children as THREE.Mesh[];

    if (mode === 'translate') {
      for (const mesh of children) {
        const id = mesh.userData.id as string | undefined;
        const kind = mesh.userData.kind as string | undefined;
        if (!id) continue;

        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);

        if (kind === 'box') {
          store.updateBox(id, {
            position: { x: worldPos.x, y: worldPos.y, z: worldPos.z }
          });
        } else {
          const height = (mesh.userData.height ?? 0) as number;
          store.updateCylinder(id, {
            position: { x: worldPos.x, y: worldPos.y - height / 2, z: worldPos.z }
          });
        }
      }
    } else if (mode === 'scale') {
      const scl = group.scale;
      for (const mesh of children) {
        const id = mesh.userData.id as string | undefined;
        const kind = mesh.userData.kind as string | undefined;
        const original = mesh.userData.originalScale as { radius: number; height: number } | undefined;
        if (!id || !original) continue;

        if (kind === 'box') {
          store.updateBox(id, {
            width: original.radius * 2 * scl.x,
            height: original.height * scl.y,
            depth: original.radius * 2 * scl.z
          });
        } else {
          store.updateCylinder(id, {
            radius: original.radius * scl.x,
            height: original.height * scl.y
          });
        }
      }
    }
  });

  const attachGroup = (meshes: THREE.Object3D[]) => {
    savedParents.clear();
    group.clear();

    for (const mesh of meshes) {
      savedParents.set(mesh, mesh.parent!);
      group.add(mesh);
    }

    if (group.children.length > 0) {
      try {
        transform.attach(group);
      } catch (err) {
        console.warn('[GroupTransform] attach error:', err);
      }
    } else {
      detachGroup();
    }
  };

  const detachGroup = () => {
    try {
      transform.detach();
    } catch (err) {
      console.warn('[GroupTransform] detach error:', err);
    }

    for (const [mesh, parent] of savedParents) {
      if (parent && mesh.parent !== parent) {
        parent.add(mesh);
      }
    }
    savedParents.clear();
    group.clear();
  };

  const setMode = (mode: 'translate' | 'scale') => {
    transform.setMode(mode);
  };

  const getMode = () => transform.getMode();

  const dispose = () => {
    detachGroup();
    transform.dispose();
    group.clear();
  };

  return { transform, group, attachGroup, detachGroup, setMode, getMode, dispose };
}
