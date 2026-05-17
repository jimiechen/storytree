import * as THREE from 'three';
import { createSignal, type Accessor } from 'solid-js';
import type { LightObject } from '../../types';
import { ShapeFactory } from '../../shape-factory';

export interface LightMeshEntry {
  id: string;
  visual: THREE.Group;
}

export interface LightManager {
  group: THREE.Group;
  entries: Accessor<LightMeshEntry[]>;
  update: (lights: LightObject[], selectedId?: string) => void;
  applyTheme: (theme: 'light' | 'dark') => void;
  dispose: () => void;
  raycast: (raycaster: THREE.Raycaster) => string | undefined;
  findById: (id: string) => LightMeshEntry | undefined;
  findVisualById: (id: string) => THREE.Group | undefined;
}

export function createLightManager(): LightManager {
  const group = new THREE.Group();
  group.name = 'LightGroup';

  const [entries, setEntries] = createSignal<LightMeshEntry[]>([]);
  const visualMap = new Map<string, THREE.Group>();

  const update = (lights: LightObject[], selectedId?: string): void => {
    const incomingIds = new Set(lights.map(l => l.id));

    for (const [id, v] of visualMap) {
      if (!incomingIds.has(id)) {
        group.remove(v);
        v.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          } else if (child instanceof THREE.LineSegments) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
        visualMap.delete(id);
      }
    }

    for (const l of lights) {
      let v = visualMap.get(l.id);
      const isNew = !v;

      if (!v) {
        const obj = ShapeFactory.build(
          { kind: 'lineCone', params: { range: l.range, angleDeg: l.angleDeg } },
          { color: l.color, opacity: 0.7 }
        );
        v = obj as THREE.Group;
        v.userData = {
          id: l.id,
          kind: 'light',
          height: 0,
          originalScale: { radius: 1, height: 1 }
        };
        group.add(v);
        visualMap.set(l.id, v);
      }

      const isSelected = l.id === selectedId;
      v.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          const mat = child.material as THREE.LineDashedMaterial;
          mat.color.set(isSelected ? '#ffaa00' : l.color);
          mat.opacity = isSelected ? 1.0 : 0.7;
          mat.needsUpdate = true;
        }
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.color.set(isSelected ? '#ffaa00' : l.color);
        }
      });

      if (isNew) {
        v.position.set(l.position.x, l.position.y, l.position.z);
        v.rotation.set(l.rotation.x, l.rotation.y, l.rotation.z);
      } else {
        const dx = Math.abs(v.position.x - l.position.x);
        const dy = Math.abs(v.position.y - l.position.y);
        const dz = Math.abs(v.position.z - l.position.z);
        if (dx > 1e-4 || dy > 1e-4 || dz > 1e-4) {
          v.position.set(l.position.x, l.position.y, l.position.z);
        }
        const drx = Math.abs(v.rotation.x - l.rotation.x);
        const dry = Math.abs(v.rotation.y - l.rotation.y);
        const drz = Math.abs(v.rotation.z - l.rotation.z);
        if (drx > 1e-4 || dry > 1e-4 || drz > 1e-4) {
          v.rotation.set(l.rotation.x, l.rotation.y, l.rotation.z);
        }
      }
    }

    const next: LightMeshEntry[] = [];
    for (const l of lights) {
      const v = visualMap.get(l.id);
      if (v) next.push({ id: l.id, visual: v });
    }
    setEntries(next);
  };

  const applyTheme = (theme: 'light' | 'dark'): void => {
    const opacity = theme === 'light' ? 0.5 : 0.8;
    for (const [, v] of visualMap) {
      v.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          const mat = child.material as THREE.LineDashedMaterial;
          mat.opacity = opacity;
          mat.needsUpdate = true;
        }
      });
    }
  };

  const findById = (id: string) => entries().find(e => e.id === id);
  const findVisualById = (id: string) => visualMap.get(id);

  const raycast = (raycaster: THREE.Raycaster): string | undefined => {
    const visuals = Array.from(visualMap.values());
    const hits = raycaster.intersectObjects(visuals, true);
    if (hits.length > 0) {
      let cur: THREE.Object3D | null = hits[0].object;
      while (cur && !cur.userData?.id) cur = cur.parent;
      if (cur && cur.userData?.id) return cur.userData.id as string;
    }
    return undefined;
  };

  const dispose = () => {
    for (const [, v] of visualMap) {
      v.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    visualMap.clear();
    setEntries([]);
    group.clear();
  };

  return { group, entries, update, applyTheme, dispose, raycast, findById, findVisualById };
}
