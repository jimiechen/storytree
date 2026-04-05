import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPanel from '@/components/chat/ChatPanel';

describe('ChatPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render message list', () => {
    const mockMessages = [
      {
        id: '1',
        content: 'Hello, how can I help?',
        role: 'assistant' as const,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        content: 'I need help with my story',
        role: 'user' as const,
        timestamp: new Date().toISOString(),
      },
    ];

    render(<ChatPanel messages={mockMessages} onSendMessage={vi.fn()} onModelChange={vi.fn()} model="gpt-3.5-turbo" />);

    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('I need help with my story')).toBeInTheDocument();
  });

  it('should send message when form is submitted', () => {
    const mockOnSendMessage = vi.fn();
    const mockMessages = [];

    render(
      <ChatPanel 
        messages={mockMessages} 
        onSendMessage={mockOnSendMessage} 
        onModelChange={vi.fn()} 
        model="gpt-3.5-turbo" 
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should change model when select is changed', () => {
    const mockOnModelChange = vi.fn();
    const mockMessages = [];

    render(
      <ChatPanel 
        messages={mockMessages} 
        onSendMessage={vi.fn()} 
        onModelChange={mockOnModelChange} 
        model="gpt-3.5-turbo" 
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'gpt-4' } });

    expect(mockOnModelChange).toHaveBeenCalledWith('gpt-4');
  });

  it('should clear input after sending message', () => {
    const mockOnSendMessage = vi.fn();
    const mockMessages = [];

    render(
      <ChatPanel 
        messages={mockMessages} 
        onSendMessage={mockOnSendMessage} 
        onModelChange={vi.fn()} 
        model="gpt-3.5-turbo" 
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(input).toHaveValue('');
  });
});
