'use client';

import { useEffect, useState } from 'react';
import type { PostWithDetails } from '@/app/lib/definitions';
import PostContent from '@/app/components/blog/posts/PostContent';

export default function LivePreviewPage() {
  const [post, setPost] = useState<PostWithDetails | null>(null);

  // Tell opener that this preview window is ready
  useEffect(() => {
    window.opener?.postMessage({ type: 'ready-for-preview' }, window.location.origin);
  }, []);

  // Receive preview post data
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === 'preview-data'
      ) {
        const data = event.data.payload;

        const fullPost: PostWithDetails = {
          ...data,
          user: {
            first_name: 'Preview',
            last_name: 'User',
            avatar_url: '/uploads/avatars/default.jpg',
          },
          created_at: new Date().toISOString(),
          comments: [],
        };

        setPost(fullPost);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!post) return <p>Waiting for preview data...</p>;

  return <PostContent post={post} />;
}
