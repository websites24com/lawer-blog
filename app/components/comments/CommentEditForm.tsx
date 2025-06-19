'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

import Spinner from '@/app/components/global/Spinner';
import ActionButton from '@/app/components/global/ActionButton';

type Props = {
  commentId: number;
  initialContent: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function CommentEditForm({
  commentId,
  initialContent,
  onCancel,
  onSuccess,
}: Props) {
  const [editContent, setEditContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    if (editContent.trim().length < 2) {
      toast.error('Edit too short');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/comments/edit', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment_id: commentId, content: editContent.trim() }),
        });

        if (!res.ok) throw new Error();

        toast.success('Comment updated');
        onSuccess();   // 🔄 Refresh comments
        onCancel();    // ✅ Close edit mode
      } catch {
        toast.error('Failed to update comment');
      }
    });
  };

  return (
    <div className="edit-form">
      <textarea
        rows={3}
        className="comment-form__textarea"
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        placeholder="Edit your comment..."
      />

      <div className="comment-form__buttons">
        <ActionButton
          onClick={handleSubmit}
          disabled={isPending || editContent.trim().length < 2}
        >
          💾 Save
        </ActionButton>

        <ActionButton onClick={onCancel}>
          ❌ Cancel
        </ActionButton>

        {isPending && <Spinner />}
      </div>
    </div>
  );
}
