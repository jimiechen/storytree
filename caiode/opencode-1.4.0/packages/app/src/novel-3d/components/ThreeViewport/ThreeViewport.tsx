import { createEffect, onCleanup, on, onMount } from 'solid-js';
import type { Shot3DStore } from '../../shot-3d-store';
import { createScene, updateCameraFromStore, updateCameraTarget } from './scene-setup';
import { createControls, syncControlsTarget } from './controls-setup';
import { startRenderLoop } from './render-loop';
import { createCylinderManager } from './cylinder-manager';
import { createTransformControls } from './transform-controls-setup';
import { createGroupTransform } from './group-transform';
import { exportPNG, copyToClipboard } from '../../export-utils';
import * as THREE from 'three';

interface ThreeViewportProps {
  store: Shot3DStore;
}

export default function ThreeViewport(props: ThreeViewportProps) {
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!containerRef) return;

    const ctx = createScene(containerRef);
    const controls = createControls(ctx.camera, ctx.renderer, props.store);

    const cylManager = createCylinderManager();
    ctx.scene.add(cylManager.group);
    ctx.scene.add(cylManager.boxGroup);

    const transformCtx = createTransformControls(ctx.camera, ctx.renderer, props.store, controls.orbit);
    const groupCtx = createGroupTransform(ctx.camera, ctx.renderer, props.store, controls.orbit);

    ctx.scene.add(groupCtx.group);
    groupCtx.group.visible = false;

    ctx.scene.add(transformCtx.transform.getHelper() as THREE.Object3D);
    (transformCtx.transform.getHelper() as THREE.Object3D).visible = false;

    const loop = startRenderLoop(ctx.renderer, ctx.scene, ctx.camera, controls.orbit, transformCtx.transform, groupCtx.transform);

    containerRef.appendChild(ctx.renderer.domElement);

    props.store.registerExportPNG(() => exportPNG(ctx.renderer, 'shot.png'));
    props.store.registerCopyPrompt(() => {
      const prompt = props.store.scene().prompt;
      copyToClipboard(prompt).then(ok => {
        if (ok) console.info('[Shot3D] Prompt copied');
        else console.warn('[Shot3D] Copy failed');
      });
    });

    const handleResize = () => {
      if (!containerRef) return;
      const w = containerRef.clientWidth;
      const h = containerRef.clientHeight;
      ctx.camera.aspect = w / h;
      ctx.camera.updateProjectionMatrix();
      ctx.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[ThreeViewport] WebGL context lost');
    };
    const handleContextRestored = () => {
      console.info('[ThreeViewport] WebGL context restored');
    };

    ctx.renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    ctx.renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      if (!containerRef) return;
      const rect = containerRef.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, ctx.camera);
      const hitId = cylManager.raycast(raycaster);
      console.info('[ThreeViewport] Cylinder clicked:', hitId);
      props.store.selectCylinder(hitId);
    };

    ctx.renderer.domElement.addEventListener('click', handleClick);

    createEffect(() => {
      const mode = props.store.transformMode();
      transformCtx.setMode(mode);
      groupCtx.setMode(mode);
    });

    createEffect(() => {
      const cam = props.store.scene().camera;
      updateCameraFromStore(ctx.camera, cam);
      updateCameraTarget(ctx.camera, cam.target);
      syncControlsTarget(controls.orbit, cam.target);
    });

    // Effect 1: 同步 cylinder mesh 数据（依赖 cylinders 数组）
    createEffect(on(
      () => props.store.scene().cylinders,
      (cylinders) => {
        const selectedId = props.store.scene().selectedObjectId;
        cylManager.update(cylinders, selectedId);
      }
    ));

    // Effect 2: TransformControls 绑定（显式依赖 entries Signal + selectedId）
    createEffect(on(
      () => [cylManager.entries(), props.store.scene().selectedObjectId] as const,
      ([list, selectedId]) => {
        if (!selectedId) {
          transformCtx.attach(null);
          return;
        }

        const isBox = selectedId.startsWith('box-');

        if (isBox) {
          transformCtx.attach(cylManager.boxGroup);
          return;
        }

        const entry = list.find(e => e.id === selectedId);
        if (entry) {
          transformCtx.attach(entry.mesh);
          return;
        }

        const fallback = cylManager.group.children.find(
          (o: any) => o.userData?.id === selectedId
        ) as THREE.Mesh | undefined;

        if (fallback) {
          transformCtx.attach(fallback);
        } else {
          transformCtx.attach(null);
        }
      }
    ));

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      ctx.renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      ctx.renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      ctx.renderer.domElement.removeEventListener('click', handleClick);
      loop.stop();
      controls.dispose();
      cylManager.dispose();
      transformCtx.dispose();
      groupCtx.dispose();
      ctx.renderer.dispose();
      ctx.scene.clear();
      if (containerRef && ctx.renderer.domElement.parentNode === containerRef) {
        containerRef.removeChild(ctx.renderer.domElement);
      }
    });
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#1e1f22'
      }}
    />
  );
}
