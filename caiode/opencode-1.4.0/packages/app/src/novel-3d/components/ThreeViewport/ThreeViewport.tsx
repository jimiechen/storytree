import { createEffect, onCleanup, on, onMount } from 'solid-js';
import type { Shot3DStore } from '../../shot-3d-store';
import { createScene, updateCameraFromStore, updateCameraTarget } from './scene-setup';
import { createControls, syncControlsTarget } from './controls-setup';
import { startRenderLoop } from './render-loop';
import { createCylinderManager } from './cylinder-manager';
import { createBoxManager } from './box-manager';
import { createLightManager } from './light-manager';
import { createThemeController } from './theme-controller';
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

    const cylManager = createCylinderManager();
    ctx.scene.add(cylManager.group);

    const boxManager = createBoxManager();
    ctx.scene.add(boxManager.group);

    const lightManager = createLightManager();
    ctx.scene.add(lightManager.group);

    const gridHelper = ctx.grid;

    const themeCtrl = createThemeController(ctx.scene, gridHelper, ctx.ambientLight, ctx.hemisphereLight);

    const transformCtx = createTransformControls(ctx.camera, ctx.renderer, props.store, controls.orbit);

    ctx.scene.add(transformCtx.transform.getHelper() as THREE.Object3D);
    (transformCtx.transform.getHelper() as THREE.Object3D).visible = false;

    themeCtrl.apply(props.store.scene().theme);

    const loop = startRenderLoop(ctx.renderer, ctx.scene, ctx.camera, controls.orbit, transformCtx.transform);

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

      const cylHit = cylManager.raycast(raycaster);
      if (cylHit) return props.store.selectAny(cylHit);

      const boxHit = boxManager.raycast(raycaster);
      if (boxHit) return props.store.selectAny(boxHit);

      const lightHit = lightManager.raycast(raycaster);
      if (lightHit) return props.store.selectAny(lightHit);

      props.store.selectAny(undefined);
    };

    ctx.renderer.domElement.addEventListener('click', handleClick);

    createEffect(() => {
      const mode = props.store.transformMode();
      transformCtx.setMode(mode);
    });

    createEffect(() => {
      const cam = props.store.scene().camera;
      updateCameraFromStore(ctx.camera, cam);
      updateCameraTarget(ctx.camera, cam.target);
      syncControlsTarget(controls.orbit, cam.target);
    });

    // Effect 1: 同步三类对象 mesh 数据（不依赖 theme）
    createEffect(on(
      () => [
        props.store.scene().cylinders,
        props.store.scene().boxes,
        props.store.scene().lights,
        props.store.scene().selectedObjectId,
      ] as const,
      ([cylinders, boxes, lights, selectedId]) => {
        cylManager.update(cylinders, selectedId);
        boxManager.update(boxes, selectedId);
        lightManager.update(lights, selectedId);
      }
    ));

    // Effect 2: TransformControls 绑定
    createEffect(on(
      () => [cylManager.entries(), boxManager.entries(), lightManager.entries(), props.store.scene().selectedObjectId] as const,
      ([cylEntries, boxEntries, lightEntries, selectedId]) => {
        if (!selectedId) {
          transformCtx.attach(null);
          return;
        }

        if (selectedId.startsWith('light-')) {
          const entry = lightEntries.find(e => e.id === selectedId);
          if (entry) {
            transformCtx.attach(entry.visual);
            return;
          }
          const fallback = lightManager.findVisualById(selectedId);
          if (fallback) {
            transformCtx.attach(fallback);
            return;
          }
          transformCtx.attach(null);
          return;
        }

        if (selectedId.startsWith('box-')) {
          const entry = boxEntries.find(e => e.id === selectedId);
          if (entry) {
            transformCtx.attach(entry.mesh);
            return;
          }
          const fallback = boxManager.findMeshById(selectedId);
          if (fallback) {
            transformCtx.attach(fallback);
            return;
          }
          transformCtx.attach(null);
          return;
        }

        const entry = cylEntries.find(e => e.id === selectedId);
        if (entry) {
          transformCtx.attach(entry.mesh);
          return;
        }

        const fallback = cylManager.findMeshById(selectedId);
        if (fallback) {
          transformCtx.attach(fallback);
        } else {
          transformCtx.attach(null);
        }
      }
    ));

    // Effect 3: Theme 同步（独立链路）
    createEffect(on(
      () => props.store.scene().theme,
      (theme) => {
        themeCtrl.apply(theme);
        lightManager.applyTheme(theme);
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
      boxManager.dispose();
      lightManager.dispose();
      themeCtrl.dispose();
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
