/**
 * 导出 Three.js renderer 当前画面为 PNG
 */
export function exportPNG(renderer: { domElement: HTMLCanvasElement }, filename = 'shot.png'): void {
  const canvas = renderer.domElement;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
