import * as THREE from 'three';
import type { Theme } from '../../types';

export interface ThemePalette {
  background: number;
  gridMain: number;
  gridSub: number;
  ambientIntensity: number;
}

export const PALETTES: Record<Theme, ThemePalette> = {
  dark: {
    background: 0x1a1a1f,
    gridMain: 0x666666,
    gridSub: 0x333333,
    ambientIntensity: 0.35,
  },
  light: {
    background: 0xf5f5f0,
    gridMain: 0xcccccc,
    gridSub: 0xe0e0e0,
    ambientIntensity: 0.7,
  },
};

export interface ThemeController {
  apply: (theme: Theme) => void;
  dispose: () => void;
}

export function createThemeController(
  scene: THREE.Scene,
  gridHelper: THREE.GridHelper,
  ambientLight?: THREE.AmbientLight,
  hemisphereLight?: THREE.HemisphereLight
): ThemeController {
  let currentTheme: Theme = 'dark';

  const apply = (theme: Theme) => {
    if (currentTheme === theme) return;

    currentTheme = theme;
    const p = PALETTES[theme];

    scene.background = new THREE.Color(p.background);

    if (gridHelper.material instanceof Array) {
      (gridHelper.material[0] as THREE.LineBasicMaterial).color.setHex(p.gridMain);
      (gridHelper.material[1] as THREE.LineBasicMaterial).color.setHex(p.gridSub);
    } else {
      (gridHelper.material as THREE.LineBasicMaterial).color.setHex(p.gridMain);
    }

    if (ambientLight) {
      ambientLight.intensity = p.ambientIntensity;
    }

    if (hemisphereLight) {
      hemisphereLight.intensity = p.ambientIntensity * 0.8;
    }
  };

  const dispose = () => {};

  return { apply, dispose };
}
