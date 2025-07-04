'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

import Spinner from '@/app/components/layout/Spinner';
import ActionButton from '@/app/components/global/ActionButton';

type Props = {
  postId: number;
  parentId: number;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function CommentReplyForm({
  postId,
  parentId,
  onCancel,
  onSuccess,
}: Props) {
  const [replyContent, setReplyContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    if (replyContent.trim().length < 2) {
      toast.error('Reply too short');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/comments/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: postId,
            parent_id: parentId,
            message: replyContent.trim(),
          }),
        });

        if (!res.ok) throw new Error();

        toast.success('Reply submitted');
        setReplyContent('');
        onSuccess();
        onCancel();
      } catch {
        toast.error('Failed to submit reply');
      }
    });
  };

  return (
    <div className="comment-form">
      <form className="comment-form__form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <textarea
          rows={3}
          className="comment-form__textarea"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write your reply..."
        />

        <div className="comment-form__buttons">
          <ActionButton
            type="submit"
            disabled={isPending || replyContent.trim().length < 2}
          >
            💬 Submit Reply
          </ActionButton>

          <ActionButton type="button" onClick={onCancel}>
            ❌ Cancel
          </ActionButton>

          {isPending && <Spinner />}
        </div>
      </form>
    </div>
  );
}
