'use client';

import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import type { PostWithDetails } from '@/app/lib/definitions';

export default function PostContent({ post }: { post: PostWithDetails }) {
  return (
    <main className="post-page">
      <h1>{post.title}</h1>

      <div className="post-meta">
        <ImageWithFallback
          src={post.user.avatar_url}
          alt={`${post.user.first_name} ${post.user.last_name}`}
          imageType="avatar"
        />
        <div className="post-meta-author">
          <p>{post.user.first_name} {post.user.last_name}</p>
          <p>{new Date(post.created_at).toLocaleDateString()} • {post.category}</p>
        </div>
      </div>

      <div className="post-image">
        <ImageWithFallback
          src={post.featured_photo}
          alt="Featured Post"
          imageType="bike"
        />
      </div>

      <article dangerouslySetInnerHTML={{ __html: post.content }} />

      <section className="post-comments">
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