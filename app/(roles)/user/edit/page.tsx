// lawyer-blog/app/user/edit/page.tsx
import EditUserForm from '@/app/components/EditUserForm';
import { auth } from '@/app/lib/auth'; // ⬅️ your server-side session util

import { redirect } from 'next/navigation';

export default async function EditUserPage() {
  const session = await auth();

  // ✅ Redirect if not logged in
  if (!session?.user?.id) {
    redirect('/login');
  }

  return <EditUserForm userId={session.user.id} />;
}
