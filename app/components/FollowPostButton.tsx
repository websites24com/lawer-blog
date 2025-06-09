'use client';

import { useState, useTransition } from 'react';
import { followPost, unfollowPost } from '@/app/actions/posts';
import { useSession } from 'next-auth/react';
import ActionButton from './ActionButton';

type Props = {
  postId: number;
  initiallyFollowing: boolean;
  onToggle?: () => void;
};

export default function FollowPostButton({ postId, initiallyFollowing, onToggle }: Props) {
  const { status } = useSession();
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [isPending, startTransition] = useTransition();

  const toggleFollow = () => {
    if (status !== 'authenticated') return;

    startTransition(async () => {
      try {
        if (isFollowing) {
          await unfollowPost(postId);
        } else {
          await followPost(postId);
        }

        setIsFollowing(!isFollowing);
        if (onToggle) onToggle(); // ✅ Call refresh
      } catch (err) {
        console.error('❌ Follow action failed:', err);
      }
    });
  };

  return (
    <ActionButton
      onClick={toggleFollow}
      loading={isPending}
      active={isFollowing}
      title={isFollowing ? 'Unfollow this post' : 'Follow this post'}
    >
      {isFollowing ? '★ Unfollow' : '☆ Follow'}
    </ActionButton>
  );
}
