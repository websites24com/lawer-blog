'use client'; 
// ✅ Required because this hook uses React hooks and Next.js navigation, 
// which must run in the browser (Client Component only).

import { useSession } from 'next-auth/react'; 
// ✅ Provides access to the current user session and auth status.

import { useRouter } from 'next/navigation'; 
// ✅ Enables programmatic navigation in Next.js App Router (used for redirects).

import { useEffect } from 'react'; 
// ✅ Needed to run side effects (like redirecting) when session/status changes.

type UseProtectedRouteParams = {
  allowedRoles: string[];     // ✅ List of roles that are allowed to access this route.
  redirectTo?: string;        // ✅ Optional redirect path (default is '/login').
};

export default function useProtectedRoute({ allowedRoles, redirectTo = '/login' }: UseProtectedRouteParams) {
  const { data: session, status } = useSession(); 
  // ✅ Get session data and loading/authentication status from NextAuth.

  const router = useRouter(); 
  // ✅ Router object to navigate/redirect to another route.

  useEffect(() => {
    if (status === 'loading') return; 
    // ⏳ While NextAuth is still checking session, we don’t want to redirect.

    const userRole = session?.user?.role; 
    // 🔐 Extract the user’s role from the session object (can be 'USER', 'MODERATOR', 'ADMIN', etc.).

    const isUnauthorized =
      status === 'unauthenticated' ||           // ❌ Not logged in at all
      !userRole ||                              // ❌ Logged in but no role assigned
      !allowedRoles.includes(userRole);         // ❌ Role exists but not allowed on this route

    if (isUnauthorized) {
      router.push(redirectTo); 
      // 🚨 Redirect unauthorized users to the fallback route (usually login page or access denied).
    }
  }, [session, status, allowedRoles, redirectTo, router]); 
  // ✅ Include all used values so React can re-run effect correctly when any of them change.

  return { session, status }; 
  // 📦 Return useful data in case the component wants to use it (e.g., for conditional UI rendering).
}
