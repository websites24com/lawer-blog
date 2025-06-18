'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

import Spinner from '@/app/components/Spinner';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import FancyDate from '@/app/components/FancyDate';
import TimeFromDate from '@/app/components/TimeFromDate';
import ActionButton from '@/app/components/ActionButton';
import CommentForm from '@/app/components/comments/CommentForm';
import CommentReplyForm from '@/app/components/comments/CommentReplyForm';
import CommentEditForm from '@/app/components/comments/CommentEditForm';

import type { Comment, SimpleUser } from '@/app/lib/definitions';

type CommentWithUser = Comment & {
  user: SimpleUser;
  replies: CommentWithUser[];
};

type Props = {
  comments: CommentWithUser[];
  postId: number;
};

export default function Comments({ comments: initialData, postId }: Props) {
  const { data: session } = useSession();
  const viewer = session?.user;
  const viewerId = viewer?.id || null;
  const viewerRole = viewer?.role || 'GUEST';
  const isAdminOrMod = viewerRole === 'ADMIN' || viewerRole === 'MODERATOR';

  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    setComments(initialData);
    setIsLoaded(true);
  }, [initialData]);

  const isVisible = (comment: CommentWithUser) =>
    comment.status === 'approved' || comment.user?.id === viewerId || isAdminOrMod;

  const getStatusLabel = (status: string) =>
    status === 'pending' ? '⏳ Pending' : status === 'declined' ? '❌ Declined' : '';

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments/list?post_id=${postId}`);
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setComments(updated);
    } catch {
      toast.error('Failed to refresh comments');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch('/api/comments/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Comment deleted');
      await fetchComments();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const renderComment = (comment: CommentWithUser, level = 0): JSX.Element | null => {
    if (!isVisible(comment)) return null;

    const isAuthor = comment.user?.id === viewerId;
    const isEditing = editingId === comment.id;
    const isReplying = replyingToId === comment.id;

    return (
      <div key={comment.id} style={{ marginLeft: `${level * 2}rem` }} className="comment-item">
        <div className="comment-body">
          <ImageWithFallback
            src={comment.user.avatar_url}
            fallbackSrc="/uploads/avatars/default.jpg"
            imageType="avatar"
            alt={`${comment.user.first_name} ${comment.user.last_name}`}
          />
          <div className="comment-content">
            <div className="comment-meta">
              <strong>{comment.user.first_name} {comment.user.last_name}</strong>
              <span> • <FancyDate dateString={comment.created_at} /></span>
              <span> • <TimeFromDate date={comment.created_at} /></span>
              {comment.edited_at && (
                <span> • edited <TimeFromDate date={comment.edited_at} /></span>
              )}
              {getStatusLabel(comment.status) && (
                <span className={`comment-status ${comment.status}`}>
                  • {getStatusLabel(comment.status)}
                </span>
              )}
            </div>

            {isEditing ? (
              <CommentEditForm
                commentId={comment.id}
                initialContent={comment.content}
                onCancel={() => setEditingId(null)}
                onSuccess={fetchComments}
              />
            ) : (
              <>
                <p>{comment.content}</p>
                <div className="comment-actions">
                  {viewer && (
                    <ActionButton onClick={() => {
                      setReplyingToId(comment.id);
                      setEditingId(null);
                    }}>
                      ↪️ Reply
                    </ActionButton>
                  )}
                  {isAuthor && (
                    <>
                      <ActionButton onClick={() => {
                        setEditingId(comment.id);
                        setReplyingToId(null);
                      }}>
                        ✏️ Edit
                      </ActionButton>
                      <ActionButton onClick={() => handleDelete(comment.id)}>
                        🗑️ Delete
                      </ActionButton>
                    </>
                  )}
                </div>
              </>
            )}

            {isReplying && (
              <CommentReplyForm
                postId={postId}
                parentId={comment.id}
                onCancel={() => setReplyingToId(null)}
                onSuccess={fetchComments}
              />
            )}
          </div>
        </div>

        {comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="comments-section">
      <h2>💬 Comments ({comments.filter(isVisible).length})</h2>

      {!isLoaded ? (
        <Spinner />
      ) : (
        <>
          <div className="comments-list">
            {comments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              comments.map((comment) => renderComment(comment))
            )}
          </div>

          {/* ✅ Add Comment button & textarea (toggle built into CommentForm) */}
          {viewer && (
            <CommentForm postId={postId} onSuccess={fetchComments} />
          )}
        </>
      )}
    </section>
  );
}
