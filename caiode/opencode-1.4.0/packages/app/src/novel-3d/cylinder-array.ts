import type { CylinderObject, PromptParseResult } from './types';

/**
 * 圆柱体方阵生成器
 */

export function generateCylinderArray(config: PromptParseResult): CylinderObject[] {
  const cylinders: CylinderObject[] = [];
  const { rows, cols, spacingX, spacingZ, baseRadius, baseHeight, centerHeroCylinder } = config;

  // 计算起始位置，使方阵居中
  const startX = -((cols - 1) * spacingX) / 2;
  const startZ = -((rows - 1) * spacingZ) / 2;

  // 中心位置
  const centerRow = Math.floor((rows - 1) / 2);
  const centerCol = Math.floor((cols - 1) / 2);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isCenter = row === centerRow && col === centerCol;
      const isHero = centerHeroCylinder && isCenter;

      const x = startX + col * spacingX;
      const z = startZ + row * spacingZ;
      const height = isHero ? baseHeight * 2 : baseHeight;
      const radius = isHero ? baseRadius * 1.2 : baseRadius;

      cylinders.push({
        id: `cylinder-${row}-${col}`,
        label: isHero ? 'Hero Cylinder' : `Cylinder ${row}-${col}`,
        position: { x, y: height / 2, z },
        radius,
        height,
        color: isHero ? '#ff9f1c' : '#5a6b7c',
        glow: isHero,
        selected: false,
        importance: isHero ? 'hero' : 'secondary'
      });
    }
  }

  return cylinders;
}
