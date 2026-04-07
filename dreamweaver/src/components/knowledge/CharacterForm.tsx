'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Character } from '@/types/knowledge';

interface CharacterFormProps {
  character?: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string) => void;
}

const initialFormData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
  projectId: '',
  name: '',
  aliases: [],
  age: undefined,
  gender: 'unknown',
  occupation: '',
  appearance: '',
  personality: '',
  backstory: '',
  goals: '',
  relationships: [],
  notes: '',
  status: 'active',
  tags: [],
};

export const CharacterForm: React.FC<CharacterFormProps> = ({
  character,
  isOpen,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [newAlias, setNewAlias] = useState('');
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当编辑角色时，填充表单数据
  useEffect(() => {
    if (character) {
      setFormData({
        projectId: character.projectId,
        name: character.name,
        aliases: character.aliases || [],
        age: character.age,
        gender: character.gender || 'unknown',
        occupation: character.occupation || '',
        appearance: character.appearance || '',
        personality: character.personality || '',
        backstory: character.backstory || '',
        goals: character.goals || '',
        relationships: character.relationships || [],
        notes: character.notes || '',
        status: character.status || 'active',
        tags: character.tags || [],
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [character, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '角色名称不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
    onClose();
  };

  const handleAddAlias = () => {
    if (newAlias.trim() && !formData.aliases?.includes(newAlias.trim())) {
      setFormData(prev => ({
        ...prev,
        aliases: [...(prev.aliases || []), newAlias.trim()],
      }));
      setNewAlias('');
    }
  };

  const handleRemoveAlias = (alias: string) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases?.filter(a => a !== alias) || [],
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  const handleDelete = () => {
    if (character && onDelete && confirm('确定要删除这个角色吗？此操作不可撤销。')) {
      onDelete(character.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="character-form-modal">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {character ? '编辑角色' : '新建角色'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="close-form-button"
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* 基本信息 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">基本信息</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label htmlFor="character-name" className="block text-sm font-medium text-gray-700 mb-1">
                    角色名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="character-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="输入角色名称"
                    data-testid="character-name-input"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && <p id="name-error" className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="col-span-2">
                  <label htmlFor="character-alias" className="block text-sm font-medium text-gray-700 mb-1">别名</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      id="character-alias"
                      type="text"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAlias())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="添加别名"
                      data-testid="alias-input"
                    />
                    <button
                      type="button"
                      onClick={handleAddAlias}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      data-testid="add-alias-button"
                      aria-label="添加别名"
                    >
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.aliases?.map((alias, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        data-testid="alias-tag"
                      >
                        {alias}
                        <button
                          type="button"
                          onClick={() => handleRemoveAlias(alias)}
                          className="hover:text-blue-900"
                          data-testid="remove-alias-button"
                          aria-label={`移除别名: ${alias}`}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="character-age" className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                  <input
                    id="character-age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入年龄"
                    data-testid="character-age-input"
                  />
                </div>

                <div>
                  <label htmlFor="character-gender" className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select
                    id="character-gender"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Character['gender'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="character-gender-select"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                    <option value="unknown">未知</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label htmlFor="character-occupation" className="block text-sm font-medium text-gray-700 mb-1">职业</label>
                  <input
                    id="character-occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入职业"
                    data-testid="character-occupation-input"
                  />
                </div>
              </div>
            </section>

            {/* 详细设定 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">详细设定</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="character-appearance" className="block text-sm font-medium text-gray-700 mb-1">外貌描述</label>
                  <textarea
                    id="character-appearance"
                    value={formData.appearance}
                    onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="描述角色的外貌特征..."
                    data-testid="character-appearance-input"
                  />
                </div>

                <div>
                  <label htmlFor="character-personality" className="block text-sm font-medium text-gray-700 mb-1">性格特点</label>
                  <textarea
                    id="character-personality"
                    value={formData.personality}
                    onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="描述角色的性格特点..."
                    data-testid="character-personality-input"
                  />
                </div>

                <div>
                  <label htmlFor="character-backstory" className="block text-sm font-medium text-gray-700 mb-1">背景故事</label>
                  <textarea
                    id="character-backstory"
                    value={formData.backstory}
                    onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="描述角色的背景故事..."
                    data-testid="character-backstory-input"
                  />
                </div>

                <div>
                  <label htmlFor="character-goals" className="block text-sm font-medium text-gray-700 mb-1">目标/动机</label>
                  <textarea
                    id="character-goals"
                    value={formData.goals}
                    onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="描述角色的目标和动机..."
                    data-testid="character-goals-input"
                  />
                </div>
              </div>
            </section>

            {/* 标签 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">标签</h3>
              <div className="flex gap-2 mb-2">
                <label htmlFor="character-tag" className="sr-only">添加标签</label>
                <input
                  id="character-tag"
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="添加标签"
                  data-testid="tag-input"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  data-testid="add-tag-button"
                  aria-label="添加标签"
                >
                  <Plus size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                    data-testid="character-tag"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-green-900"
                      data-testid="remove-tag-button"
                      aria-label={`移除标签: ${tag}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </section>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {character && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                data-testid="delete-character-button"
              >
                <Trash2 size={18} />
                删除角色
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              data-testid="cancel-button"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="save-character-button"
            >
              {character ? '保存修改' : '创建角色'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterForm;
