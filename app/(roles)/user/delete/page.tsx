// File: app/user/delete/page.tsx

import { requireAuth } from '@/app/lib/auth/requireAuth';
import DeleteUserPage from '@/app/components/user/DeleteUserPage';

import { ALL_ROLES } from '@/app/lib/definitions';

export default async function EditUserPage() {
  // ✅ Enforce authentication — only logged-in users can access
 await requireAuth({ roles: ALL_ROLES });


  // ✅ If authenticated, render the DeleteUserPage client component
  return <DeleteUserPage />;
}
