'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Typography from '@tiptap/extension-typography';
import { useEffect, useRef, useState } from 'react';
import ImageCropModal from '@/app/components/ImageCropModal';
import ImageMetaModal from '@/app/components/ImageMetaModal';

type Props = {
  value: string;
  onChange: (value: string) => void;
  // ✅ Optional tracking for TipTap image uploads
  onImageUpload?: (url: string) => void;
};

export default function RichTextEditor({ value, onChange, onImageUpload }: Props) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingCroppedUrl, setPendingCroppedUrl] = useState<string | null>(null);
  const [showMetaModal, setShowMetaModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Image.configure({ inline: false }).extend({
        addAttributes() {
          return {
            src: {},
            alt: { default: null },
            title: { default: null },
            class: {
              default: 'responsive-centered-image',
              rendered: true,
              parseHTML: (element) => element.getAttribute('class'),
            },
          };
        },
        renderHTML({ HTMLAttributes }) {
          return ['img', HTMLAttributes];
        },
      }),
      TaskList,
      TaskItem,
      Underline,
      Highlight,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    autofocus: false,
    editorProps: {
      attributes: { class: 'prose prose-sm' },
    },
    onCreate: () => setIsEditorReady(true),
  });

  useEffect(() => {
    if (editor && isEditorReady && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value, isEditorReady]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 3 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('❌ Unsupported file type. Please use JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('❌ File too large. Maximum size is 3MB.');
      return;
    }

    setPendingFile(file);
    setShowCropper(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCroppedImageUpload = (url: string) => {
    setPendingCroppedUrl(url);
    setShowMetaModal(true);

    // ✅ Track uploaded image (used in EditPostForm)
    if (onImageUpload) {
      onImageUpload(url);
    }
  };

  const handleInsertWithMeta = (alt: string, title: string) => {
    if (pendingCroppedUrl && editor) {
      editor
        .chain()
        .focus()
        .setImage({
          src: pendingCroppedUrl,
          class: 'responsive-centered-image',
          alt: alt || null,
          title: title || null,
        })
        .run();
    }

    setPendingCroppedUrl(null);
    setShowMetaModal(false);
  };

  if (!editor) return <div>Loading editor…</div>;

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}>Strike</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()}>Code</button>
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}>Paragraph</button>
        {[1, 2, 3, 4, 5, 6].map(level => (
          <button key={level} type="button" onClick={() => editor.chain().focus().toggleHeading({ level }).run()}>H{level}</button>
        ))}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()}>☑ Task List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code Block</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>HR</button>
        <button type="button" onClick={() => editor.chain().focus().setHardBreak().run()}>Line Break</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}>Redo</button>
        <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>Clear</button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>Upload Image</button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
        <button type="button" onClick={() => {
          const url = window.prompt('Enter URL');
          if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}>Add Link</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()}>Left</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()}>Center</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()}>Right</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()}>Justify</button>
      </div>

      <EditorContent editor={editor} className="editor-content" />

      {showCropper && pendingFile && (
        <ImageCropModal
          file={pendingFile}
          onClose={() => {
            setShowCropper(false);
            setPendingFile(null);
          }}
          onUploadSuccess={(url) => {
            handleCroppedImageUpload(url);
            setPendingFile(null);
            setShowCropper(false);
          }}
          currentPhotoUrl="/uploads/posts/default.jpg"
        />
      )}

      {showMetaModal && pendingCroppedUrl && (
        <ImageMetaModal
          imageUrl={pendingCroppedUrl}
          onCancel={() => {
            setShowMetaModal(false);
            setPendingCroppedUrl(null);
          }}
          onConfirm={handleInsertWithMeta}
        />
      )}
    </div>
  );
}
