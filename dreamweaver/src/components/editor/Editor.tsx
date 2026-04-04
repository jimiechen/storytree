import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  className?: string;
}

export const Editor: React.FC<EditorProps> = ({
  initialContent = '',
  onContentChange,
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
    ],
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
  });

  return (
    <div className={`editor ${className}`}>
      <div className="editor-toolbar mb-2 flex gap-2">
        <button
          data-testid="bold-button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded ${editor?.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
        >
          B
        </button>
        <button
          data-testid="italic-button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded ${editor?.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
        >
          I
        </button>
      </div>
      <div 
        data-testid="editor-content"
        className="border border-gray-300 rounded p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Editor;
