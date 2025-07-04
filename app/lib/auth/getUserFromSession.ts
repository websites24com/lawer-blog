// utils/getUserFromSession.ts

import { SessionUser, FullUserData } from '@/app/lib/definitions'; // ✔️ Twoje własne typy

/**
 * Fetches the full user data from the DB using session.user.
 */
export async function getUserFromSession(
  session: { user?: SessionUser } | null
): Promise<FullUserData | null> {
  const user = session?.user;

  if (!user) return null;

  const canIdentifyUser =
    typeof user.email === 'string' ||
    (typeof user.provider === 'string' && typeof user.provider_account_id === 'string');

  if (!canIdentifyUser) return null;

  try {
    let res: Response;

    if (user.email) {
      res = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`);
    } else {
      const provider = encodeURIComponent(user.provider!);
      const providerId = encodeURIComponent(user.provider_account_id!);
      res = await fetch(`/api/user?provider=${provider}&providerId=${providerId}`);
    }

    if (!res.ok) return null;

    const data: FullUserData = await res.json();
    if (!data || typeof data.id !== 'number') return null;

    return data;
  } catch (err) {
    console.error('Failed to get user from session:', err);
    return null;
  }
}
