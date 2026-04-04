import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPanel from '../../../src/components/chat/ChatPanel';


describe('ChatPanel Component', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  it('should render message list', () => {
    const messages = [
      { id: '1', role: 'user' as const, content: 'Hello' },
      { id: '2', role: 'assistant' as const, content: 'Hi there!' },
    ];

    render(<ChatPanel messages={messages} />);

    const messageList = screen.getByTestId('message-list');
    expect(messageList).toBeInTheDocument();

    const userMessage = screen.getByTestId('message-user');
    const assistantMessage = screen.getByTestId('message-assistant');

    expect(userMessage).toHaveTextContent('Hello');
    expect(assistantMessage).toHaveTextContent('Hi there!');
  });

  it('should render empty message list with placeholder', () => {
    render(<ChatPanel messages={[]} />);

    const messageList = screen.getByTestId('message-list');
    expect(messageList).toBeInTheDocument();
    // 当消息为空时，组件会显示提示信息，所以 children.length 应该是 1
    expect(messageList.children.length).toBe(1);
    
    // 验证提示信息存在
    const placeholder = screen.getByText('发送消息开始对话');
    expect(placeholder).toBeInTheDocument();
  });

  it('should call onSendMessage when send button is clicked', () => {
    const onSendMessage = vi.fn();
    render(<ChatPanel onSendMessage={onSendMessage} />);

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(onSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should clear input after sending message', () => {
    const onSendMessage = vi.fn();
    render(<ChatPanel onSendMessage={onSendMessage} />);

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(input).toHaveValue('');
  });

  it('should not call onSendMessage when input is empty', () => {
    const onSendMessage = vi.fn();
    render(<ChatPanel onSendMessage={onSendMessage} />);

    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('should render model selector with default value', () => {
    render(<ChatPanel selectedModel="gpt-4" />);

    const modelSelector = screen.getByTestId('model-selector');
    expect(modelSelector).toBeInTheDocument();
    expect(modelSelector).toHaveValue('gpt-4');
  });

  it('should call onModelChange when model is changed', () => {
    const onModelChange = vi.fn();
    render(<ChatPanel selectedModel="gpt-4" onModelChange={onModelChange} />);

    const modelSelector = screen.getByTestId('model-selector');
    fireEvent.change(modelSelector, { target: { value: 'claude' } });

    expect(onModelChange).toHaveBeenCalledWith('claude');
  });

  it('should display all available models in selector', () => {
    render(<ChatPanel />);

    const modelSelector = screen.getByTestId('model-selector');
    const options = modelSelector.querySelectorAll('option');

    expect(options.length).toBe(3);
    expect(options[0]).toHaveValue('gpt-4');
    expect(options[1]).toHaveValue('gpt-3.5');
    expect(options[2]).toHaveValue('claude');
  });

  it('should render message input field', () => {
    render(<ChatPanel />);

    const input = screen.getByTestId('message-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '输入消息...');
  });

  it('should render send button', () => {
    render(<ChatPanel />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveTextContent('发送');
  });
});
