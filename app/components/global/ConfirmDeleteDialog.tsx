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
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title className="dialog-title">
            Confirm Deletion
          </AlertDialog.Title>

          <AlertDialog.Description className="dialog-description">
            Are you sure you want to delete this post? This action cannot be undone.
          </AlertDialog.Description>

          <div className="dialog-actions">
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
