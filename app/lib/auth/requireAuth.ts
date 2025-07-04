/* When to use RequireAuth()

Use it in:

    app/page.tsx

    app/some/page.tsx

    Server components (async function Page())

    Layouts (layout.tsx)

Why it makes sense:

    It allows you to:

        Get the current user (auth())

        Check roles

        Redirect before rendering anything

    Keeps your server pages protected in a clean, typed, reusable way
*/

import { auth } from '@/app/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { SessionUser, UserRole } from '@/app/lib/definitions'; // ✅ Added, but no layout touched

export async function requireAuth(options?: { roles?: UserRole[] }) {
  const session = await auth(); // Get the current user session
  const user = session?.user as SessionUser; // ✅ Typed correctly — layout preserved

  // 🚫 Not logged in → redirect to login page
  if (!user) {
    redirect('/login');
  }

  const allowedRoles = options?.roles || [];

  // 🚫 Logged in but does not have one of the allowed roles → redirect to unauthorized
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    redirect('/unauthorized');
  }

  return { session, user }; // ✅ Access granted

}


/* Usage

import { RequireAuth } from '@/app/lib/auth/RequireAuth';
import { ROLES } from '@/app/lib/definitions';

export default async function AdminOnlyPage() {
  // ⛔ Only allow ADMINs
  const { user } = await RequireAuth({ roles: [ROLES.ADMIN] });

  // If the user is not ADMIN, they are redirected by RequireAuth automatically.
  return (
    <div>
      <h1>Welcome Admin, {user.email}</h1>
       Protected content here 
    </div>
  );
}
  */
