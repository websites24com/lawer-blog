/*Why?

    redirect('/login') is a Client-Side Navigation tool from next/navigation, designed for server components and pages, not APIs.

    API routes (app/api/...) return JSON responses, not rendered pages — so redirecting does not make sense.

    Instead, API routes must handle errors explicitly using:


*/

// File: app/lib/auth/requireApiAuth.ts

import { auth } from '@/app/lib/auth/auth';
import type { SessionUser, UserRole } from '@/app/lib/definitions';

/**
 * Auth check for API routes — safely returns session and user,
 * or throws a 401/403 error you can catch in the route.
 */
export async function requireApiAuth(options?: { roles?: UserRole[] }) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    throw new Error('UNAUTHORIZED'); // Will be caught in your API route
  }

  const allowedRoles = options?.roles || [];

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN'); // Custom role-based restriction
  }

  return { session, user };
}
