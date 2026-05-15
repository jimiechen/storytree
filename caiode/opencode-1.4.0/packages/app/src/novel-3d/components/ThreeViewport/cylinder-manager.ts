import * as THREE from 'three';
import type { CylinderObject } from '../../types';

const CYLINDER_SEGMENTS = 32;

export interface CylinderMeshEntry {
  mesh: THREE.Mesh;
  id: string;
  originalColor: THREE.Color;
}

export interface CylinderManager {
  group: THREE.Group;
  entries: CylinderMeshEntry[];
  update: (cylinders: CylinderObject[], selectedId?: string) => void;
  dispose: () => void;
  raycast: (raycaster: THREE.Raycaster) => string | undefined;
}

function createCylinderMesh(c: CylinderObject): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(c.radius, c.radius, c.height, CYLINDER_SEGMENTS);
  const material = new THREE.MeshStandardMaterial({
    color: c.color,
    roughness: 0.5,
    metalness: 0.1,
    emissive: c.glow ? c.color : '#000000',
    emissiveIntensity: c.glow ? 0.4 : 0
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(c.position.x, c.position.y + c.height / 2, c.position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { cylinderId: c.id };
  return mesh;
}

export function createCylinderManager(): CylinderManager {
  const group = new THREE.Group();
  let entries: CylinderMeshEntry[] = [];

  const update = (cylinders: CylinderObject[], selectedId?: string) => {
    const toKeep = new Set(cylinders.map(c => c.id));

    for (const entry of entries) {
      if (!toKeep.has(entry.id)) {
        group.remove(entry.mesh);
        entry.mesh.geometry.dispose();
        (entry.mesh.material as THREE.Material).dispose();
      }
    }

    entries = entries.filter(e => toKeep.has(e.id));
    const existingMap = new Map(entries.map(e => [e.id, e]));

    const newEntries: CylinderMeshEntry[] = [];
    for (const c of cylinders) {
      const existing = existingMap.get(c.id);
      if (existing) {
        existing.mesh.position.set(c.position.x, c.position.y + c.height / 2, c.position.z);
        const mat = existing.mesh.material as THREE.MeshStandardMaterial;
        mat.color.set(c.color);
        mat.emissive.set(c.glow ? c.color : '#000000');
        mat.emissiveIntensity = c.glow ? 0.4 : 0;

        if (c.id === selectedId) {
          mat.emissive.set('#ffaa00');
          mat.emissiveIntensity = 0.6;
        }
        newEntries.push(existing);
      } else {
        const mesh = createCylinderMesh(c);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const originalColor = mat.color.clone();
        if (c.id === selectedId) {
          mat.emissive.set('#ffaa00');
          mat.emissiveIntensity = 0.6;
        }
        group.add(mesh);
        newEntries.push({ mesh, id: c.id, originalColor });
      }
    }

    entries = newEntries;
  };

  const dispose = () => {
    for (const entry of entries) {
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
    }
    entries = [];
    group.clear();
  };

  const raycast = (raycaster: THREE.Raycaster): string | undefined => {
    const meshes = entries.map(e => e.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const first = hits[0].object;
      return first.userData.cylinderId as string | undefined;
    }
    return undefined;
  };

  return { group, entries, update, dispose, raycast };
}
