'use client';

import { useState, useCallback, useRef } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatContext {
  chapterContent?: string;
  chapterTitle?: string;
  projectName?: string;
  selectedText?: string;
}

export interface UseChatOptions {
  projectId: string;
  context?: ChatContext;
}

export interface UseChatReturn {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  model: string;
  setModel: (model: string) => void;
  append: (message: Omit<Message, 'id'>) => void;
  clearMessages: () => void;
}

/**
 * 构建系统提示词，包含上下文信息
 */
export function buildSystemPrompt(context?: ChatContext): string {
  const parts: string[] = [];

  if (context?.projectName) {
    parts.push(`项目名称：${context.projectName}`);
  }

  if (context?.chapterTitle) {
    parts.push(`当前章节：${context.chapterTitle}`);
  }

  if (context?.chapterContent) {
    parts.push(`章节内容：\n${context.chapterContent}`);
  }

  if (context?.selectedText) {
    parts.push(`选中的文本：\n${context.selectedText}`);
  }

  if (parts.length === 0) {
    return '你是一个专业的小说写作助手，可以帮助作者润色、续写、扩写和总结文本。';
  }

  return `你是一个专业的小说写作助手。请基于以下上下文信息回答问题：\n\n${parts.join('\n\n')}`;
}

export function useChat({ projectId, context }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState('gpt-4o-mini');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const append = useCallback(async (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
    };

    setMessages((prev) => [...prev, newMessage]);

    if (message.role === 'user') {
      await sendMessageToAI([...messages, newMessage]);
    }
  }, [messages]);

  const sendMessageToAI = useCallback(async (currentMessages: Message[]) => {
    setIsLoading(true);
    setError(null);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build system prompt with context
      const systemPrompt = buildSystemPrompt(context);

      // Prepare messages with system context
      const messagesWithContext: Message[] = [
        {
          id: 'system-context',
          role: 'system',
          content: systemPrompt,
        },
        ...currentMessages,
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesWithContext.map(({ role, content }) => ({ role, content })),
          model,
          temperature: 0.7,
          maxTokens: 2000,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Create assistant message placeholder
      const assistantMessageId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
        },
      ]);

      // Read stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Update the assistant message with accumulated content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        }
      } catch (streamError) {
        if (streamError instanceof Error && streamError.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          throw streamError;
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [context, model]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    await append({
      role: 'user',
      content: userMessage,
    });
  }, [input, isLoading, append]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    model,
    setModel,
    append,
    clearMessages,
  };
}
