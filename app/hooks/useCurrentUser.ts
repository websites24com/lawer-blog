'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { FullUserData, SessionUser } from '@/app/lib/definitions';

/**
 * Custom hook that fetches the full user data from /api/user
 * based on session (email or provider+account_id).
 * It also exposes a refetch() function to reload the data manually.
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();

  const [userData, setUserData] = useState<FullUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolved, setResolved] = useState(false);

  // ✅ Define fetch logic separately so we can reuse it in refetch()
  const fetchUser = useCallback(async () => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || !session?.user) {
      setLoading(false);
      setResolved(true);
      return;
    }

    const user = session.user as SessionUser;

    const canIdentifyUser =
      typeof user.email === 'string' ||
      (typeof user.provider === 'string' && typeof user.provider_account_id === 'string');

    if (!canIdentifyUser) {
      setLoading(false);
      setResolved(true);
      return;
    }

    try {
      let res: Response;

      if (user.email) {
        res = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`);
      } else {
        const provider = encodeURIComponent(user.provider!);
        const providerId = encodeURIComponent(user.provider_account_id!);
        res = await fetch(`/api/user?provider=${provider}&providerId=${providerId}`);
      }

      if (!res.ok) throw new Error('User not found');
      const data: FullUserData = await res.json();
      if (!data?.id) throw new Error('User data invalid');

      setUserData(data);
      setError(false);
    } catch (err) {
      console.error('❌ useCurrentUser fetch error:', err);
      setError(true);
      setUserData(null);
    } finally {
      setLoading(false);
      setResolved(true);
    }
  }, [session, status]);

  // ✅ Call fetch logic on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ✅ Expose fetchUser as refetch
  return {
    userData,
    loading,
    error,
    resolved,
    status,
    refetch: fetchUser, // 👈 now accessible in components
  };
}
