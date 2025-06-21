// File: app/components/FollowUserButton.tsx

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { followUser, unfollowUser } from '@/app/actions/user'; // ✅ server actions
import ActionButton from '@/app/components/global/ActionButton'; // ✅ Reusable button component

type Props = {
  followedId: number;           // ID of the user to follow/unfollow
  initiallyFollowing: boolean; // Whether the current user is already following this user
  onFollow?: () => void;
  onUnfollow?: () => void;
};

export default function FollowUserButton({ followedId, initiallyFollowing }: Props) {
  const { data: session, status } = useSession(); // ✅ Get current user session
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing); // ✅ Local UI state
  const [isPending, startTransition] = useTransition(); // ✅ React 18 transition state

  // ✅ Ensure state sync if initiallyFollowing changes (e.g. after soft navigation)
  useEffect(() => {
    setIsFollowing(initiallyFollowing);
  }, [initiallyFollowing]);

  const toggleFollow = () => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    startTransition(async () => {
      try {
        if (isFollowing) {
          // ✅ Call server action to unfollow user
          await unfollowUser(followedId, session.user.id);
        } else {
          // ✅ Call server action to follow user
          await followUser(followedId, session.user.id);
        }

        // ✅ Update local UI state instantly
        setIsFollowing(!isFollowing);

        // ❗Note: Server revalidation is handled in backend or can be triggered with router.refresh() if needed
      } catch (err) {
        console.error('❌ Follow/unfollow failed:', err);
      }
    });
  };

  return (
    <ActionButton
      onClick={toggleFollow}
      loading={isPending} // ✅ Show spinner if action is pending
      active={isFollowing} // ✅ Highlight button if currently following
      title={isFollowing ? 'Unfollow this user' : 'Follow this user'}
    >
      {isFollowing ? '★ Unfollow' : '☆ Follow'}
    </ActionButton>
  );
}
