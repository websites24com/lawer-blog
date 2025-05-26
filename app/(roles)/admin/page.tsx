// app/admin/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/app/lib/auth';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await auth();

  // Only allow access if user is admin
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <main >
      <h1 >Admin Dashboard</h1>

      <div>
        <div>
          <Link
            href="/admin/posts">
            Manage Posts
          </Link>
        </div>

        <div>
          <Link href="/admin/users">
            Manage Users
          </Link>
        </div>
      </div>
    </main>
  );
}
