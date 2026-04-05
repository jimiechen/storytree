'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ChapterSidebar } from '@/components/layout/ChapterSidebar';
import { Editor } from '@/components/editor/Editor';
import { api } from '@/lib/api';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

export default function WorkbenchPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [wordCount, setWordCount] = useState(0);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取章节列表
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await api.get<{chapters: Chapter[]}>(`/api/projects/${projectId}/chapters`);
        const chaptersData = response?.chapters || [];
        setChapters(chaptersData);
        if (chaptersData.length > 0 && !activeChapterId) {
          setActiveChapterId(chaptersData[0].id);
        }
      } catch (err) {
        setError('获取章节列表失败');
        console.error('Failed to fetch chapters:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchChapters();
    }
  }, [projectId]);

  // 获取当前章节
  const activeChapter = chapters.find(c => c.id === activeChapterId);

  // 计算字数
  const calculateWordCount = useCallback((content: string = '') => {
    // 移除 HTML 标签
    const text = content.replace(/<[^>]*>/g, '');
    // 计算中文字符和英文单词
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }, []);

  // 更新字数统计
  useEffect(() => {
    if (activeChapter) {
      setWordCount(calculateWordCount(activeChapter.content));
    }
  }, [activeChapter, calculateWordCount]);

  // 处理章节切换
  const handleChapterSelect = useCallback((chapterId: string) => {
    setActiveChapterId(chapterId);
    setSaveStatus('saved');
  }, []);

  // 处理添加新章节
  const handleAddChapter = useCallback(async (title: string) => {
    try {
      const newChapter = await api.post<Chapter>(`/api/projects/${projectId}/chapters`, {
        title,
        content: '<p></p>',
      });
      
      setChapters(prev => [...prev, newChapter]);
      setActiveChapterId(newChapter.id);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to create chapter:', err);
      setError('创建章节失败');
    }
  }, [projectId]);

  // 自动保存函数
  const autoSave = useCallback(async (chapterId: string, content: string) => {
    setSaveStatus('saving');
    try {
      await api.put(`/api/projects/${projectId}/chapters/${chapterId}`, {
        content,
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to auto-save:', err);
      setSaveStatus('unsaved');
    }
  }, []);

  // 处理内容变更（自动保存 - 防抖2秒）
  const handleContentChange = useCallback((content: string) => {
    if (!activeChapterId) return;
    
    // 更新本地状态
    setChapters(prev => 
      prev.map(chapter => 
        chapter.id === activeChapterId 
          ? { ...chapter, content }
          : chapter
      )
    );
    
    // 更新字数
    setWordCount(calculateWordCount(content));
    
    // 设置保存状态为未保存
    setSaveStatus('unsaved');
    
    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // 设置新的定时器（2秒防抖）
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(activeChapterId, content);
    }, 2000);
  }, [activeChapterId, autoSave, calculateWordCount]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" data-testid="workbench-page">
      {/* 左侧章节导航 */}
      <div data-testid="chapter-sidebar">
        <ChapterSidebar
          chapters={chapters}
          activeChapterId={activeChapterId}
          onChapterSelect={handleChapterSelect}
          onAddChapter={handleAddChapter}
        />
      </div>
      
      {/* 中间编辑器区域 */}
      <div className="flex-1 flex flex-col">
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200"
          data-testid="workbench-header"
        >
          <h1 className="text-xl font-semibold text-gray-800">
            {activeChapter?.title || '未选择章节'}
          </h1>
          <div className="flex items-center gap-4">
            {/* 字数统计 */}
            <div data-testid="word-count" className="text-sm text-gray-500">
              字数: {wordCount}
            </div>
            {/* 保存状态 */}
            <div data-testid="save-status" className="text-sm">
              {saveStatus === 'saving' && (
                <span className="text-blue-500">保存中...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-500">已保存</span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-orange-500">未保存</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          {activeChapter ? (
            <Editor
              content={activeChapter.content}
              onContentChange={handleContentChange}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              请选择一个章节或创建新章节
            </div>
          )}
        </div>
      </div>
      
      {/* 右侧 AI 面板占位 */}
      <div 
        className="w-80 border-l border-gray-200 bg-gray-50 p-4"
        data-testid="ai-panel"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AI 助手</h2>
        <div className="text-sm text-gray-500">
          AI 对话功能即将上线...
        </div>
      </div>
    </div>
  );
}
