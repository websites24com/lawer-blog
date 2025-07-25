'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { blockUser, unblockUser } from '@/app/actions/user/block';
import ActionButton from '@/app/components/global/ActionButton';

type Props = {
  blockedId: number;
  initiallyBlocked: boolean;
  onToggle?: (newState: boolean) => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  refresh?: boolean;
};

export default function BlockUserButton({
  blockedId,
  initiallyBlocked,
  onToggle,
  onBlock,
  onUnblock,
  refresh = false,
}: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isBlocked, setIsBlocked] = useState(initiallyBlocked);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsBlocked(initiallyBlocked);
  }, [initiallyBlocked]);

  const toggleBlock = () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      router.push('/login');
      return;
    }

    // Prevent self-block
    if (session.user.id === blockedId) {
      alert("You cannot block yourself.");
      return;
    }

    startTransition(async () => {
      try {
        if (isBlocked) {
          await unblockUser(blockedId, session.user.id);
          setIsBlocked(false);
          if (onUnblock) onUnblock();
          if (onToggle) onToggle(false);
        } else {
          await blockUser(blockedId, session.user.id);
          setIsBlocked(true);
          if (onBlock) onBlock();
          if (onToggle) onToggle(true);
        }

        if (refresh) {
          router.refresh();
        }
      } catch (err) {
        console.error('❌ Block/unblock failed:', err);
      }
    });
  };

  return (
    <ActionButton
      onClick={toggleBlock}
      loading={isPending}
      active={isBlocked}
      title={isBlocked ? 'Unblock this user' : 'Block this user'}
    >
      {isBlocked ? '🚫 Unblock' : '⛔ Block'}
    </ActionButton>
  );
}
