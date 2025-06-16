// app/components/Comments.tsx

'use client';

import ImageWithFallback from '@/app/components/ImageWithFallback';
import FancyDate from '@/app/components/FancyDate';
import TimeFromDate from '@/app/components/TimeFromDate';
import type { Comment, SimpleUser } from '@/app/lib/definitions';

type CommentWithUser = Comment & {
  user: SimpleUser;
  replies: CommentWithUser[];
};

type Props = {
  comments: CommentWithUser[];
};

function renderComment(comment: CommentWithUser, level = 0) {
  console.log('🟢 Rendering comment:', comment);

  return (
    <div key={comment.id} className="comment" style={{ marginLeft: `${level * 2}rem` }}>
      <div className="comment-body" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {/* ✅ AVATAR WRAPPER */}
        <div className="image-wrapper-avatar">
          <ImageWithFallback
            src={comment.user?.avatar_url || ''}
            fallbackSrc="/uploads/avatars/default.jpg"
            imageType="avatar"
            alt={`${comment.user?.first_name} ${comment.user?.last_name}`}
          />
        </div>

        {/* ✅ CONTENT */}
        <div className="comment-content">
          <div className="comment-meta">
            <strong>{comment.user?.first_name} {comment.user?.last_name}</strong>
            <span className="comment-time" style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              <FancyDate dateString={comment.created_at} /> • <TimeFromDate date={comment.created_at} />
            </span>
          </div>

          {/* 🟥 LOG CONTENT */}
          <p className="comment-message">
            {comment.content || <em style={{ color: 'red' }}>No content</em>}
          </p>

          <div className="comment-actions" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="reply-button">↪️ Reply</button>
          </div>
        </div>
      </div>

      {/* ✅ RECURSIVE REPLIES */}
      {comment.replies.length > 0 && (
        <div className="comment-children">
          {comment.replies.map((reply) => renderComment(reply, level + 1))}
        </div>
      )}
    </div>
  );
}

export default function Comments({ comments }: Props) {
  console.log('🔵 Loaded comments:', comments);

  return (
    <section className="comments-section" style={{ padding: '1rem' }}>
      <h2>💬 Comments</h2>
      {comments.length === 0 ? (
        <p>No comments yet. Be the first to comment!</p>
      ) : (
        <div className="comments-tree">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </section>
  );
}
