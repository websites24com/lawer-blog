'use client';

import type { PostSummary } from '@/app/lib/definitions';
import { useState, useTransition } from 'react';
import { updatePostStatus, deletePostAction } from '@/app/actions/admin-posts';
import toast from 'react-hot-toast';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

type Props = {
  post: PostSummary;
  onUpdate: (id: number, status: string) => void;
  onDelete: (id: number) => void;
};

export default function AdminPostItem({ post, onUpdate, onDelete }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePostAction(post.id);
        toast.success('Post deleted');
        onDelete(post.id);
      } catch {
        toast.error('Delete failed');
      }
    });
  };

  const handleStatus = (status: 'approved' | 'declined') => {
    startTransition(async () => {
      try {
        await updatePostStatus(post.id, status);
        toast.success(`Post ${status}`);
        onUpdate(post.id, status);
      } catch {
        toast.error(`Failed to update status to ${status}`);
      }
    });
  };

  return (
    <div style={{ borderBottom: '1px solid #ccc', padding: '1rem 0' }}>
      <div><strong>Title:</strong> {post.title}</div>
      <div><strong>Author:</strong> {post.user.first_name} {post.user.last_name}</div>
      <div><strong>Category:</strong> {post.category}</div>
      <div><strong>Status:</strong> {post.status}</div>
      <div><strong>Created:</strong> {new Date(post.created_at).toLocaleDateString()}</div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>Preview</button>
        <button onClick={() => alert('TODO: Edit')}>Edit</button>
        <button onClick={() => setShowConfirm(true)} disabled={isPending}>Delete</button>
        <button onClick={() => handleStatus('approved')} disabled={isPending}>Approve</button>
        <button onClick={() => handleStatus('declined')} disabled={isPending}>Decline</button>
      </div>

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
