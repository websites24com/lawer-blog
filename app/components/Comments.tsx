'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

import ImageWithFallback from '@/app/components/ImageWithFallback';
import FancyDate from '@/app/components/FancyDate';
import TimeFromDate from '@/app/components/TimeFromDate';
import ActionButton from '@/app/components/ActionButton';
import type { Comment, SimpleUser } from '@/app/lib/definitions';

type CommentWithUser = Comment & {
  user: SimpleUser;
  replies: CommentWithUser[];
};

type Props = {
  comments: CommentWithUser[];
};

export default function Comments({ comments: initialComments }: Props) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: session } = useSession();

  const handleReplySubmit = async (parentId: number) => {
    if (!replyContent.trim() || !session?.user) return;

    const viewer = session.user;

    const fakeReply: CommentWithUser = {
      id: Date.now(),
      content: replyContent,
      created_at: new Date().toISOString(),
      user: {
        id: viewer.id,
        first_name: viewer.first_name,
        last_name: viewer.last_name,
        avatar_url: viewer.avatar_url || '/uploads/avatars/default.jpg',
        email: viewer.email,
        role: viewer.role,
        status: 'approved',
        provider: viewer.provider,
        provider_account_id: viewer.provider_account_id,
        created_at: viewer.created_at,
      },
      replies: [],
    };

    const updated = comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, fakeReply],
        };
      }
      return comment;
    });

    setComments(updated);
    setReplyingTo(null);
    setReplyContent('');
  };

  const renderComment = (comment: CommentWithUser, level = 0) => {
    const user = comment.user;

    // ✅ Final fixed avatar URL resolution
    const avatarUrl =
      user?.avatar_url && user.avatar_url.trim() !== ''
        ? user.avatar_url.startsWith('http') || user.avatar_url.startsWith('/uploads/')
          ? user.avatar_url
          : `/uploads/avatars/${user.avatar_url}`
        : '/uploads/avatars/default.jpg';

    const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`;

    console.log('🧠 Avatar debug:', {
      id: comment.id,
      fullName,
      avatarUrl,
    });

    return (
      <div key={comment.id} className="comment" style={{ marginLeft: `${level * 2}rem` }}>
        <div className="comment-body" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="image-wrapper-avatar">
            <ImageWithFallback
              src={avatarUrl}
              fallbackSrc="/uploads/avatars/default.jpg"
              imageType="avatar"
              alt={`${fullName}'s avatar`}
            />
          </div>

          <div className="comment-content">
            <div className="comment-meta">
              <strong>{fullName}</strong>
              <span className="comment-time" style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                <FancyDate dateString={comment.created_at} /> • <TimeFromDate date={comment.created_at} />
              </span>
            </div>

            <p className="comment-message">
              {comment.content || <em style={{ color: 'red' }}>No content</em>}
            </p>

            <div className="comment-actions" style={{ marginTop: '0.5rem' }}>
              <ActionButton
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                title="Reply to this comment"
              >
                ↪️ Reply
              </ActionButton>
            </div>

            {replyingTo === comment.id && (
              <div className="comment-reply-form" style={{ marginTop: '0.75rem' }}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                  }}
                  placeholder="Write your reply..."
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <ActionButton onClick={() => handleReplySubmit(comment.id)} title="Submit your reply">
                    💬 Submit Reply
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.replies.length > 0 && (
          <div className="comment-children">
            {comment.replies.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
