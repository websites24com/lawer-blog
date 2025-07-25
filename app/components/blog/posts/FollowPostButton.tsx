'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { followPost, unfollowPost } from '@/app/actions/user/follow';
import ActionButton from '@/app/components/global/ActionButton';

type Props = {
  postId: number;
  initiallyFollowing: boolean;
  onToggle?: (newState: boolean) => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  refresh?: boolean;
};

export default function FollowPostButton({
  postId,
  initiallyFollowing,
  onToggle,
  onFollow,
  onUnfollow,
  refresh = false,
}: Props) {
  const { status } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);

  useEffect(() => {
    setIsFollowing(initiallyFollowing);
  }, [initiallyFollowing]);

  const toggleFollow = () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }

    startTransition(async () => {
      try {
        if (isFollowing) {
          await unfollowPost(postId);
          setIsFollowing(false);
          onUnfollow?.();
          onToggle?.(false);
        } else {
          await followPost(postId);
          setIsFollowing(true);
          onFollow?.();
          onToggle?.(true);
        }

        if (refresh) {
          router.refresh();
        }
      } catch (err) {
        console.error('Follow/unfollow failed:', err);
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
