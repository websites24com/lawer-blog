'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import ActionButton from './ActionButton';
import { followUser, unfollowUser } from '@/app/actions/user';

type Props = {
  userId: number; // ID of the user you want to follow/unfollow
  initiallyFollowing: boolean;
  onToggle?: () => void;
};

export default function FollowUserButton({ userId, initiallyFollowing, onToggle }: Props) {
  const { status } = useSession();
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [isPending, startTransition] = useTransition();

  const toggleFollow = () => {
    if (status !== 'authenticated') return;

    startTransition(async () => {
      try {
        if (isFollowing) {
          await unfollowUser(userId);
        } else {
          await followUser(userId);
        }

        setIsFollowing(!isFollowing);
        if (onToggle) onToggle(); // Optional callback to refresh UI
      } catch (err) {
        console.error('❌ Failed to follow/unfollow user:', err);
      }
    });
  };

  return (
    <ActionButton
      onClick={toggleFollow}
      loading={isPending}
      active={isFollowing}
      title={isFollowing ? 'Unfollow this user' : 'Follow this user'}
    >
      {isFollowing ? '👥 Unfollow' : '➕ Follow'}
    </ActionButton>
  );
}
