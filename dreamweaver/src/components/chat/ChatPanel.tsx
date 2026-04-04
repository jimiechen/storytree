import React, { useState, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages = [],
  onSendMessage,
  selectedModel = 'gpt-4',
  onModelChange,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = useCallback(() => {
    if (onSendMessage && inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  }, [inputValue, onSendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className={`chat-panel h-full flex flex-col ${className}`}>
      {/* 面板头部 */}
      <div className="chat-header p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">AI 助手</h2>
        <select
          data-testid="model-selector"
          value={selectedModel}
          onChange={(e) => onModelChange?.(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5">GPT-3.5</option>
          <option value="claude">Claude</option>
        </select>
      </div>

      {/* 消息列表 */}
      <div
        data-testid="message-list"
        className="message-list flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>发送消息开始对话</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              data-testid={`message-${message.role}`}
              className={`message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                <p>{message.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 输入区域 */}
      <div className="chat-input p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            data-testid="message-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            data-testid="send-button"
            onClick={handleSend}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!inputValue.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
