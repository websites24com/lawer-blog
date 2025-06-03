'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import ActionButton from '@/app/components/ActionButton';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import RichTextEditor from '@/app/components/RichTextEditor';
import ImageCropModal from '@/app/components/ImageCropModal';

import type { PostWithDetails, Category } from '@/app/lib/definitions';

let previewWindow: Window | null = null;

type Props = {
  post: PostWithDetails;
  categories: Category[];
};

export default function EditPostForm({ post, categories }: Props) {
  // State for post form fields
  const [form, setForm] = useState({
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category_id: post.category_id.toString(),
    featured_photo: post.featured_photo || '/uploads/posts/default.jpg',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [titleCount, setTitleCount] = useState(post.title.length);
  const [excerptCount, setExcerptCount] = useState(post.excerpt.length);
  const [contentCount, setContentCount] = useState(post.content.length);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  // Handle text input changes (title, excerpt, category)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      sendPreviewData(updated);
      return updated;
    });

    if (name === 'title') setTitleCount(value.length);
    if (name === 'excerpt') setExcerptCount(value.length);
  };

  // Update content field and live preview
  const handleContentChange = (value: string) => {
    setForm((prev) => {
      const updated = { ...prev, content: value };
      sendPreviewData(updated);
      return updated;
    });
    setContentCount(value.length);
  };

  // Handle new photo file upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setShowCropper(true);
    }
  };

  // Reset photo to fallback and clear file input
  const handleDeletePhoto = () => {
    setForm((prev) => {
      const updated = { ...prev, featured_photo: '/uploads/posts/default.jpg' };
      sendPreviewData(updated);
      return updated;
    });

    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Main form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        // 🧹 Step 1: Remove deleted TipTap editor images
        await fetch('/api/user/posts/editor/cleanup-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldContent: post.content,
            newContent: form.content,
          }),
        });

        // 📝 Step 2: Update post data (including optional photo)
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('excerpt', form.excerpt);
        formData.append('content', form.content);
        formData.append('category_id', form.category_id);
        formData.append('old_photo', post.featured_photo || '');
        formData.append('featured_photo_url', form.featured_photo);

        if (fileInputRef.current?.files?.[0]) {
          formData.append('featured_photo', fileInputRef.current.files[0]);
        }

        const res = await fetch(`/api/user/posts/edit/${post.slug}`, {
          method: 'POST',
          body: formData,
        });

        const text = await res.text();
        let data: any = {};
        if (text.trim() !== '') data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || 'Failed to update post');

        // ✅ Step 3: Delete unused uploaded images (not in final content)
        await fetch('/api/user/posts/editor/cleanup-unused-uploaded-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: form.content }),
        });

        router.refresh();
        router.push('/user');
      } catch (err) {
        console.error('❌ Błąd podczas zapisu:', err);
      }
    });
  };

  // Live preview support
  const sendPreviewData = (customForm?: typeof form) => {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.postMessage(
        {
          type: 'preview-data',
          payload: {
            ...(customForm || form),
            id: post.id,
            slug: post.slug,
            created_at: post.created_at,
            updated_at: new Date().toISOString(),
            user: post.user,
            comments: post.comments,
            followed_by_current_user: false,
          },
        },
        window.location.origin
      );
    }
  };

  const openLivePreview = () => {
    if (!previewWindow || previewWindow.closed) {
      previewWindow = window.open('/blog/posts/preview', 'livePreview', 'width=1024,height=800');
    } else {
      sendPreviewData();
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === 'ready-for-preview') {
        setIsPreviewReady(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isPreviewReady) sendPreviewData();
  }, [form, isPreviewReady]);

  // === JSX FORM ===
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label htmlFor="title">Title:</label>
      <input
        id="title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="SEO-friendly title (max 70 characters)"
        maxLength={70}
        required
      />
      <small style={{ alignSelf: 'flex-end' }}>{titleCount}/70</small>

      <label htmlFor="excerpt">Excerpt:</label>
      <textarea
        id="excerpt"
        name="excerpt"
        value={form.excerpt}
        onChange={handleChange}
        placeholder="Brief excerpt (max 300 characters)"
        maxLength={300}
        required
      />
      <small style={{ alignSelf: 'flex-end' }}>{excerptCount}/300</small>

      <label htmlFor="content">Content:</label>
      <RichTextEditor value={form.content} onChange={handleContentChange} />
      <small style={{ alignSelf: 'flex-end' }}>{contentCount}/10000</small>

      <label>Category:</label>
      <select name="category_id" value={form.category_id} onChange={handleChange}>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      <label>Current Photo:</label>
      <div className="image-wrapper">
        <ImageWithFallback
          key={form.featured_photo}
          src={form.featured_photo}
          alt="Post photo preview"
          imageType="bike"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ActionButton type="button" onClick={handleDeletePhoto}>Delete Photo</ActionButton>
      </div>

      <input type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} />
      <ActionButton type="button" onClick={openLivePreview}>Live Preview</ActionButton>
      <ActionButton type="submit" loading={isPending}>Update Post</ActionButton>

      {showCropper && photoFile && (
        <ImageCropModal
          file={photoFile}
          onClose={() => setShowCropper(false)}
          onUploadSuccess={(url) => {
            setForm((prev) => {
              const updated = { ...prev, featured_photo: url };
              sendPreviewData(updated);
              return updated;
            });
            setPhotoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          currentPhotoUrl={form.featured_photo}
        />
      )}
    </form>
  );
}
