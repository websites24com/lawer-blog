'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import ImageWithFallback from '@/app/components/ImageWithFallback';
import RichTextEditor from '@/app/components/RichTextEditor';
import ImageCropModal from '@/app/components/ImageCropModal';
import ActionButton from '@/app/components/ActionButton';

import type { PostWithDetails, Category } from '@/app/lib/definitions';

type Props = {
  post: PostWithDetails;
  categories: Category[];
};

export default function EditPostForm({ post, categories }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category_id: post.category_id.toString(),
    featured_photo: post.featured_photo || '/uploads/posts/default.jpg',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value: string) => {
    setForm(prev => ({ ...prev, content: value }));
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
        setForm(prev => ({ ...prev, featured_photo: '/uploads/posts/default.jpg' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error('Delete failed');
      }
    } catch (err) {
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

        const res = await fetch(`/api/user/posts/edit/${post.slug}`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error();

        // ✅ CLEANUP AFTER SUCCESSFUL EDIT
        await fetch('/api/user/posts/editor/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: form.content,
            featured: form.featured_photo,
          }),
        });

        toast.success('Post updated');
        router.refresh();
        router.push('/user');
      } catch {
        toast.error('Update failed');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        maxLength={70}
        required
      />
      <textarea
        name="excerpt"
        value={form.excerpt}
        onChange={handleChange}
        placeholder="Excerpt"
        maxLength={300}
        required
      />
      <RichTextEditor value={form.content} onChange={handleContentChange} />
      <select name="category_id" value={form.category_id} onChange={handleChange}>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <ImageWithFallback
        src={form.featured_photo}
        alt="Featured photo"
        imageType="bike"
      />
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        ref={fileInputRef}
      />
      <ActionButton type="button" onClick={handleDeletePhoto}>
        Delete Photo
      </ActionButton>
      <ActionButton type="submit" loading={isPending}>
        Update
      </ActionButton>

      {showCropper && photoFile && (
        <ImageCropModal
          file={photoFile}
          onClose={() => setShowCropper(false)}
          onUploadSuccess={(url) => {
            setForm(prev => ({ ...prev, featured_photo: url }));
            setPhotoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          currentPhotoUrl={form.featured_photo}
        />
      )}
    </form>
  );
}
