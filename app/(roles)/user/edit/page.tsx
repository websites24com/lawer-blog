// app/user/edit/page.tsx

import EditUserForm from '@/app/components/user/EditUserForm';
import { requireAuth } from '@/app/lib/auth/requireAuth';

import { ALL_ROLES } from '@/app/lib/definitions';

export default async function EditUserPage() {
  // ✅ Enforce authentication — only logged-in users can access
 const { user} = await requireAuth({ roles: ALL_ROLES });

  return <EditUserForm userId={user.id} />;
}
