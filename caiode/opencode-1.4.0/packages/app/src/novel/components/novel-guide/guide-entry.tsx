import type { Component } from 'solid-js';
import { NovelButton } from '../ui/novel-button';
import { NovelEmptyState } from '../ui/novel-empty-state';

interface Props {
  onCreate: () => void;
}

export const GuideEntry: Component<Props> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center h-full px-6">
      <NovelEmptyState
        icon="psychology"
        title="开始你的创作之旅"
        description="通过25道引导题，AI将为你生成专属小说框架"
        action={{ label: '新建引导项目', onClick: props.onCreate }}
      />
    </div>
  );
};
