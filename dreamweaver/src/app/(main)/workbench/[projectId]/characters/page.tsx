'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useKnowledgeStore } from '@/stores/knowledge-store';
import { CharacterForm } from '@/components/knowledge/CharacterForm';
import type { Character } from '@/types/knowledge';

const tabs = [
  { id: 'characters', name: '角色', active: true },
  { id: 'locations', name: '地点', active: false },
  { id: 'items', name: '物品', active: false },
  { id: 'lore', name: '传说', active: false },
  { id: 'concepts', name: '概念', active: false },
];

// Mock data for demo
const mockCharacters: Character[] = [
  {
    id: '1',
    projectId: 'demo',
    name: '李云',
    aliases: ['云儿'],
    roleType: 'protagonist',
    profile: {
      age: 19,
      gender: 'male',
      appearance: '剑眉星目，白衣胜雪',
    },
    tags: ['主角', '青云宗', '高冷'],
    wordCount: 15000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    projectId: 'demo',
    name: '苏婉儿',
    aliases: ['婉儿'],
    roleType: 'supporting',
    profile: {
      age: 17,
      gender: 'female',
      appearance: '明眸皓齿，绿衣飘飘',
    },
    tags: ['重要配角', '灵药谷', '温柔'],
    wordCount: 8900,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    projectId: 'demo',
    name: '莫离',
    aliases: ['暗影'],
    roleType: 'antagonist',
    profile: {
      age: 25,
      gender: 'male',
      appearance: '黑衣蒙面，眼神阴冷',
    },
    tags: ['反派', '暗影殿'],
    wordCount: 2400,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const {
    characters,
    setCharacters: setStoreCharacters,
    addCharacter: addStoreCharacter,
    updateCharacter: updateStoreCharacter,
    deleteCharacter: deleteStoreCharacter,
  } = useKnowledgeStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // 获取角色列表
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        // 使用 mock 数据
        setStoreCharacters(mockCharacters);
        if (mockCharacters.length > 0) {
          setSelectedCharacter(mockCharacters[0]);
        }
      } catch (err) {
        setError('获取角色列表失败');
        console.error('Failed to fetch characters:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchCharacters();
    }
  }, [projectId, setStoreCharacters]);

  // 过滤角色
  const filteredCharacters = characters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.aliases?.some((alias) => alias.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 创建角色
  const handleCreateCharacter = async (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCharacter: Character = {
        ...data,
        id: Date.now().toString(),
        projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addStoreCharacter(newCharacter);
    } catch (err) {
      console.error('Failed to create character:', err);
      setError('创建角色失败');
    }
  };

  // 更新角色
  const handleUpdateCharacter = async (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCharacter) return;

    try {
      const updatedCharacter: Character = {
        ...data,
        id: editingCharacter.id,
        projectId,
        createdAt: editingCharacter.createdAt,
        updatedAt: new Date().toISOString(),
      };
      updateStoreCharacter(editingCharacter.id, updatedCharacter);
      if (selectedCharacter?.id === editingCharacter.id) {
        setSelectedCharacter(updatedCharacter);
      }
    } catch (err) {
      console.error('Failed to update character:', err);
      setError('更新角色失败');
    }
  };

  // 删除角色
  const handleDeleteCharacter = async (id: string) => {
    try {
      deleteStoreCharacter(id);
      if (selectedCharacter?.id === id) {
        setSelectedCharacter(characters.find((c) => c.id !== id) || null);
      }
    } catch (err) {
      console.error('Failed to delete character:', err);
      setError('删除角色失败');
    }
  };

  // 打开创建表单
  const openCreateForm = () => {
    setEditingCharacter(null);
    setIsFormOpen(true);
  };

  // 打开编辑表单
  const openEditForm = (character: Character) => {
    setEditingCharacter(character);
    setIsFormOpen(true);
  };

  // 关闭表单
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCharacter(null);
  };

  // 处理表单提交
  const handleFormSubmit = (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCharacter) {
      handleUpdateCharacter(data);
    } else {
      handleCreateCharacter(data);
    }
  };

  // 获取姓氏首字
  const getFirstChar = (name: string) => name.charAt(0);

  // 获取角色类型标签
  const getRoleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      protagonist: '主角',
      antagonist: '反派',
      supporting: '配角',
      minor: '龙套',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="characters-loading">
        <div className="text-lg text-on-surface-variant">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="characters-error">
        <div className="text-lg text-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest" data-testid="characters-page">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-8 w-full h-16 bg-surface-container-lowest/80 backdrop-blur-xl sticky top-0 z-30 border-b border-outline-variant/10">
        <nav className="flex items-center gap-8">
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href="#"
              className={`font-serif text-lg pb-1 transition-colors ${
                tab.active
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface/60 hover:text-on-surface'
              }`}
            >
              {tab.name}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="搜索角色..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container border-none rounded-full pl-10 pr-4 py-1.5 text-sm w-64 focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
              <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-xs font-bold">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Character Grid */}
        <section className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-serif text-3xl font-bold tracking-tight">知识库：角色</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={openCreateForm}
                className="px-5 py-2 rounded-full border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                手动添加
              </button>
              <button className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-on-primary-container text-on-primary text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                AI 自动提取
              </button>
            </div>
          </div>

          {/* 3-Column Character Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {filteredCharacters.map((character, index) => (
              <div
                key={character.id}
                onClick={() => setSelectedCharacter(character)}
                className={`bg-surface-container border border-outline-variant/10 rounded-xl p-6 hover:bg-surface-container-high transition-all group cursor-pointer ${
                  selectedCharacter?.id === character.id ? 'border-l-4 border-l-primary/30' : ''
                }`}
                data-testid="character-card"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-on-tertiary-container/20 rounded-lg flex items-center justify-center text-on-tertiary-container font-serif text-xl font-bold">
                    {getFirstChar(character.name)}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      index === 2
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-tertiary-container text-on-tertiary-fixed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {index === 2 ? 'warning' : 'check_circle'}
                    </span>
                    {index === 2 ? '设定冲突' : '无矛盾'}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold mb-1 text-on-surface">{character.name}</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  {getRoleTypeLabel(character.roleType)}
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">年龄</span>
                    <span className="text-on-surface">{character.profile?.age || '未知'}岁</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">出场字数</span>
                    <span className="text-on-surface">
                      {character.wordCount ? `${(character.wordCount / 1000).toFixed(1)}k` : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {character.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State Placeholders */}
          {filteredCharacters.length < 6 && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6 opacity-60">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface-container border border-outline-variant/5 rounded-xl p-6">
                  <div className="h-12 w-12 bg-surface-container-highest rounded-lg mb-4"></div>
                  <div className="h-6 w-24 bg-surface-container-highest rounded mb-2"></div>
                  <div className="h-4 w-40 bg-surface-container-highest rounded mb-8"></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Details Panel */}
        <aside className="w-[400px] bg-surface-container-low border-l border-outline-variant/10 p-8 overflow-y-auto">
          {selectedCharacter ? (
            <>
              <div className="mb-10 text-center">
                <div className="w-24 h-24 bg-on-tertiary-container/10 rounded-full mx-auto flex items-center justify-center mb-4 ring-2 ring-tertiary/20">
                  <span className="font-serif text-4xl font-bold text-on-tertiary-container">
                    {getFirstChar(selectedCharacter.name)}
                  </span>
                </div>
                <h2 className="font-serif text-3xl font-bold mb-1">{selectedCharacter.name}</h2>
                <p className="text-on-surface-variant text-sm">
                  {selectedCharacter.aliases?.[0] || selectedCharacter.name}
                </p>
              </div>

              <div className="space-y-8">
                {/* 基本信息 */}
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <span className="w-1 h-3 bg-primary rounded-full"></span>
                    基本信息
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <p className="text-on-surface-variant text-[11px] mb-1">角色类型</p>
                      <p className="text-on-surface">{getRoleTypeLabel(selectedCharacter.roleType)}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-[11px] mb-1">年龄</p>
                      <p className="text-on-surface">{selectedCharacter.profile?.age || '未知'}岁</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-[11px] mb-1">性别</p>
                      <p className="text-on-surface">
                        {selectedCharacter.profile?.gender === 'male'
                          ? '男'
                          : selectedCharacter.profile?.gender === 'female'
                          ? '女'
                          : '未知'}
                      </p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-[11px] mb-1">出场字数</p>
                      <p className="text-on-surface">
                        {selectedCharacter.wordCount
                          ? `${(selectedCharacter.wordCount / 1000).toFixed(1)}k`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 外貌描述 */}
                {selectedCharacter.profile?.appearance && (
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                      <span className="w-1 h-3 bg-primary rounded-full"></span>
                      外貌描述
                    </h4>
                    <p className="text-sm text-on-surface">{selectedCharacter.profile.appearance}</p>
                  </section>
                )}

                {/* 标签 */}
                {selectedCharacter.tags && selectedCharacter.tags.length > 0 && (
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                      <span className="w-1 h-3 bg-primary rounded-full"></span>
                      标签
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-surface-container-highest border border-outline-variant/20 rounded-full text-xs text-on-surface"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* 编辑按钮 */}
                <section>
                  <button
                    onClick={() => openEditForm(selectedCharacter)}
                    className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    编辑角色
                  </button>
                </section>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-4">person_off</span>
              <p>选择一个角色查看详情</p>
            </div>
          )}
        </aside>
      </main>

      {/* Character Form Modal */}
      <CharacterForm
        character={editingCharacter}
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        onDelete={editingCharacter ? () => handleDeleteCharacter(editingCharacter.id) : undefined}
      />
    </div>
  );
}
