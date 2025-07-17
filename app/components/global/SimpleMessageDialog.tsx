'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';

type Props = {
  open: boolean;
  message: string;
  title?: string;
  onClose: () => void;
};

export default function SimpleMessageDialog({ open, message, title = 'Notice', onClose }: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title className="dialog-title">{title}</AlertDialog.Title>
          <AlertDialog.Description className="dialog-description">
            {message}
          </AlertDialog.Description>

          <div className="dialog-actions">
            <AlertDialog.Action asChild>
              <button onClick={onClose}>OK</button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
