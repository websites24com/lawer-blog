'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

import Spinner from '@/app/components/Spinner';
import ActionButton from '@/app/components/ActionButton';
import ConfirmDeleteDialog from '@/app/components/ConfirmDeleteDialog';

export default function DeleteUserPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false); // 🔄 Spinner state for cleanup

  // 🔒 Ask for confirmation to delete user
  const handleDelete = () => setShowDialog(true);

  // ✅ Confirm and delete user account
  const confirmDelete = () => {
    setLoading(true);
    setShowDialog(false);

    startTransition(async () => {
      try {
        const res = await fetch('/api/user/delete', { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete account');

        toast.success('Account deleted');
        await signOut({ callbackUrl: '/' });
      } catch (err) {
        console.error('❌ Failed to delete account', err);
        toast.error('Failed to delete account');
      } finally {
        setLoading(false);
      }
    });
  };

  // ❌ Cancel delete dialog
  const cancelDelete = () => setShowDialog(false);

  // 🧹 Trigger server-side cleanup of unused featured images
  const triggerCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/user/posts/editor/cleanup-unused-featured-photos', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Cleanup complete. Deleted: ${data.deleted.length} image(s)`);
      } else {
        toast.error(data.error || 'Failed to clean up images');
      }
    } catch (err) {
      console.error('❌ Cleanup error:', err);
      toast.error('Error during cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1>🗑 Delete My Account</h1>
      <p>
        This action will permanently remove your account and all associated data.
        <br />
        <strong>This cannot be undone.</strong>
      </p>

      {loading ? (
        <div style={{ margin: '2rem 0', textAlign: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* 🚨 Button to delete user */}
          <ActionButton onClick={handleDelete} title="Delete your account forever">
            ⚠️ Yes, Delete My Account
          </ActionButton>

          {/* 🔙 Cancel and return */}
          <ActionButton onClick={() => router.back()} title="Cancel and go back">
            ❌ Cancel
          </ActionButton>

          {/* 🧹 Manual cleanup trigger */}
          <ActionButton
            onClick={triggerCleanup}
            title="Clean up unused featured images"
            disabled={cleanupLoading}
          >
            🧹 Cleanup Unused Photos
          </ActionButton>
        </>
      )}

      <ConfirmDeleteDialog
        open={showDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
