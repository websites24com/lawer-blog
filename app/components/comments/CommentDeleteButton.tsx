'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/ActionButton';
import ConfirmDeleteDialog from '@/app/components/ConfirmDeleteDialog';

type Props = {
  commentId: number;
  onDeleted: () => void;
};

export default function CommentDeleteButton({ commentId, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/comments/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment_id: commentId }),
        });

        if (!res.ok) throw new Error();
        toast.success('Comment deleted');
        setOpen(false);
        onDeleted();
      } catch (err) {
        toast.error('Failed to delete comment');
      }
    });
  };

  return (
    <>
      {/* 🗑️ Trigger */}
      <ActionButton onClick={() => setOpen(true)} disabled={isPending}>
        🗑️ Delete
      </ActionButton>

      {/* 🧾 Confirm Dialog */}
      <ConfirmDeleteDialog
        open={open}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
