'use client';

import Link from 'next/link';
import ActionButton from '../global/ActionButton';
import { useTransition, useState } from 'react';
import { deletePostAction, updatePostStatus } from '@/app/actions/admin-posts';
import toast from 'react-hot-toast';
import ConfirmDeleteDialog from '../global/ConfirmDeleteDialog';

type Props = {
  postId: number;
  postSlug: string;
};

export default function AdminPostActions({ postId, postSlug }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePostAction(postId);
        toast.success('Post deleted');
      } catch {
        toast.error('Failed to delete post');
      } finally {
        setShowConfirm(false);
      }
    });
  };

  const handleStatus = (status: 'approved' | 'declined') => {
    startTransition(async () => {
      try {
        await updatePostStatus(postId, status);
        toast.success(`Post ${status}`);
      } catch {
        toast.error(`Failed to ${status} post`);
      }
    });
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
      <Link href={`/blog/${postSlug}`} target="_blank">
        <ActionButton onClick={() => {}}>Preview</ActionButton>
      </Link>

      <Link href={`/admin/posts/edit/${postId}`}>
        <ActionButton onClick={() => {}}>Edit</ActionButton>
      </Link>

      <ActionButton onClick={() => setShowConfirm(true)} loading={isPending}>
        Delete
      </ActionButton>

      <ActionButton onClick={() => handleStatus('approved')} loading={isPending}>
        Approve
      </ActionButton>

      <ActionButton onClick={() => handleStatus('declined')} loading={isPending}>
        Decline
      </ActionButton>

      {showConfirm && (
        <ConfirmDeleteDialog
          open={showConfirm}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
