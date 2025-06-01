'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ActionButton from '@/app/components/ActionButton';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import RichTextEditor from '@/app/components/RichTextEditor';
import ImageCropModal from '@/app/components/ImageCropModal';

let previewWindow: Window | null = null;

interface CreatePostFormProps {
  categories: { id: number; name: string }[];
}

export default function CreatePostForm({ categories }: CreatePostFormProps) {
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category_id: categories[0]?.id.toString() || '1',
    featured_photo: '/uploads/posts/default.jpg',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const [excerptCount, setExcerptCount] = useState(0);
  const [titleCount, setTitleCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      sendPreviewData(updated);
      return updated;
    });
    if (name === 'excerpt') setExcerptCount(value.length);
    if (name === 'title') setTitleCount(value.length);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setShowCropper(true);
    }
  };

  const handleDeletePhoto = () => {
    setForm(prev => {
      const updated = { ...prev, featured_photo: '/uploads/posts/default.jpg' };
      sendPreviewData(updated);
      return updated;
    });
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContentChange = (value: string) => {
    setForm(prev => {
      const updated = { ...prev, content: value };
      sendPreviewData(updated);
      return updated;
    });
    setContentCount(value.length);
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

        const res = await fetch('/api/user/posts/create', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        console.log('📦 CreatePost response:', data);

        if (!res.ok) throw new Error(data.error || 'Unknown error');
        router.refresh();
        router.push('/user');
      } catch (err) {
        console.error('🛑 CreatePost error:', err);
      }
    });
  };

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
            id: 0,
            slug: 'live-preview',
            created_at: new Date().toISOString(),
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

      <ActionButton type="button" onClick={openLivePreview}>Live Preview</ActionButton>

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
          src={form.featured_photo || '/uploads/posts/default.jpg'}
          alt="Post photo preview"
          imageType="bike"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ActionButton type="button" onClick={handleDeletePhoto}>Delete Photo</ActionButton>
      </div>

      <input type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} />

      <ActionButton type="submit" loading={isPending}>Create Post</ActionButton>

      {showCropper && photoFile && (
        <ImageCropModal
          file={photoFile}
          onClose={() => setShowCropper(false)}
          onUploadSuccess={(url) => {
            setForm(prev => {
              const updated = { ...prev, featured_photo: url };
              sendPreviewData(updated);
              return updated;
            });
            setPhotoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      )}
    </form>
  );
}