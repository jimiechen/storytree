import { onMount, onCleanup, createEffect } from 'solid-js';
import type { Shot3DStore } from '../../shot-3d-store';
import { createScene, updateCameraFromStore, updateCameraTarget } from './scene-setup';
import { createControls, syncControlsTarget } from './controls-setup';
import { startRenderLoop } from './render-loop';
import { createCylinderManager } from './cylinder-manager';
import { createTransformControls } from './transform-controls-setup';
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
    const loop = startRenderLoop(ctx.renderer, ctx.scene, ctx.camera, controls.orbit);

    const cylManager = createCylinderManager();
    ctx.scene.add(cylManager.group);

    const transformCtx = createTransformControls(ctx.camera, ctx.renderer, props.store);
    ctx.scene.add(transformCtx.transform as unknown as THREE.Object3D);

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
      props.store.selectCylinder(hitId);
    };

    ctx.renderer.domElement.addEventListener('click', handleClick);

    createEffect(() => {
      const cam = props.store.scene().camera;
      updateCameraFromStore(ctx.camera, cam);
      updateCameraTarget(ctx.camera, cam.target);
      syncControlsTarget(controls.orbit, cam.target);
    });

    createEffect(() => {
      const s = props.store.scene();
      cylManager.update(s.cylinders, s.selectedObjectId);

      if (s.selectedObjectId) {
        const entry = cylManager.entries.find(e => e.id === s.selectedObjectId);
        if (entry) {
          transformCtx.attach(entry.mesh);
        } else {
          transformCtx.attach(null);
        }
      } else {
        transformCtx.attach(null);
      }
    });

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      ctx.renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      ctx.renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      ctx.renderer.domElement.removeEventListener('click', handleClick);
      loop.stop();
      controls.dispose();
      cylManager.dispose();
      transformCtx.dispose();
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
