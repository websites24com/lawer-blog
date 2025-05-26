'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/app/lib/definitions';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/ActionButton';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import RichTextEditor from '@/app/components/RichTextEditor';

interface EditPostFormProps {
  postId: number;
  categories: Category[];
  initialForm: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    status: 'pending' | 'approved' | 'draft' | 'declined';
    featured_photo: string;
  };
}

export default function EditPostForm({ postId, categories: initialCategories, initialForm }: EditPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        let photoUrl = form.featured_photo;

        if (newImage) {
          const formData = new FormData();
          formData.append('image', newImage);
          formData.append('postId', postId.toString());

          const uploadRes = await fetch('/api/admin/posts/upload-photo', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) throw new Error('Upload failed');
          const data = await uploadRes.json();
          photoUrl = data.url;
        }

        const updateRes = await fetch('/api/admin/posts/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: postId,
            title: form.title,
            excerpt: form.excerpt,
            content: form.content,
            category: form.category,
            status: form.status,
            featured_photo: photoUrl,
          }),
        });

        if (!updateRes.ok) throw new Error('Post update failed');

        toast.success('Post updated');
        router.push('/admin/posts');
      } catch (error) {
        console.error(error);
        toast.error('Update failed');
      }
    });
  };

  const createCategory = async () => {
    try {
      const res = await fetch('/api/admin/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!res.ok) throw new Error('Failed to create category');

      const created = await res.json();
      setCategories((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, category: created.name }));
      setShowModal(false);
      setNewCategoryName('');
      toast.success('Category added');
    } catch {
      toast.error('Failed to add category');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
      <textarea name="excerpt" value={form.excerpt} onChange={handleChange} placeholder="Excerpt" required />

      <label>Content:</label>
      <RichTextEditor
        value={form.content}
        onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
      />

      <label>Category:</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select name="category" value={form.category} onChange={handleChange} required>
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setShowModal(true)}>
          + New Category
        </button>
      </div>

      {showModal && (
        <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '0.5rem' }}>
          <label>New Category Name:</label>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name"
          />
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={createCategory}>
              Save
            </button>
            <button type="button" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <label>Status:</label>
      <select name="status" value={form.status} onChange={handleChange} required>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="draft">Draft</option>
        <option value="declined">Declined</option>
      </select>

      <label>Current Featured Photo:</label>
      <div style={{ width: '200px', height: '120px', position: 'relative' }}>
        <ImageWithFallback
          src={form.featured_photo}
          alt="Current Featured Photo"
          imageType="bike"
          className=""
          wrapperClassName=""
        />
      </div>

      <label>Upload New Photo:</label>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <ActionButton type="submit" loading={isPending}>
  Save Changes
</ActionButton>

    </form>
  );
}
