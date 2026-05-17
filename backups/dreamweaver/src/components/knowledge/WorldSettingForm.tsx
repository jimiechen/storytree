'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { WorldSetting, WorldSettingCategory } from '@/types/knowledge';

interface WorldSettingFormProps {
  setting?: WorldSetting | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string) => void;
}

const categoryOptions: { value: WorldSettingCategory; label: string }[] = [
  { value: 'geography', label: '地理' },
  { value: 'magic', label: '魔法' },
  { value: 'history', label: '历史' },
  { value: 'culture', label: '文化' },
  { value: 'politics', label: '政治' },
  { value: 'technology', label: '科技' },
  { value: 'religion', label: '宗教' },
  { value: 'custom', label: '自定义' },
];

const importanceOptions = [
  { value: 'critical', label: '核心' },
  { value: 'high', label: '重要' },
  { value: 'medium', label: '一般' },
  { value: 'low', label: '次要' },
];

const initialFormData: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'> = {
  projectId: '',
  title: '',
  category: 'geography',
  customCategoryName: '',
  content: '',
  importance: 'medium',
  relatedCharacterIds: [],
  relatedChapterIds: [],
  tags: [],
  status: 'active',
};

export const WorldSettingForm: React.FC<WorldSettingFormProps> = ({
  setting,
  isOpen,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (setting) {
      setFormData({
        projectId: setting.projectId,
        title: setting.title,
        category: setting.category,
        customCategoryName: setting.customCategoryName || '',
        content: setting.content,
        importance: setting.importance,
        relatedCharacterIds: setting.relatedCharacterIds || [],
        relatedChapterIds: setting.relatedChapterIds || [],
        tags: setting.tags || [],
        status: setting.status || 'active',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [setting, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    if (!formData.title.trim()) {
      newErrors.title = '设定标题不能为空';
      isValid = false;
      console.log('[DEBUG] validateForm failed on title:', formData.title);
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '设定内容不能为空';
      isValid = false;
      console.log('[DEBUG] validateForm failed on content:', formData.content);
    }
    
    if (formData.category === 'custom' && !formData.customCategoryName?.trim()) {
      newErrors.customCategoryName = '自定义分类名称不能为空';
      isValid = false;
      console.log('[DEBUG] validateForm failed on customCategoryName:', formData.customCategoryName);
    }
    
    setErrors(newErrors);
    console.log('[DEBUG] validateForm result:', isValid);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleSubmit triggered!');
    
    if (!validateForm()) {
      console.log('[DEBUG] handleSubmit aborted because validateForm returned false');
      return;
    }
    
    console.log('[DEBUG] handleSubmit calling onSubmit(formData)');
    onSubmit(formData);
    onClose();
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
    if (setting && onDelete && confirm('确定要删除这个设定吗？此操作不可撤销。')) {
      onDelete(setting.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="world-setting-form-modal">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {setting ? '编辑世界观设定' : '新建世界观设定'}
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    设定标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="输入设定标题"
                    data-testid="setting-title-input"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as WorldSettingCategory }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="setting-category-select"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">重要性</label>
                    <select
                      value={formData.importance}
                      onChange={(e) => setFormData(prev => ({ ...prev, importance: e.target.value as WorldSetting['importance'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="setting-importance-select"
                    >
                      {importanceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.category === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      自定义分类名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customCategoryName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCategoryName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.customCategoryName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="输入自定义分类名称"
                      data-testid="custom-category-input"
                    />
                    {errors.customCategoryName && <p className="mt-1 text-sm text-red-500">{errors.customCategoryName}</p>}
                  </div>
                )}
              </div>
            </section>

            {/* 设定内容 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">设定内容</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="详细描述这个设定..."
                  data-testid="setting-content-input"
                />
                {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
              </div>
            </section>

            {/* 标签 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">标签</h3>
              <div className="flex gap-2 mb-2">
                <input
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
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                    data-testid="setting-tag"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-green-900"
                      data-testid="remove-tag-button"
                    >
                      <X size={14} />
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
            {setting && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                data-testid="delete-setting-button"
              >
                <Trash2 size={18} />
                删除设定
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
              data-testid="save-setting-button"
            >
              {setting ? '保存修改' : '创建设定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldSettingForm;
