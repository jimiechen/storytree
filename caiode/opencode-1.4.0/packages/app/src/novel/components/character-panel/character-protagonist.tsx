import type { Component } from 'solid-js';
import { NovelAvatar } from '../ui/novel-avatar';
import { NovelTag } from '../ui/novel-tag';
import type { Character } from '../../types/character';

interface Props {
  character: Character;
}

export const CharacterProtagonist: Component<Props> = (props) => {
  return (
    <div class="bg-white rounded-xl border border-[#cbc3d7] p-6 flex gap-6">
      <div class="w-24 shrink-0 text-center">
        <NovelAvatar name={props.character.name} size="xl" />
        <h3 class="text-lg font-bold text-[#0d1c2f] mt-2">{props.character.name}</h3>
        <NovelTag class="mt-1">主角</NovelTag>
      </div>
      <div class="flex-1 flex flex-col">
        <p class="text-base text-[#494454] mb-4">{props.character.goal}。{props.character.secret}。</p>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <div class="text-2xl font-bold text-[#6b38d4]">12</div>
            <div class="text-xs text-[#494454]">出场章节</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-[#6b38d4]">8.5k</div>
            <div class="text-xs text-[#494454]">对话字数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-[#6b38d4]">S级</div>
            <div class="text-xs text-[#494454]">能力等级</div>
          </div>
        </div>
      </div>
    </div>
  );
};
