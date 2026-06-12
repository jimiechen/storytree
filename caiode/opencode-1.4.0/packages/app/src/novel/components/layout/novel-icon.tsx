import type { Component } from 'solid-js';

interface NovelIconProps {
  name: string;
  class?: string;
  size?: number;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  fill?: boolean;
}

/**
 * Material Symbols Outlined 图标封装
 *
 * 用法: <NovelIcon name="home" size={20} weight={400} />
 *
 * 必须在 index.html 中加载:
 * <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
 */
export const NovelIcon: Component<NovelIconProps> = (props) => {
  const cls = () => {
    const base = 'material-symbols-outlined select-none leading-none';
    const custom = props.class ?? '';
    return `${base} ${custom}`.trim();
  };

  const style = () => {
    const s: Record<string, string> = {};
    if (props.size) {
      s['font-size'] = `${props.size}px`;
    }
    if (props.weight) {
      s['font-variation-settings'] = `'wght' ${props.weight}`;
    }
    if (props.fill) {
      const existing = s['font-variation-settings'] ?? '';
      s['font-variation-settings'] = existing ? `${existing}, 'FILL' 1` : `'FILL' 1`;
    }
    return s;
  };

  return <span class={cls()} style={style()}>{props.name}</span>;
};
