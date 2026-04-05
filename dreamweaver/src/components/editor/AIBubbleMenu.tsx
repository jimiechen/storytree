'use client';

import React, { useState } from 'react';
import { BubbleMenu, type Editor } from '@tiptap/react';
import { Sparkles, Wand2, PenTool, Maximize2, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface AIBubbleMenuProps {
  editor: Editor;
  projectId: string;
}

const aiActions = [
  { id: 'polish', label: '润色', icon: Wand2, prompt: '请润色以下文本，使其更加流畅自然，保持原意不变：' },
  { id: 'continue', label: '续写', icon: PenTool, prompt: '请根据以下内容续写，保持文风一致：' },
  { id: 'expand', label: '扩写', icon: Maximize2, prompt: '请扩写以下内容，增加更多细节和描写：' },
];

export const AIBubbleMenu: React.FC<AIBubbleMenuProps> = ({ editor, projectId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(true);

  const handleAIAction = async (action: typeof aiActions[0]) => {
    const selectedText = editor.state.selection.empty
      ? ''
      : editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        );

    if (!selectedText.trim()) return;

    setIsLoading(true);

    try {
      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一个专业的小说写作助手。' +
                (editor.getText() ? `当前章节内容：\n${editor.getText().slice(0, 1000)}...\n\n` : ''),
            },
            {
              role: 'user',
              content: `${action.prompt}\n\n${selectedText}`,
            },
          ],
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      // Read stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
        }
      } finally {
        reader.releaseLock();
      }

      // Replace selected text with AI response
      editor
        .chain()
        .focus()
        .insertContentAt(editor.state.selection, accumulatedContent)
        .run();

    } catch (error) {
      console.error('AI action failed:', error);
      alert('AI 处理失败，请重试');
    } finally {
      setIsLoading(false);
      setShowActions(true);
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      shouldShow={({ editor }) => {
        // Only show when text is selected
        return !editor.state.selection.empty;
      }}
      data-testid="ai-bubble-menu"
    >
      <div className="flex items-center gap-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg">
        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">AI 处理中...</span>
          </div>
        ) : showActions ? (
          <>
            <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-xs font-medium text-gray-700">AI 助手</span>
            </div>
            {aiActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAIAction(action)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                  data-testid={`ai-action-${action.id}`}
                >
                  <Icon size={14} />
                  {action.label}
                </button>
              );
            })}
          </>
        ) : null}
      </div>
    </BubbleMenu>
  );
};

export default AIBubbleMenu;
