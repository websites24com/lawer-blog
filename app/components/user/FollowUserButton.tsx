// This component runs on the client side
'use client';

// Import necessary React hooks
import { useState, useEffect, useTransition } from 'react';

// Import session to get current user info
import { useSession } from 'next-auth/react';

// Import router to redirect or refresh the page
import { useRouter } from 'next/navigation';

// Import server actions for following and unfollowing users
import { followUser, unfollowUser } from '@/app/actions/user/user';

// Import reusable action button
import ActionButton from '@/app/components/global/ActionButton';

// Define the props expected by this component
type Props = {
  followedId: number;
  initiallyFollowing: boolean;
  onToggle?: (newState: boolean) => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  refresh?: boolean;
};

// Define the FollowUserButton component
export default function FollowUserButton({
  followedId,
  initiallyFollowing,
  onToggle,
  onFollow,
  onUnfollow,
  refresh = false,
}: Props) {
  // Get the current user session
  const { data: session, status } = useSession();

  // Get router instance
  const router = useRouter();

  // Track whether the user is currently followed
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);

  // Track whether a transition is pending
  const [isPending, startTransition] = useTransition();

  // Update internal state when prop changes
  useEffect(() => {
    setIsFollowing(initiallyFollowing);
  }, [initiallyFollowing]);

  // Toggle follow or unfollow action
  const toggleFollow = () => {
    // If user is not authenticated, redirect to login
    if (status !== 'authenticated' || !session?.user?.id) {
      router.push('/login');
      return;
    }

    // Run follow/unfollow logic in a transition
    startTransition(async () => {
      try {
        // If already following — unfollow
        if (isFollowing) {
          await unfollowUser(followedId, session.user.id);
          setIsFollowing(false);
          if (onUnfollow) onUnfollow();
          if (onToggle) onToggle(false);
        } 
        // If not following — follow
        else {
          await followUser(followedId, session.user.id);
          setIsFollowing(true);
          if (onFollow) onFollow();
          if (onToggle) onToggle(true);
        }

        // If refresh flag is set — trigger router refresh
        if (refresh) {
          router.refresh();
        }
      } catch (err) {
        console.error('❌ Follow/unfollow failed:', err);
      }
    });
  };

  // Render the action button
  return (
    <ActionButton
      onClick={toggleFollow}
      loading={isPending}
      active={isFollowing}
      title={isFollowing ? 'Unfollow this user' : 'Follow this user'}
    >
      {isFollowing ? '★ Unfollow' : '☆ Follow'}
    </ActionButton>
  );
}
