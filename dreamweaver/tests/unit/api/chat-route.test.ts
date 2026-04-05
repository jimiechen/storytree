import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/chat/route';

// Mock the AI SDK
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn((model: string) => ({ model })),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

import { streamText } from 'ai';

describe('Chat API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/chat', () => {
    it('应该返回健康检查状态', async () => {
      const response = await GET();
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        status: 'ok',
        message: 'AI Chat API is running',
      });
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.POST).toBe('/api/chat - Stream chat completions');
    });
  });

  describe('POST /api/chat', () => {
    it('应该验证请求体中的 messages 字段', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Messages are required');
    });

    it('应该验证 messages 是数组', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: 'not an array' }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Messages are required');
    });

    it('应该验证 messages 不为空', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Messages are required');
    });

    it('应该验证 message 格式正确', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ invalid: 'message' }],
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid message format');
    });

    it('应该验证 message role 是有效值', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'invalid', content: 'test' }],
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid message format');
    });

    it('应该成功处理有效的请求并返回 ReadableStream', async () => {
      // Mock streamText to return a mock result
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Hello'));
          controller.close();
        },
      });

      const mockToDataStreamResponse = vi.fn().mockReturnValue(
        new Response(mockStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        })
      );

      vi.mocked(streamText).mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse,
      } as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello!' },
          ],
        }),
      });

      const response = await POST(request);
      
      // Verify streamText was called with correct parameters
      expect(streamText).toHaveBeenCalledWith({
        model: expect.any(Object),
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' },
        ],
        temperature: 0.7,
        maxTokens: 2000,
      });

      // Verify response is a streaming response
      expect(response.body).toBeInstanceOf(ReadableStream);
    });

    it('应该支持自定义模型参数', async () => {
      const mockToDataStreamResponse = vi.fn().mockReturnValue(
        new Response(new ReadableStream(), { status: 200 })
      );

      vi.mocked(streamText).mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse,
      } as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello!' }],
          model: 'gpt-4o',
          temperature: 0.5,
          maxTokens: 1000,
        }),
      });

      await POST(request);
      
      // Verify streamText was called with custom parameters
      expect(streamText).toHaveBeenCalledWith({
        model: expect.any(Object),
        messages: [{ role: 'user', content: 'Hello!' }],
        temperature: 0.5,
        maxTokens: 1000,
      });
    });

    it('应该在发生错误时返回 500', async () => {
      vi.mocked(streamText).mockRejectedValue(new Error('AI Service Error'));

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello!' }],
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('AI Service Error');
    });

    it('应该支持 assistant 角色的消息', async () => {
      const mockToDataStreamResponse = vi.fn().mockReturnValue(
        new Response(new ReadableStream(), { status: 200 })
      );

      vi.mocked(streamText).mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse,
      } as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello!' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How are you?' },
          ],
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'Hello!' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How are you?' },
          ],
        })
      );
    });
  });
});
