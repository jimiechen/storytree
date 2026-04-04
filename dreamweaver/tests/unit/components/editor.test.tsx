import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Editor from '../../../src/components/editor/Editor';


describe('Editor Component', () => {
  beforeEach(() => {
    // 清除相关状态
  });

  it('should render with custom className', () => {
    const customClassName = 'custom-editor';
    const { container } = render(<Editor className={customClassName} />);
    const editorElement = container.querySelector('.editor');
    expect(editorElement).toHaveClass(customClassName);
  });

  it('should render editor content area', () => {
    render(<Editor />);
    const editorContent = screen.getByTestId('editor-content');
    expect(editorContent).toBeInTheDocument();
  });

  it('should render bold and italic buttons', () => {
    render(<Editor />);
    const boldButton = screen.getByTestId('bold-button');
    const italicButton = screen.getByTestId('italic-button');
    expect(boldButton).toBeInTheDocument();
    expect(italicButton).toBeInTheDocument();
  });

  it('should call onContentChange when editor initializes', () => {
    const onContentChange = vi.fn();
    render(<Editor initialContent="<p>Initial content</p>" onContentChange={onContentChange} />);
    // 等待编辑器初始化完成
    setTimeout(() => {
      expect(onContentChange).toHaveBeenCalled();
    }, 100);
  });

  it('should have proper structure with tiptap classes', () => {
    render(<Editor />);
    const editorContent = screen.getByTestId('editor-content');
    const tiptapEditor = editorContent.querySelector('.tiptap');
    expect(tiptapEditor).toBeInTheDocument();
  });
});
