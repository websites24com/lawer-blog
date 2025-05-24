'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './RichTextEditor.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    // ✅ Prevent hydration mismatch
    autofocus: false,
    editable: true,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm',
      },
    },
    // ✅ Most important fix
    immediatelyRender: false,
  });

  if (!editor) return <div>Loading editor…</div>;

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        {/* MARKS */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>Strike</button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''}>Code (inline)</button>

        {/* NODES */}
        <button onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'is-active' : ''}>Paragraph</button>

        {Array.from({ length: 6 }).map((_, i) => {
          const level = i + 1;
          return (
            <button
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
              className={editor.isActive('heading', { level }) ? 'is-active' : ''}
            >
              H{level}
            </button>
          );
        })}

        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>1. List</button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>Quote</button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''}>Code Block</button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>HR</button>
        <button onClick={() => editor.chain().focus().setHardBreak().run()}>Line Break</button>

        {/* HISTORY */}
        <button onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button onClick={() => editor.chain().focus().redo().run()}>Redo</button>

        {/* CLEAR */}
        <button onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>Clear</button>
      </div>

      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
