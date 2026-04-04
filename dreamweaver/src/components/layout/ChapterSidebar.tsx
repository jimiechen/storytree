import React, { useState } from 'react';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

interface ChapterSidebarProps {
  chapters: Chapter[];
  activeChapterId: string;
  onChapterSelect: (chapterId: string) => void;
  onAddChapter: (title: string) => void;
  className?: string;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  chapters,
  activeChapterId,
  onChapterSelect,
  onAddChapter,
  className = '',
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const handleAddChapter = () => {
    if (newChapterTitle.trim()) {
      onAddChapter(newChapterTitle.trim());
      setNewChapterTitle('');
      setShowNewForm(false);
    }
  };

  return (
    <div className={`chapter-sidebar w-64 border-r border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">章节导航</h2>
        <button
          data-testid="new-chapter-button"
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + 新建章节
        </button>
      </div>

      {showNewForm && (
        <div data-testid="new-chapter-form" className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <input
            data-testid="chapter-title-input"
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="章节标题"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              data-testid="confirm-button"
              onClick={handleAddChapter}
              className="flex-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              确认
            </button>
            <button
              data-testid="cancel-button"
              onClick={() => {
                setShowNewForm(false);
                setNewChapterTitle('');
              }}
              className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div data-testid="chapter-list" className="space-y-1">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            data-testid="chapter-item"
            onClick={() => onChapterSelect(chapter.id)}
            className={`p-2 rounded cursor-pointer transition-colors ${activeChapterId === chapter.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <div data-testid="chapter-title" className="text-sm font-medium">
              {chapter.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChapterSidebar;
