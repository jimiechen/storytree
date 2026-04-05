'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Search, Filter, MoreVertical, Globe, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useKnowledgeStore } from '@/stores/knowledge-store';
import { WorldSettingForm } from '@/components/knowledge/WorldSettingForm';
import type { WorldSetting } from '@/types/knowledge';

const categoryLabels: Record<string, string> = {
  geography: '地理',
  magic: '魔法',
  history: '历史',
  culture: '文化',
  politics: '政治',
  technology: '科技',
  religion: '宗教',
  custom: '自定义',
};

const importanceColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function WorldSettingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const { 
    worldSettings, 
    setWorldSettings: setStoreWorldSettings,
    addWorldSetting: addStoreWorldSetting,
    updateWorldSetting: updateStoreWorldSetting,
    deleteWorldSetting: deleteStoreWorldSetting,
  } = useKnowledgeStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<WorldSetting | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // 获取设定列表
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ data: WorldSetting[] }>(`/api/projects/${projectId}/world-settings`);
        const settingsData = response?.data || [];
        setStoreWorldSettings(settingsData);
      } catch (err) {
        setError('获取世界观设定失败');
        console.error('Failed to fetch world settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchSettings();
    }
  }, [projectId, setStoreWorldSettings]);

  // 过滤设定
  const filteredSettings = worldSettings.filter(setting => {
    const matchesSearch = setting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         setting.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || setting.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 按分类分组
  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    const category = setting.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, WorldSetting[]>);

  // 创建设定
  const handleCreateSetting = async (data: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.post<{ data: WorldSetting }>(`/api/projects/${projectId}/world-settings`, {
        ...data,
        projectId,
      });
      
      if (response?.data) {
        addStoreWorldSetting(response.data);
      }
    } catch (err) {
      console.error('Failed to create world setting:', err);
      setError('创建设定失败');
    }
  };

  // 更新设定
  const handleUpdateSetting = async (data: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingSetting) return;
    
    try {
      const response = await api.put<{ data: WorldSetting }>(`/api/projects/${projectId}/world-settings/${editingSetting.id}`, data);
      
      if (response?.data) {
        updateStoreWorldSetting(editingSetting.id, response.data);
      }
    } catch (err) {
      console.error('Failed to update world setting:', err);
      setError('更新设定失败');
    }
  };

  // 删除设定
  const handleDeleteSetting = async (id: string) => {
    try {
      await api.delete(`/api/projects/${projectId}/world-settings/${id}`);
      deleteStoreWorldSetting(id);
      setActiveMenuId(null);
    } catch (err) {
      console.error('Failed to delete world setting:', err);
      setError('删除设定失败');
    }
  };

  // 打开创建表单
  const openCreateForm = () => {
    setEditingSetting(null);
    setIsFormOpen(true);
  };

  // 打开编辑表单
  const openEditForm = (setting: WorldSetting) => {
    setEditingSetting(setting);
    setIsFormOpen(true);
    setActiveMenuId(null);
  };

  // 关闭表单
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSetting(null);
  };

  // 处理表单提交
  const handleFormSubmit = (data: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSetting) {
      handleUpdateSetting(data);
    } else {
      handleCreateSetting(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="world-settings-loading">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="world-settings-error">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50" data-testid="world-settings-page">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">世界观设定</h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {worldSettings.length} 条设定
            </p>
          </div>
          
          <button
            onClick={openCreateForm}
            data-testid="create-setting-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            新建设定
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索设定标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="setting-search-input"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            data-testid="category-filter"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* 设定列表 */}
      <div className="flex-1 overflow-auto p-6">
        {filteredSettings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500" data-testid="empty-state">
            <Globe size={64} className="mb-4 text-gray-300" />
            <p className="text-lg">暂无世界观设定</p>
            <p className="text-sm mt-2">点击右上角"新建设定"开始创建</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="settings-list">
            {Object.entries(groupedSettings).map(([category, categorySettings]) => (
              <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <BookOpen size={18} className="text-gray-500" />
                  <h2 className="font-semibold text-gray-800">
                    {categoryLabels[category] || category}
                  </h2>
                  <span className="text-sm text-gray-500">({categorySettings.length})</span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {categorySettings.map((setting) => (
                    <div
                      key={setting.id}
                      data-testid="setting-card"
                      className="p-6 hover:bg-gray-50 transition-colors relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900" data-testid="setting-title">
                              {setting.title}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${importanceColors[setting.importance] || importanceColors.medium}`}>
                              {setting.importance === 'critical' && '核心'}
                              {setting.importance === 'high' && '重要'}
                              {setting.importance === 'medium' && '一般'}
                              {setting.importance === 'low' && '次要'}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                            {setting.content}
                          </p>
                          
                          {setting.tags && setting.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {setting.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="relative ml-4">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === setting.id ? null : setting.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            data-testid="setting-menu-button"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {/* 下拉菜单 */}
                          {activeMenuId === setting.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1" data-testid="setting-menu">
                                <button
                                  onClick={() => openEditForm(setting)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  data-testid="edit-setting-menu-item"
                                >
                                  <Edit2 size={14} />
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleDeleteSetting(setting.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  data-testid="delete-setting-menu-item"
                                >
                                  <Trash2 size={14} />
                                  删除
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 世界观设定表单弹窗 */}
      <WorldSettingForm
        setting={editingSetting}
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        onDelete={editingSetting ? handleDeleteSetting : undefined}
      />
    </div>
  );
}
