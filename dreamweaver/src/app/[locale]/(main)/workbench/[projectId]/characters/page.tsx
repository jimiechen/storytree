'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useKnowledgeStore } from '@/stores/knowledge-store';
import { CharacterForm } from '@/components/knowledge/CharacterForm';
import { Character } from '@/types/knowledge';
import { useTranslations } from 'next-intl';

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const t = useTranslations('KnowledgeBase');

  const tabs = [
    { id: 'characters', name: t('characters'), active: true },
    { id: 'locations', name: t('locations'), active: false },
    { id: 'items', name: t('items'), active: false },
    { id: 'lore', name: t('lore'), active: false },
    { id: 'concepts', name: t('concepts'), active: false },
  ];

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
        // 使用 mock API
        const response = await api.get<{ characters: Character[] }>(`/api/projects/${projectId}/characters`);
        const chars = response?.characters || [];
        setStoreCharacters(chars);
        if (chars.length > 0) {
          setSelectedCharacter(chars[0]);
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
      const response = await api.post<any>(`/api/projects/${projectId}/characters`, data);
      const newChar = response?.data || response;
      if (newChar) {
        addStoreCharacter(newChar);
        setIsFormOpen(false);
      }
    } catch (err) {
      console.error('Failed to create character:', err);
      setError('创建角色失败');
    }
  };

  // 更新角色
  const handleUpdateCharacter = async (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCharacter) return;

    try {
      const response = await api.put<any>(`/api/projects/${projectId}/characters/${editingCharacter.id}`, data);
      const updatedCharacter = response?.data || response;
      if (updatedCharacter) {
        updateStoreCharacter(editingCharacter.id, updatedCharacter);
        if (selectedCharacter?.id === editingCharacter.id) {
          setSelectedCharacter(updatedCharacter);
        }
        setIsFormOpen(false);
      }
    } catch (err) {
      console.error('Failed to update character:', err);
      setError('更新角色失败');
    }
  };

  // 删除角色
  const handleDeleteCharacter = async (id: string) => {
    try {
      await api.delete(`/api/projects/${projectId}/characters/${id}`);
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
      protagonist: t('roles.protagonist'),
      antagonist: t('roles.antagonist'),
      supporting: t('roles.supporting'),
      minor: t('roles.other'),
      other: t('roles.other'),
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
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container border-none rounded-full pl-10 pr-4 py-1.5 text-sm w-64 focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Notifications">
              <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
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
            <h1 className="font-serif text-3xl font-bold tracking-tight">{t('title')}</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={openCreateForm}
                className="px-5 py-2 rounded-full border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2"
                data-testid="create-character-button"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                {t('manualAdd')}
              </button>
              <button className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-on-primary-container text-on-primary text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                {t('aiExtract')}
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
                    {index === 2 ? t('conflict') : t('noConflict')}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold mb-1 text-on-surface" data-testid="character-name">{character.name}</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  {getRoleTypeLabel(character.roleType || '')}
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t('age')}</span>
                    <span className="text-on-surface">{character.profile?.age || t('unknown')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t('wordCount')}</span>
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
                      <p className="text-on-surface">{getRoleTypeLabel(selectedCharacter.roleType || '')}</p>
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
