'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Icon } from '@iconify/react';

import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import RichTextEditor from '@/app/components/global/RichTextEditor';
import ImageCropModal from '@/app/components/posts/images/ImageCropModal';
import ActionButton from '@/app/components/global/ActionButton';

import type { PostWithDetails, Category } from '@/app/lib/definitions';

let previewWindow: Window | null = null;

type Props = {
  post: PostWithDetails;
  categories: Category[];
};

export default function EditPostForm({ post, categories }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

  // Main form state
  const [form, setForm] = useState({
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category_id: post.category_id?.toString() || '',
    featured_photo: post.featured_photo || '/uploads/posts/default.jpg',
  });

  // UI State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [titleCount, setTitleCount] = useState(post.title.length);
  const [excerptCount, setExcerptCount] = useState(post.excerpt.length);
  const [contentCount, setContentCount] = useState(post.content.length);
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  // Live Preview sync
  const sendPreviewData = (customForm?: typeof form) => {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.postMessage(
        {
          type: 'preview-data',
          payload: {
            ...(customForm || form),
            user: {
              first_name: 'User',
              last_name: 'Preview',
              avatar_url: '/uploads/avatars/default.jpg',
            },
            comments: [],
            followed_by_current_user: false,
            id: post.id,
            slug: post.slug,
            created_at: post.created_at,
            updated_at: new Date().toISOString(),
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
    if (isPreviewReady) {
      sendPreviewData();
    }
  }, [form, isPreviewReady]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      sendPreviewData(updated);
      return updated;
    });

    if (name === 'title') setTitleCount(value.length);
    if (name === 'excerpt') setExcerptCount(value.length);
  };

  const handleContentChange = (value: string) => {
    setForm((prev) => {
      const updated = { ...prev, content: value };
      sendPreviewData(updated);
      return updated;
    });
    setContentCount(value.length);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setShowCropper(true);
    }
  };

  const handleDeletePhoto = async () => {
    if (form.featured_photo.includes('/default.jpg')) return;

    try {
      const res = await fetch('/api/user/posts/delete-photo', {
        method: 'POST',
        body: JSON.stringify({ photoPath: form.featured_photo }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        toast.success('Photo deleted');
        setForm((prev) => {
          const updated = { ...prev, featured_photo: '/uploads/posts/default.jpg' };
          sendPreviewData(updated);
          return updated;
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error('Delete failed');
      }
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Server error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('excerpt', form.excerpt);
        formData.append('content', form.content);
        formData.append('category_id', form.category_id);
        formData.append('featured_photo_url', form.featured_photo);
        formData.append('old_photo', post.featured_photo || '/uploads/posts/default.jpg');
        if (photoFile) formData.append('featured_photo', photoFile);

        if (previewWindow && !previewWindow.closed) previewWindow.close();

        const res = await fetch(`/api/user/posts/edit/${post.slug}`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error();

        toast.success('Post updated');
        router.refresh();
        router.push('/user');
      } catch {
        toast.error('Update failed');
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
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
        placeholder="Short excerpt (max 300 characters)"
        maxLength={300}
        required
      />
      <small style={{ alignSelf: 'flex-end' }}>{excerptCount}/300</small>

      <label htmlFor="content">Content:</label>
      <RichTextEditor value={form.content} onChange={handleContentChange} />
      <small style={{ alignSelf: 'flex-end' }}>{contentCount}/10000</small>

      <label>Category:</label>
      <select name="category_id" value={form.category_id} onChange={handleChange}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label>Current Photo:</label>
      <div className="image-wrapper">
        <ImageWithFallback
          key={form.featured_photo}
          src={form.featured_photo}
          alt="Featured photo"
          imageType="bike"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ActionButton type="button" onClick={handleDeletePhoto} title="Delete Photo" disabled={isPending}>
          <Icon icon="twemoji:wastebasket" width="20" height="20" /> Delete
        </ActionButton>
        <ActionButton type="button" onClick={openLivePreview} title="Live Preview" disabled={isPending}>
          <Icon icon="twemoji:eye" width="20" height="20" /> Preview
        </ActionButton>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        ref={fileInputRef}
        disabled={isPending}
      />

      <ActionButton type="submit" loading={isPending} disabled={isPending} title="Update Post">
        <Icon icon="twemoji:rocket" width="20" height="20" /> Update Post
      </ActionButton>

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
