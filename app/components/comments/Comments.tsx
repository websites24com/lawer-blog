'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

import Spinner from '@/app/components/layout/Spinner';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FancyDate from '@/app/components/global/date/FancyDate';
import TimeFromDate from '@/app/components/global/date/TimeFromDate';
import ActionButton from '@/app/components/global/ActionButton';

import CommentForm from '@/app/components/comments/CommentForm';
import CommentReplyForm from '@/app/components/comments/CommentReplyForm';
import CommentEditForm from '@/app/components/comments/CommentEditForm';
import CommentsPagination from '@/app/components/comments/CommentsPagination';
import CommentDeleteButton from '@/app/components/comments/CommentDeleteButton';

import type { Comment, SimpleUser } from '@/app/lib/definitions';

const COMMENTS_PER_PAGE = 5;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedReplies, setCollapsedReplies] = useState<{ [key: number]: boolean }>({});

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

  const toggleReplies = (commentId: number) => {
    setCollapsedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
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
                      <CommentDeleteButton commentId={comment.id} onDeleted={fetchComments} />
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

            {comment.replies.length > 0 && (
              <div className="replies-toggle">
                <button onClick={() => toggleReplies(comment.id)}>
                  {collapsedReplies[comment.id] ? 'Hide Replies' : `Show Replies (${comment.replies.length})`}
                </button>
                {collapsedReplies[comment.id] && (
                  <div className="comment-replies">
                    {comment.replies.map((reply) => renderComment(reply, level + 1))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const allVisible = comments.reduce((acc, comment) => {
    if (isVisible(comment)) {
      acc.push(comment);
      acc.push(...comment.replies.filter(isVisible));
    }
    return acc;
  }, [] as CommentWithUser[]);

  const topLevelVisible = comments.filter(
    (comment) => isVisible(comment) && comment.parent_id === null
  );

  const totalPages = Math.ceil(topLevelVisible.length / COMMENTS_PER_PAGE);
  const paginatedTopLevel = topLevelVisible.slice(
    (currentPage - 1) * COMMENTS_PER_PAGE,
    currentPage * COMMENTS_PER_PAGE
  );

  return (
    <section className="comments-section">
      <h2>💬 Comments ({allVisible.length})</h2>

      {!isLoaded ? (
        <Spinner />
      ) : (
        <>
          <div className="comments-list">
            {topLevelVisible.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              paginatedTopLevel.map((comment) => renderComment(comment))
            )}
          </div>

          {allVisible.length > COMMENTS_PER_PAGE && totalPages > 1 && (
            <CommentsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}

          {viewer && (
            <CommentForm postId={postId} onSuccess={fetchComments} />
          )}
        </>
      )}
    </section>
  );
}
