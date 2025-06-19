'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/global/ActionButton';

type Props = {
  postId: number;
  parentId?: number | null;
  onSuccess?: () => void;
};

export default function CommentForm({ postId, parentId = null, onSuccess }: Props) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/comments/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: postId,
            message,
            parent_id: parentId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('❌ Server rejected comment:', data.error);
          toast.error(data.error || 'Failed to post comment.');
          return;
        }

        toast.success('✅ Comment submitted for review');
        setMessage('');
        setIsOpen(false);

        if (typeof onSuccess === 'function') {
          onSuccess();
        }

      } catch (error) {
        console.error('[COMMENT_FORM_ERROR]', error);
        toast.error('Something went wrong.');
      }
    });
  };

  return (
    <div className="comment-form">
      {!isOpen ? (
        <ActionButton onClick={() => setIsOpen(true)} className="comment-form__open-btn">
          ➕ Add Comment
        </ActionButton>
      ) : (
        <form onSubmit={handleSubmit} className="comment-form__form">
          <textarea
            className="comment-form__textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your comment..."
            required
          />

          <div className="comment-form__buttons">
            <ActionButton
              type="submit"
              loading={isPending}
              disabled={message.trim().length === 0}
            >
              ➕ Submit Comment
            </ActionButton>

            <ActionButton
              type="button"
              onClick={() => {
                setIsOpen(false);
                setMessage('');
              }}
            >
              ❌ Cancel
            </ActionButton>
          </div>
        </form>
      )}
    </div>
  );
}
