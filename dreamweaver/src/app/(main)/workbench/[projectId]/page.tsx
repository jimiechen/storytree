'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ActivityBar } from '@/components/layout/ActivityBar';
import { StoryExplorer } from '@/components/layout/StoryExplorer';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { StatusBar } from '@/components/editor/StatusBar';
import { AIPanel } from '@/components/ai/AIPanel';
import { Editor } from '@/components/editor/Editor';
import { api } from '@/lib/api';
import { CreateChapterModal } from '@/components/chapters/CreateChapterModal';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Volume {
  id: string;
  name: string;
  chapters: Chapter[];
}

export default function WorkbenchPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [activeView, setActiveView] = useState('outline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [wordCount, setWordCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取章节列表
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ result: { data: { chapters: Chapter[] } } }>(
          `/api/projects/${projectId}/chapters`
        );
        const chaptersData = response?.result?.data?.chapters || [];

        // 组织成卷结构（简化处理，默认第一卷）
        const defaultVolume: Volume = {
          id: 'volume-1',
          name: '第一卷',
          chapters: chaptersData.map((c) => ({
            ...c,
            order: c.order || 1,
          })),
        };

        setVolumes([defaultVolume]);
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
  const activeChapter = volumes
    .flatMap((v) => v.chapters)
    .find((c) => c.id === activeChapterId);

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
      const response = await api.post<{ result: { data: Chapter } }>(`/api/projects/${projectId}/chapters`, {
        title,
        content: '<p></p>',
      });
      const newChapter = response.result.data;

      setVolumes((prev) => {
        const newVolumes = [...prev];
        if (newVolumes.length > 0) {
          newVolumes[0].chapters.push({
            ...newChapter,
            order: newChapter.order || newVolumes[0].chapters.length + 1,
          });
        }
        return newVolumes;
      });

      setActiveChapterId(newChapter.id);
      setSaveStatus('saved');
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create chapter:', err);
      setError('创建章节失败');
    }
  }, [projectId]);

  // 自动保存函数
  const autoSave = useCallback(async (chapterId: string, content: string) => {
    setSaveStatus('saving');
    try {
      await api.put(`/api/chapters/${chapterId}`, {
        content,
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to auto-save:', err);
      setSaveStatus('unsaved');
    }
  }, []);

  // 处理内容变更（自动保存 - 防抖2秒）
  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeChapterId) return;

      // 更新本地状态
      setVolumes((prev) =>
        prev.map((volume) => ({
          ...volume,
          chapters: volume.chapters.map((chapter) =>
            chapter.id === activeChapterId ? { ...chapter, content } : chapter
          ),
        }))
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
    },
    [activeChapterId, autoSave, calculateWordCount]
  );

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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-on-surface-variant">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-on-surface overflow-hidden flex" data-testid="workbench-page">
      {/* Activity Bar (Fixed Left) */}
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />

      {/* App Shell */}
      <main className="flex flex-1 ml-[48px] h-full overflow-hidden">
        {/* Primary Sidebar (Story Explorer) */}
        <StoryExplorer
          volumes={volumes}
          activeChapterId={activeChapterId}
          onChapterSelect={handleChapterSelect}
          onAddChapter={() => setIsCreateModalOpen(true)}
        />

        {/* Main Editor Area */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest relative">
          {/* Editor Toolbar */}
          <EditorToolbar saveStatus={saveStatus} />

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto scroll-smooth py-12 px-24 flex flex-col items-center">
            <article className="max-w-[700px] w-full relative pl-8 border-l-2 border-primary/20">
              {activeChapter ? (
                <>
                  <h1 className="font-headline text-4xl font-black mb-12 text-on-surface tracking-tight">
                    {activeChapter.title}
                  </h1>
                  <div className="font-body text-[16px] leading-[1.8] text-on-surface/90">
                    <Editor
                      content={activeChapter.content}
                      onContentChange={handleContentChange}
                      projectId={projectId}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-on-surface-variant">
                  请选择一个章节或创建新章节
                </div>
              )}
            </article>
          </div>

          {/* Status Bar */}
          <StatusBar
            wordCount={wordCount}
            todayWordCount={2150}
            totalWordCount={128450}
            modelName="CLAUDE 4 OPUS"
            consistencyStatus="checked"
          />
        </section>

        {/* Secondary Sidebar (AI Panel) */}
        <AIPanel
          projectId={projectId}
          context={{
            chapterContent: activeChapter?.content,
            chapterTitle: activeChapter?.title,
          }}
        />
      </main>

      {/* Create Chapter Modal */}
      <CreateChapterModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onChapterCreated={handleAddChapter}
      />
    </div>
  );
}
