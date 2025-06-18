'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

import ActionButton from '@/app/components/ActionButton';

type Props = {
  postId: number;
  parentId?: number | null; // <-- optional for replies
};

export default function CommentForm({ postId, parentId = null }: Props) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

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
            parent_id: parentId, // <-- for nested replies
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
      } catch (error) {
        console.error('[COMMENT_FORM_ERROR]', error);
        toast.error('Something went wrong.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
      <label
        htmlFor="comment-box"
        style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
      >
        Write a comment:
      </label>

      <textarea
        id="comment-box"
        name="comment"
        rows={4}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          resize: 'vertical',
        }}
        placeholder="Type your comment..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />

      <div style={{ marginTop: '1rem' }}>
        <ActionButton
          type="submit"
          loading={isPending}
          disabled={message.trim().length === 0}
          title="Submit your comment"
        >
          ➕ Add Comment
        </ActionButton>
      </div>
    </form>
  );
}
