// app/admin/page.tsx
'use client';

import Link from 'next/link';
import WithProtectedRoute from '@/app/hooks/withProtectedRoute';

export default function AdminPage() {
  return (
    <WithProtectedRoute allowedRoles={['ADMIN']} redirectTo="/unauthorized">
      <main>
        <h1>Admin Dashboard</h1>

        <div>
          <div>
            <Link href="/admin/posts">
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
    </WithProtectedRoute>
  );
}
