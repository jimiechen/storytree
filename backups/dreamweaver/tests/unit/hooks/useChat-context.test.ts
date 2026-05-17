import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat, buildSystemPrompt, type ChatContext } from '@/hooks/useChat';

// Mock fetch
global.fetch = vi.fn();

describe('useChat Context Injection (T-AI-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildSystemPrompt', () => {
    it('应该在没有上下文时返回默认提示词', () => {
      const prompt = buildSystemPrompt();
      
      expect(prompt).toBe('你是一个专业的小说写作助手，可以帮助作者润色、续写、扩写和总结文本。');
    });

    it('应该包含项目名称', () => {
      const context: ChatContext = {
        projectName: '我的小说',
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('项目名称：我的小说');
    });

    it('应该包含章节标题', () => {
      const context: ChatContext = {
        chapterTitle: '第一章：开始',
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('当前章节：第一章：开始');
    });

    it('应该包含章节内容', () => {
      const context: ChatContext = {
        chapterContent: '这是章节的内容...',
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('章节内容：');
      expect(prompt).toContain('这是章节的内容...');
    });

    it('应该包含选中的文本', () => {
      const context: ChatContext = {
        selectedText: '这是选中的文本',
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('选中的文本：');
      expect(prompt).toContain('这是选中的文本');
    });

    it('应该包含所有上下文信息', () => {
      const context: ChatContext = {
        projectName: '我的小说',
        chapterTitle: '第一章',
        chapterContent: '章节内容',
        selectedText: '选中文本',
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('项目名称：我的小说');
      expect(prompt).toContain('当前章节：第一章');
      expect(prompt).toContain('章节内容：');
      expect(prompt).toContain('选中的文本：');
    });
  });

  describe('useChat with context', () => {
    it('应该在请求体中包含系统提示词和上下文', async () => {
      const mockFetch = vi.mocked(fetch);
      
      // Mock successful response with stream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Response'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      } as Response);

      const context: ChatContext = {
        projectName: '测试项目',
        chapterTitle: '测试章节',
        chapterContent: '这是测试章节的内容',
      };

      const { result } = renderHook(() =>
        useChat({
          projectId: 'test-project',
          context,
        })
      );

      // Send a message
      act(() => {
        result.current.append({
          role: 'user',
          content: 'Hello',
        });
      });

      // Wait for the fetch to be called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Verify the request body contains context
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);

      expect(requestBody).toHaveProperty('messages');
      expect(requestBody.messages).toHaveLength(2); // system + user

      // Verify system message contains context
      const systemMessage = requestBody.messages[0];
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('测试项目');
      expect(systemMessage.content).toContain('测试章节');
      expect(systemMessage.content).toContain('这是测试章节的内容');

      // Verify user message
      const userMessage = requestBody.messages[1];
      expect(userMessage.role).toBe('user');
      expect(userMessage.content).toBe('Hello');
    });

    it('应该在上下文变化时更新系统提示词', async () => {
      const mockFetch = vi.mocked(fetch);
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      } as Response);

      const initialContext: ChatContext = {
        chapterTitle: '第一章',
        chapterContent: '初始内容',
      };

      const { result, rerender } = renderHook(
        ({ context }) => useChat({ projectId: 'test', context }),
        {
          initialProps: { context: initialContext },
        }
      );

      // Send first message
      act(() => {
        result.current.append({ role: 'user', content: 'Message 1' });
      });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      // Verify first request contains initial context
      let requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.messages[0].content).toContain('第一章');
      expect(requestBody.messages[0].content).toContain('初始内容');

      // Update context
      const updatedContext: ChatContext = {
        chapterTitle: '第二章',
        chapterContent: '更新后的内容',
      };

      rerender({ context: updatedContext });

      // Send second message
      act(() => {
        result.current.append({ role: 'user', content: 'Message 2' });
      });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

      // Verify second request contains updated context
      requestBody = JSON.parse(mockFetch.mock.calls[1][1]?.body as string);
      expect(requestBody.messages[0].content).toContain('第二章');
      expect(requestBody.messages[0].content).toContain('更新后的内容');
    });

    it('应该在请求中包含选中的文本', async () => {
      const mockFetch = vi.mocked(fetch);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      } as Response);

      const context: ChatContext = {
        chapterContent: '完整章节内容',
        selectedText: '这是用户选中的特定文本',
      };

      const { result } = renderHook(() =>
        useChat({
          projectId: 'test-project',
          context,
        })
      );

      act(() => {
        result.current.append({
          role: 'user',
          content: '请润色这段文字',
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const systemMessage = requestBody.messages[0];

      expect(systemMessage.content).toContain('完整章节内容');
      expect(systemMessage.content).toContain('这是用户选中的特定文本');
    });

    it('应该在没有上下文时发送默认系统提示词', async () => {
      const mockFetch = vi.mocked(fetch);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      } as Response);

      const { result } = renderHook(() =>
        useChat({
          projectId: 'test-project',
        })
      );

      act(() => {
        result.current.append({
          role: 'user',
          content: 'Hello',
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const systemMessage = requestBody.messages[0];

      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toBe('你是一个专业的小说写作助手，可以帮助作者润色、续写、扩写和总结文本。');
    });

    it('应该将上下文信息放在用户消息之前', async () => {
      const mockFetch = vi.mocked(fetch);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Response'));
            controller.close();
          },
        }),
      } as Response);

      const context: ChatContext = {
        chapterTitle: '测试章节',
      };

      const { result } = renderHook(() =>
        useChat({
          projectId: 'test-project',
          context,
        })
      );

      // Send multiple messages
      act(() => {
        result.current.append({ role: 'user', content: 'Message 1' });
      });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      
      // Verify order: system message first, then user messages
      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[1].role).toBe('user');
      expect(requestBody.messages[1].content).toBe('Message 1');
    });
  });
});
