'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Sparkles, User, Bot, X, CheckCircle, History } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChatContext {
  chapterContent?: string;
  chapterTitle?: string;
  projectName?: string;
  selectedText?: string;
}

interface ChatPanelProps {
  projectId: string;
  context?: ChatContext;
  compact?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  projectId,
  context,
  compact = false,
}) => {
  const t = useTranslations('AIChat');
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    projectId,
    context,
  });

  const quickActions = [
    { id: 'continue', label: `/${t('continue')}`, prompt: '请续写以下内容：' },
    { id: 'expand', label: `/${t('expand')}`, prompt: '请扩写以下内容：' },
    { id: 'rewrite', label: `/${t('rewrite')}`, prompt: '请改写以下内容：' },
    { id: 'dialogue', label: `/${t('chat')}`, prompt: '请为以下场景编写对话：' },
    { id: 'describe', label: `/${t('describe')}`, prompt: '请描写以下场景：' },
    { id: 'deduce', label: `/${t('deduce')}`, prompt: '请推演以下情节发展：' },
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find((a) => a.id === actionId);
    if (action) {
      setActiveAction(actionId);
      handleInputChange({ target: { value: action.prompt } } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
    setActiveAction(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (compact) {
    return (
      <div className="flex flex-col h-full bg-surface-container-low" data-testid="chat-panel-compact">
        {/* Compact Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="chat-messages">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant space-y-2">
              <Sparkles size={24} className="text-primary/50" />
              <p className="text-xs">{t('startChat')}</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  data-testid={`message-${message.role}`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                      message.role === 'user'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary/20 text-secondary'
                    }`}
                  >
                    {message.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                      message.role === 'user'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-on-surface'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-xs max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2" data-testid="loading-indicator">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                    <Bot size={12} />
                  </div>
                  <div className="bg-surface-container-highest rounded-xl px-3 py-2 flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-outline" />
                    <span className="text-xs text-outline">{t('thinking')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
          {error && (
            <div className="p-2 bg-error-container/20 border border-error/30 rounded-lg" data-testid="error-message">
              <p className="text-xs text-error">{error}</p>
            </div>
          )}
        </div>

        {/* Compact Input */}
        <div className="border-t border-outline-variant/20 p-2 bg-surface-container">
          <form onSubmit={onSubmit} className="flex gap-2" data-testid="chat-input-form">
            <input
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder="输入消息..."
              className="flex-1 px-3 py-2 text-xs bg-surface-container-highest border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40"
              data-testid="chat-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 disabled:bg-surface-container-highest disabled:text-outline disabled:cursor-not-allowed transition-colors"
              data-testid="send-button"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-[380px] bg-surface-container flex flex-col border-l border-outline-variant/10 h-full" data-testid="chat-panel">
      {/* Context Bar */}
      <div className="px-4 py-3 bg-surface-container-high flex items-center gap-2 text-xs text-on-surface/70 font-label">
        <span className="material-symbols-outlined text-sm">book_2</span>
        <span>{context?.chapterTitle || t('currentChapter')}</span>
        <span className="mx-1 text-outline-variant">|</span>
        <span className="material-symbols-outlined text-sm">group</span>
        <span>李云, 苏婉</span>
        <span className="mx-1 text-outline-variant">|</span>
        <span className="material-symbols-outlined text-sm">location_on</span>
        <span>悬崖</span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles size={32} className="text-primary/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-1">{t('startChat')}</p>
              <p className="text-xs text-on-surface-variant/60">{t('inputPlaceholder')}</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'flex flex-col items-end space-y-2' : 'flex flex-col items-start space-y-3'}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">DreamWeaver AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[95%] px-4 py-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'rounded-tr-none border border-outline-variant/30 bg-surface-container-highest/40'
                      : 'rounded-tl-none border-l-4 border-primary bg-surface-container-high/50 glass-panel shadow-xl'
                  }`}
                  data-testid={`message-${message.role}`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {/* Action buttons for AI response */}
                  {message.role === 'assistant' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 rounded bg-primary text-on-primary-fixed text-[11px] font-bold hover:opacity-90 transition-opacity flex items-center gap-1">
                        <CheckCircle size={12} />
                        {t('accept')}
                      </button>
                      <button className="px-3 py-1.5 rounded bg-surface-container-highest text-on-surface text-[11px] hover:bg-surface-bright transition-colors">
                        {t('regenerate')}
                      </button>
                      <button className="px-3 py-1.5 rounded bg-surface-container-highest text-on-surface text-[11px] hover:bg-surface-bright transition-colors">
                        扩写
                      </button>
                      <button className="px-3 py-1.5 rounded bg-surface-container-highest text-on-surface text-[11px] hover:bg-surface-bright transition-colors">
                        改写
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex flex-col items-start space-y-3" data-testid="loading-indicator">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">DreamWeaver AI</span>
                </div>
                <div className="max-w-[95%] px-4 py-4 rounded-2xl rounded-tl-none border-l-4 border-primary bg-surface-container-high/50 glass-panel shadow-xl">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-sm text-on-surface/70">{t('thinking')}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
        
        {error && (
          <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg" data-testid="error-message">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 pb-6 bg-surface-container-high border-t border-outline-variant/10">
        {/* Action Chips */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-3 no-scrollbar" aria-label="Quick Actions">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                activeAction === action.id
                  ? 'bg-primary-container text-primary border-primary/20'
                  : 'bg-surface-container-highest text-on-surface/70 border-outline-variant/30 hover:border-primary/50'
              }`}
              data-testid={`quick-action-${action.id}`}
              aria-label={`Use ${action.label}`}
              aria-pressed={activeAction === action.id}
            >
              {action.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={onSubmit} className="relative group" data-testid="chat-input-form">
          <label htmlFor="chat-input" className="sr-only">{t('inputPlaceholder')}</label>
          <textarea
            id="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            className="w-full bg-surface-container-highest rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-sm p-4 pr-12 min-h-[100px] placeholder:text-on-surface/30 resize-none transition-all"
            data-testid="chat-input"
            disabled={isLoading}
            tabIndex={0}
            aria-invalid={!!error}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="send-button"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'wght' 700" }} aria-hidden="true">arrow_upward</span>
          </button>
        </form>
        
        <div className="mt-2 flex justify-between items-center px-1">
          <div className="flex gap-3">
            <button className="text-on-surface/40 hover:text-primary transition-colors" aria-label="Attach file">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">attach_file</span>
            </button>
            <button className="text-on-surface/40 hover:text-primary transition-colors" aria-label="Insert emoji">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">mood</span>
            </button>
          </div>
          <span className="text-[10px] text-on-surface/30 font-medium">{t('shiftEnter')}</span>
        </div>
      </div>
    </aside>
  );
};
