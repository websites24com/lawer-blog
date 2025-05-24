'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/app/actions/posts';
import toast from 'react-hot-toast';
import RichTextEditor from '@/app/components/RichTextEditor';

type Props = {
  categories: { id: number; name: string }[];
};

export default function ClientPostForm({ categories }: Props) {
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    formData.set('content', content);
    formData.set('excerpt', excerpt);
    if (photoFile) {
      formData.set('featured_photo', photoFile);
    }

    const toastId = toast.loading('Creating post...');

    try {
      await createPost(formData);
      toast.dismiss(toastId);
      toast.success('✅ Post submitted and is pending admin/moderator approval', {
        duration: 4000,
      });
      setTimeout(() => {
        router.push('/blog');
      }, 4200);
    } catch (err) {
      console.error('❌ Post creation failed:', err);
      toast.dismiss(toastId);
      toast.error('❌ Failed to create post', {
        duration: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title:
        <input name="title" type="text" required />
      </label>

      <label>
        Content:
        <RichTextEditor value={content} onChange={setContent} />
      </label>

      <label>
        Category:
        <select name="category_id" required>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Excerpt:
        <textarea
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Write a short summary of the post (max 300 characters)"
          required
        />
      </label>

      <label>
        Featured Photo:
        <input
          name="featured_photo"
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setPhotoFile(e.target.files[0]);
            }
          }}
        />
      </label>

      <button type="submit">Create Post</button>
    </form>
  );
}
