import * as THREE from 'three';

export type ShapeKind = 'cylinder' | 'box' | 'lineCone' | 'sphere';

export interface ShapeSpec {
  kind: ShapeKind;
  params: Record<string, number | string>;
}

export interface MaterialSpec {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  wireframe?: boolean;
  dashed?: boolean;
}

export type SceneObjectKind = 'cylinder' | 'box' | 'light';

export interface SceneObject {
  id: string;
  kind: SceneObjectKind;
  label: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  groupId?: string;
  shape: ShapeSpec;
  material: MaterialSpec;
  selected: boolean;
  extras?: Record<string, unknown>;
}

function buildStdMaterial(mat: MaterialSpec): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: mat.color,
    roughness: 0.5,
    metalness: 0.1,
    emissive: mat.emissive ?? '#000000',
    emissiveIntensity: mat.emissiveIntensity ?? 0,
    transparent: (mat.opacity ?? 1) < 1,
    opacity: mat.opacity ?? 1,
    wireframe: mat.wireframe ?? false,
  });
}

type ShapeBuilder = (spec: ShapeSpec, mat: MaterialSpec) => THREE.Object3D;

const registry = new Map<ShapeKind, ShapeBuilder>();

export const ShapeFactory = {
  register(kind: ShapeKind, builder: ShapeBuilder) {
    registry.set(kind, builder);
  },

  build(spec: ShapeSpec, mat: MaterialSpec): THREE.Object3D {
    const b = registry.get(spec.kind);
    if (!b) throw new Error(`No shape builder for ${spec.kind}`);
    const obj = b(spec, mat);
    return obj;
  },
};

// Register cylinder builder
ShapeFactory.register('cylinder', (spec, mat) => {
  const r = (spec.params.radius as number) ?? 0.5;
  const h = (spec.params.height as number) ?? 1.5;
  const geom = new THREE.CylinderGeometry(r, r, h, 32);
  const material = buildStdMaterial(mat);
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
});

// Register box builder
ShapeFactory.register('box', (spec, mat) => {
  const w = (spec.params.width as number) ?? 1;
  const h = (spec.params.height as number) ?? 1;
  const d = (spec.params.depth as number) ?? 1;
  const geom = new THREE.BoxGeometry(w, h, d);
  const material = buildStdMaterial(mat);
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
});

// Register lineCone builder (for lights)
ShapeFactory.register('lineCone', (spec, mat) => {
  const range = (spec.params.range as number) ?? 3;
  const angleDeg = (spec.params.angleDeg as number) ?? 30;
  const radius = Math.tan((angleDeg * Math.PI) / 180) * range;
  const cone = new THREE.ConeGeometry(radius, range, 24, 1, true);
  // Intentional translate: light origin = cone tip
  cone.translate(0, -range / 2, 0);
  const edges = new THREE.EdgesGeometry(cone);
  const lineMat = new THREE.LineDashedMaterial({
    color: new THREE.Color(mat.color),
    dashSize: 0.08,
    gapSize: 0.05,
    transparent: true,
    opacity: mat.opacity ?? 0.7,
  });
  const line = new THREE.LineSegments(edges, lineMat);
  line.computeLineDistances();

  const root = new THREE.Group();
  root.add(line);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshBasicMaterial({ color: mat.color })
  );
  root.add(bulb);
  return root;
});
