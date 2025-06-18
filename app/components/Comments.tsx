'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

import Spinner from '@/app/components/Spinner';
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
  postId: number;
};

export default function Comments({ comments: initialComments, postId }: Props) {
  const { data: session } = useSession();
  const viewer = session?.user;
  const viewerId = viewer?.id || null;
  const viewerRole = viewer?.role || 'GUEST';
  const isAdminOrMod = viewerRole === 'ADMIN' || viewerRole === 'MODERATOR';

  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContentById, setReplyContentById] = useState<Record<number, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedContentById, setEditedContentById] = useState<Record<number, string>>({});
  const [loadingForId, setLoadingForId] = useState<number | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');

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

  const handleReplySubmit = async (parentId: number, message: string) => {
    const trimmed = message.trim();
    if (trimmed.length < 2) return toast.error('Reply is too short');
    setLoadingForId(parentId);

    try {
      const res = await fetch('/api/comments/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, parent_id: parentId, message: trimmed }),
      });
      if (!res.ok) throw new Error();

      toast.success('Reply submitted');
      await fetchComments();
      setReplyContentById((prev) => {
        const updated = { ...prev };
        delete updated[parentId];
        return updated;
      });
      setReplyingTo(null);
    } catch {
      toast.error('Failed to submit reply');
    } finally {
      setLoadingForId(null);
    }
  };

  const handleEditSubmit = async (commentId: number, newContent: string) => {
    const trimmed = newContent.trim();
    if (trimmed.length < 2) return toast.error('Comment is too short');
    setLoadingForId(commentId);

    try {
      const res = await fetch('/api/comments/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, content: trimmed }),
      });
      if (!res.ok) throw new Error();

      toast.success('Comment updated (pending review)');
      await fetchComments();
      setEditingCommentId(null);
    } catch {
      toast.error('Edit failed');
    } finally {
      setLoadingForId(null);
    }
  };

  const handleNewCommentSubmit = async () => {
    const trimmed = newCommentContent.trim();
    if (trimmed.length < 2) return toast.error('Comment is too short');
    setLoadingForId(-1);

    try {
      const res = await fetch('/api/comments/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, parent_id: null, message: trimmed }),
      });
      if (!res.ok) throw new Error();

      toast.success('Comment submitted');
      setNewCommentContent('');
      await fetchComments();
    } catch {
      toast.error('Failed to submit comment');
    } finally {
      setLoadingForId(null);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    setLoadingForId(commentId);

    try {
      const res = await fetch('/api/comments/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
      });
      if (!res.ok) throw new Error();

      const removeComment = (list: CommentWithUser[]): CommentWithUser[] =>
        list
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: removeComment(c.replies) }));

      setComments((prev) => removeComment(prev));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    } finally {
      setLoadingForId(null);
    }
  };

  const renderComment = (comment: CommentWithUser, level = 0): JSX.Element | null => {
    if (!isVisible(comment)) return null;
    const isAuthor = comment.user?.id === viewerId;
    const isEditing = editingCommentId === comment.id;

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
                <span className={`comment-status ${comment.status}`}> • {getStatusLabel(comment.status)}</span>
              )}
            </div>

            {isEditing ? (
              <textarea
                rows={3}
                value={editedContentById[comment.id] || ''}
                onChange={(e) =>
                  setEditedContentById((prev) => ({ ...prev, [comment.id]: e.target.value }))
                }
              />
            ) : (
              <p>{comment.content}</p>
            )}

            <div className="comment-actions">
              {isAuthor && !isEditing && (
                <>
                  <ActionButton onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditedContentById((prev) => ({ ...prev, [comment.id]: comment.content }));
                  }}>✏️ Edit</ActionButton>
                  <ActionButton onClick={() => handleDelete(comment.id)}>🗑️ Delete</ActionButton>
                </>
              )}
              {isAuthor && isEditing && (
                <>
                  <ActionButton onClick={() => handleEditSubmit(comment.id, editedContentById[comment.id] || '')} disabled={loadingForId === comment.id}>💾 Save</ActionButton>
                  <ActionButton onClick={() => setEditingCommentId(null)}>❌ Cancel</ActionButton>
                  {loadingForId === comment.id && <Spinner />}
                </>
              )}
              <ActionButton onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>↪️ Reply</ActionButton>
            </div>

            {replyingTo === comment.id && (
              <div className="reply-form">
                <textarea
                  rows={3}
                  value={replyContentById[comment.id] || ''}
                  onChange={(e) => setReplyContentById((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                  placeholder="Write your reply..."
                />
                <ActionButton
                  onClick={() => handleReplySubmit(comment.id, replyContentById[comment.id] || '')}
                  disabled={loadingForId === comment.id}
                >
                  💬 Submit Reply
                </ActionButton>
                {loadingForId === comment.id && <Spinner />}
              </div>
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

      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      {viewer && (
        <div className="new-comment-form" style={{ marginTop: '2rem' }}>
          <textarea
            rows={3}
            placeholder="Write a new comment..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
          />
          <ActionButton onClick={handleNewCommentSubmit} disabled={loadingForId === -1}>
            💬 Submit Comment
          </ActionButton>
          {loadingForId === -1 && <Spinner />}
        </div>
      )}
    </section>
  );
}
