'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePost } from '@/app/actions/admin-posts';
import type { Category } from '@/app/lib/definitions';
import ActionButton from '@/app/components/ActionButton';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import RichTextEditor from '@/app/components/RichTextEditor';

export default function EditPostForm({
  postId,
  categories,
  initialForm,
}: {
  postId: number;
  categories: Category[];
  initialForm: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    status: string;
    featured_photo: string;
  };
}) {
  const [form, setForm] = useState(initialForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState(initialForm.featured_photo);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);

      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('postId', postId.toString());

          const uploadRes = await fetch('/api/admin/posts/upload-photo', {
            method: 'POST',
            body: formData
          });

          if (!uploadRes.ok) throw new Error('Upload failed');

          const data = await uploadRes.json();
          setForm(prev => ({ ...prev, featured_photo: data.url }));
        } catch {
          console.error('Photo upload failed');
        }
      });
    }
  };

  const handleDeletePhoto = () => {
    setForm(prev => ({ ...prev, featured_photo: '' }));
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestorePhoto = () => {
    setForm(prev => ({ ...prev, featured_photo: originalPhoto }));
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await updatePost(postId, form);
        router.push('/admin/posts');
      } catch {
        console.error('Update failed');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label htmlFor="title">Title:</label>
      <input
        id="title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Enter post title"
        required
      />

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

      <label>Content:</label>
      <RichTextEditor
        value={form.content}
        onChange={(value) => setForm(prev => ({ ...prev, content: value }))}
      />

      <label>Category:</label>
      <select name="category" value={form.category} onChange={handleChange}>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>{cat.name}</option>
        ))}
      </select>

      <label>Status:</label>
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="declined">Declined</option>
      </select>

      <label>Current Photo:</label>
      <div className="image-wrapper">
        <ImageWithFallback
          src={photoFile ? URL.createObjectURL(photoFile) : form.featured_photo}
          alt="Post photo preview"
          imageType="bike"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ActionButton type="button" onClick={handleRestorePhoto}>Restore Original Photo</ActionButton>
        <ActionButton type="button" onClick={handleDeletePhoto}>Delete Photo</ActionButton>
      </div>

      <input type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} />

      <ActionButton type="submit" loading={isPending}>Save</ActionButton>
    </form>
  );
}
