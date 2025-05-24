'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteDialog({ open, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(val) => !val && onCancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        />
        <AlertDialog.Content
          style={{
            position: 'fixed',
            zIndex: 1001,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            width: '90%',
            maxWidth: '400px',
          }}
        >
          <AlertDialog.Title style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Confirm Deletion
          </AlertDialog.Title>

          <AlertDialog.Description style={{ marginBottom: '1.5rem' }}>
            Are you sure you want to delete this post? This action cannot be undone.
          </AlertDialog.Description>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <AlertDialog.Cancel asChild>
              <button onClick={onCancel}>Cancel</button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button onClick={onConfirm}>Delete</button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
