'use client';

import type { PostSummary } from '@/app/lib/definitions';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePostStatus, deletePostAction } from '@/app/actions/admin-posts';
import toast from 'react-hot-toast';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import ActionButton from '@/app/components/ActionButton';

type PostStatus = 'approved' | 'declined' | 'draft';

type Props = {
  post: PostSummary;
  onUpdate: (id: number, status: PostStatus) => void;
  onDelete: (id: number) => void;
};

export default function AdminPostItem({ post, onUpdate, onDelete }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

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

  const handleStatus = (status: PostStatus) => {
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

  console.log('📸 post.featured_photo:', post.featured_photo);

  return (
    <div style={{ borderBottom: '1px solid #ccc', padding: '1rem 0' }}>
  {post.featured_photo && (
    <div className="image-wrapper">
      <ImageWithFallback
        src={post.featured_photo}
        alt="Featured Post"
        imageType="bike"
        className="fallback-image"
        wrapperClassName="image-wrapper"
      />
        </div>
      )}

      <div><strong>Title:</strong> {post.title}</div>
      <div><strong>Author:</strong> {post.user.first_name} {post.user.last_name}</div>
      <div><strong>Category:</strong> {post.category}</div>
      <div><strong>Status:</strong> {post.status}</div>
      <div><strong>Created:</strong> {new Date(post.created_at).toLocaleDateString()}</div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <ActionButton onClick={() => window.open(`/blog/${post.slug}`, '_blank')} title="Preview post">
          Preview
        </ActionButton>

        <ActionButton
          onClick={() => router.push(`/admin/posts/edit?id=${post.id}`)}
          title="Edit post"
        >
          Edit
        </ActionButton>

        <ActionButton onClick={() => setShowConfirm(true)} loading={isPending} title="Delete post">
          Delete
        </ActionButton>

        <ActionButton onClick={() => handleStatus('approved')} loading={isPending} title="Approve post">
          Approve
        </ActionButton>

        <ActionButton onClick={() => handleStatus('declined')} loading={isPending} title="Decline post">
          Decline
        </ActionButton>

        <ActionButton onClick={() => handleStatus('draft')} loading={isPending} title="Set to draft">
          Draft
        </ActionButton>
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