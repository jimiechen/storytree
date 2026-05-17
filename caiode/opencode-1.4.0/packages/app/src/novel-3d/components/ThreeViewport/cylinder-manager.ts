import * as THREE from 'three';
import { createSignal, type Accessor } from 'solid-js';
import type { CylinderObject } from '../../types';
import { ShapeFactory } from '../../shape-factory';

export interface CylinderMeshEntry {
  id: string;
  mesh: THREE.Mesh;
}

export interface CylinderManager {
  group: THREE.Group;
  entries: Accessor<CylinderMeshEntry[]>;
  update: (cylinders: CylinderObject[], selectedId?: string) => void;
  dispose: () => void;
  raycast: (raycaster: THREE.Raycaster) => string | undefined;
  findById: (id: string) => CylinderMeshEntry | undefined;
  findMeshById: (id: string) => THREE.Mesh | undefined;
}

export function createCylinderManager(): CylinderManager {
  const group = new THREE.Group();
  group.name = 'CylinderGroup';

  const [entries, setEntries] = createSignal<CylinderMeshEntry[]>([]);
  const meshMap = new Map<string, THREE.Mesh>();

  const update = (cylinders: CylinderObject[], selectedId?: string): void => {
    const incomingIds = new Set(cylinders.map(c => c.id));

    for (const [id, mesh] of meshMap) {
      if (!incomingIds.has(id)) {
        group.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        meshMap.delete(id);
      }
    }

    for (const c of cylinders) {
      let mesh = meshMap.get(c.id);
      const isNew = !mesh;

      if (!mesh) {
        const obj = ShapeFactory.build(
          { kind: 'cylinder', params: { radius: c.radius, height: c.height } },
          { color: c.color }
        );
        mesh = obj as THREE.Mesh;
        mesh.userData = {
          id: c.id,
          kind: 'cylinder',
          height: c.height,
          originalScale: { radius: c.radius, height: c.height }
        };
        group.add(mesh);
        meshMap.set(c.id, mesh);
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.set(c.color);
      const isSelected = c.id === selectedId;
      mat.emissive.set(isSelected ? '#ffaa00' : (c.glow ? c.color : '#000000'));
      mat.emissiveIntensity = isSelected ? 0.6 : (c.glow ? 0.4 : 0);

      if (isNew) {
        mesh.position.set(c.position.x, c.position.y, c.position.z);
      } else {
        const dx = Math.abs(mesh.position.x - c.position.x);
        const dy = Math.abs(mesh.position.y - c.position.y);
        const dz = Math.abs(mesh.position.z - c.position.z);
        if (dx > 1e-4 || dy > 1e-4 || dz > 1e-4) {
          mesh.position.set(c.position.x, c.position.y, c.position.z);
        }
      }
    }

    const next: CylinderMeshEntry[] = [];
    for (const c of cylinders) {
      const m = meshMap.get(c.id);
      if (m) next.push({ id: c.id, mesh: m });
    }
    setEntries(next);
  };

  const findById = (id: string) => entries().find(e => e.id === id);
  const findMeshById = (id: string) => meshMap.get(id);

  const raycast = (raycaster: THREE.Raycaster): string | undefined => {
    const meshes = Array.from(meshMap.values());
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      return hits[0].object.userData?.id as string | undefined;
    }
    return undefined;
  };

  const dispose = () => {
    for (const [, mesh] of meshMap) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    meshMap.clear();
    setEntries([]);
    group.clear();
  };

  return { group, entries, update, dispose, raycast, findById, findMeshById };
}
