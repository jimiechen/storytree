import { For, createSignal } from 'solid-js';
import type { Character } from '../../types';

interface CharacterPanelProps {
  characters: Character[];
}

export function CharacterPanel(props: CharacterPanelProps) {
  const [selectedId, setSelectedId] = createSignal(props.characters[0]?.id);

  const selectedCharacter = () => props.characters.find(c => c.id === selectedId());

  return (
    <div class="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-sm font-semibold text-gray-700">参考与属性</h2>
      </div>

      {/* 角色切换 Tab */}
      <div class="flex border-b border-gray-200">
        <For each={props.characters}>
          {(char) => (
            <button
              class={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                selectedId() === char.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedId(char.id)}
            >
              {char.name}
            </button>
          )}
        </For>
      </div>

      {/* 角色详情 */}
      <div class="flex-1 overflow-y-auto p-4">
        {selectedCharacter() && (
          <div class="space-y-4">
            {/* 头像与身份 */}
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                {selectedCharacter()!.name[0]}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{selectedCharacter()!.name}</h3>
                <p class="text-sm text-gray-500">{selectedCharacter()!.role}</p>
              </div>
            </div>

            {/* 性格标签 */}
            <div>
              <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">性格标签</h4>
              <div class="flex flex-wrap gap-2">
                <For each={selectedCharacter()!.personalityTags}>
                  {(tag) => (
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {tag}
                    </span>
                  )}
                </For>
              </div>
            </div>

            {/* 说话风格 */}
            <div>
              <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">说话风格</h4>
              <p class="text-sm text-gray-700 italic">"{selectedCharacter()!.speakingStyle}"</p>
            </div>

            {/* 核心目标 */}
            <div>
              <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">核心目标</h4>
              <p class="text-sm text-gray-800">{selectedCharacter()!.goal}</p>
            </div>

            {/* 隐藏秘密 */}
            <div>
              <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">隐藏秘密</h4>
              <p class="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                👁 {selectedCharacter()!.secret}
              </p>
            </div>

            {/* 人际关系 */}
            <div>
              <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">人际关系</h4>
              <div class="space-y-2">
                <For each={selectedCharacter()!.relationships}>
                  {(rel) => (
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-gray-400">
                        {rel.type === 'mentor' ? '↗' : rel.type === 'antagonist' ? '↘' : '↔'}
                      </span>
                      <span class="text-gray-700">{rel.characterName}</span>
                      <span class="text-gray-400">({rel.description})</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
