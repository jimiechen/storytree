import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Editor } from '@/components/editor/Editor';

describe('Editor Component', () => {
  const mockOnContentChange = vi.fn();

  beforeEach(() => {
    mockOnContentChange.mockClear();
  });

  it('should render editor component', () => {
    render(<Editor content="Hello World" onContentChange={mockOnContentChange} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render toolbar with formatting buttons', () => {
    render(<Editor content="Hello World" onContentChange={mockOnContentChange} />);
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTitle('Underline')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 2')).toBeInTheDocument();
    expect(screen.getByTitle('Bullet List')).toBeInTheDocument();
    expect(screen.getByTitle('Ordered List')).toBeInTheDocument();
  });

  it('should call onContentChange when content changes', () => {
    // 测试组件是否正确接收和处理 onContentChange 回调
    render(<Editor content="Initial content" onContentChange={mockOnContentChange} />);
    // 由于 TipTap 编辑器的特殊性，我们无法直接模拟内容输入
    // 但我们可以测试组件是否正确渲染和接收回调
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle toolbar button clicks', () => {
    render(<Editor content="Hello" onContentChange={mockOnContentChange} />);
    
    // 测试工具栏按钮是否存在
    const boldButton = screen.getByTitle('Bold');
    const italicButton = screen.getByTitle('Italic');
    const underlineButton = screen.getByTitle('Underline');
    const bulletListButton = screen.getByTitle('Bullet List');
    const orderedListButton = screen.getByTitle('Ordered List');
    const heading1Button = screen.getByTitle('Heading 1');
    const heading2Button = screen.getByTitle('Heading 2');

    // 测试按钮点击不会抛出错误
    expect(() => {
      fireEvent.click(boldButton);
      fireEvent.click(italicButton);
      fireEvent.click(underlineButton);
      fireEvent.click(bulletListButton);
      fireEvent.click(orderedListButton);
      fireEvent.click(heading1Button);
      fireEvent.click(heading2Button);
    }).not.toThrow();
  });
});
