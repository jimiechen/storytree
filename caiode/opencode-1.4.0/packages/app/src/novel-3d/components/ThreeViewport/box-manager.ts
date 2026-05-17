import * as THREE from 'three';
import { createSignal, type Accessor } from 'solid-js';
import type { BoxObject } from '../../types';
import { ShapeFactory } from '../../shape-factory';

export interface BoxMeshEntry {
  id: string;
  mesh: THREE.Mesh;
}

export interface BoxManager {
  group: THREE.Group;
  entries: Accessor<BoxMeshEntry[]>;
  update: (boxes: BoxObject[], selectedId?: string) => void;
  dispose: () => void;
  raycast: (raycaster: THREE.Raycaster) => string | undefined;
  findById: (id: string) => BoxMeshEntry | undefined;
  findMeshById: (id: string) => THREE.Mesh | undefined;
}

export function createBoxManager(): BoxManager {
  const group = new THREE.Group();
  group.name = 'BoxGroup';

  const [entries, setEntries] = createSignal<BoxMeshEntry[]>([]);
  const meshMap = new Map<string, THREE.Mesh>();

  const update = (boxes: BoxObject[], selectedId?: string): void => {
    const incomingIds = new Set(boxes.map(b => b.id));

    for (const [id, mesh] of meshMap) {
      if (!incomingIds.has(id)) {
        group.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        meshMap.delete(id);
      }
    }

    for (const b of boxes) {
      let mesh = meshMap.get(b.id);
      const isNew = !mesh;

      if (!mesh) {
        const obj = ShapeFactory.build(
          { kind: 'box', params: { width: b.width, height: b.height, depth: b.depth } },
          { color: b.color }
        );
        mesh = obj as THREE.Mesh;
        mesh.userData = {
          id: b.id,
          kind: 'box',
          height: b.height,
          originalScale: { radius: b.width / 2, height: b.height }
        };
        group.add(mesh);
        meshMap.set(b.id, mesh);
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.set(b.color);
      const isSelected = b.id === selectedId;
      mat.emissive.set(isSelected ? '#ffaa00' : (b.glow ? b.color : '#000000'));
      mat.emissiveIntensity = isSelected ? 0.6 : (b.glow ? 0.4 : 0);

      if (isNew) {
        mesh.position.set(b.position.x, b.position.y, b.position.z);
      } else {
        const dx = Math.abs(mesh.position.x - b.position.x);
        const dy = Math.abs(mesh.position.y - b.position.y);
        const dz = Math.abs(mesh.position.z - b.position.z);
        if (dx > 1e-4 || dy > 1e-4 || dz > 1e-4) {
          mesh.position.set(b.position.x, b.position.y, b.position.z);
        }
      }
    }

    const next: BoxMeshEntry[] = [];
    for (const b of boxes) {
      const m = meshMap.get(b.id);
      if (m) next.push({ id: b.id, mesh: m });
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
