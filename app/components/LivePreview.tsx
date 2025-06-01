'use client';

import { useEffect } from 'react';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import type { PostWithDetails } from '@/app/lib/definitions';

export default function LivePreview({ post }: { post: PostWithDetails }) {
  useEffect(() => {
    document.title = post.title;
  }, [post.title]);

  return (
    <main>
      <h1>{post.title}</h1>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ width: '50px', height: '50px', position: 'relative' }}>
          <ImageWithFallback
            src={post.user.avatar_url}
            fallbackSrc="/uploads/avatars/default.jpg"
            alt={`${post.user.first_name} ${post.user.last_name}`}
            imageType="avatar"
            className=""
            wrapperClassName=""
          />
        </div>
        <div>
          <p>{post.user.first_name} {post.user.last_name}</p>
          <p>{new Date(post.created_at).toLocaleDateString()} • {post.category}</p>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #ccc', padding: '1rem 0' }}>
        <div style={{ width: '100%', maxWidth: '400px', height: '200px', position: 'relative', marginTop: '1rem' }}>
          <ImageWithFallback
            src={post.featured_photo?.startsWith('/') ? post.featured_photo : `/uploads/posts/${post.featured_photo}`}
            fallbackSrc="/uploads/posts/default.jpg"
            alt="Featured Post"
            imageType="bike"
            className=""
            wrapperClassName=""
          />
        </div>
      </div>

      <article dangerouslySetInnerHTML={{ __html: post.content }} />

      <section>
        <h2>Comments</h2>
        {post.comments.length === 0 && <p>No comments yet.</p>}
        <ul>
          {post.comments.map((comment, idx) => (
            <li key={idx}>
              <p>{comment.name} ({comment.email || 'anonymous'})</p>
              <p>{comment.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
