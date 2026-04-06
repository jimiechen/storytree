'use client';

import { useState, useEffect } from 'react';
import { EditorContent, useEditor, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AIBubbleMenu } from './AIBubbleMenu';

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  projectId?: string;
}

export function Editor({ content, onContentChange, placeholder = '开始写作...', className = '', projectId }: EditorProps) {
  const [editorContent, setEditorContent] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: editorContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setEditorContent(newContent);
      onContentChange(newContent);
    },
  });

  useEffect(() => {
    if (content !== editorContent && editor) {
      editor.commands.setContent(content);
    }
  }, [content, editorContent, editor]);

  return (
    <div className="editor-container">
      {editor && (
        <>
          {/* AI Bubble Menu */}
          {projectId && (
            <AIBubbleMenu editor={editor} projectId={projectId} />
          )}
          
          <div className="toolbar flex flex-wrap gap-2 p-2 border-b">
            <button
              onClick={() => editor.commands.toggleBold()}
              className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => editor.commands.toggleItalic()}
              className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
              title="Italic"
            >
              I
            </button>
            <button
              onClick={() => editor.commands.toggleUnderline()}
              className={`px-2 py-1 rounded ${editor.isActive('underline') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
              title="Underline"
            >
              U
            </button>
            <button
              onClick={() => editor.commands.toggleHeading({ level: 1 })}
              className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.commands.toggleHeading({ level: 2 })}
              className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.commands.toggleBulletList()}
              className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
              title="Bullet List"
            >
              •
            </button>
            <button
              onClick={() => editor.commands.toggleOrderedList()}
              className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
              title="Ordered List"
            >
              1.
            </button>
          </div>
          <div className={`editor-content border rounded-b min-h-[300px] p-4 ${className}`} data-testid="editor-content">
            <EditorContent editor={editor} className="h-full outline-none prose max-w-none" />
          </div>
        </>
      )}
    </div>
  );
}
