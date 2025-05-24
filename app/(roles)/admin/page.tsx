// app/admin/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/app/lib/auth';

export default async function AdminPage() {
  const session = await auth();

  // Only allow access if user is admin
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="space-y-4">
        <div>
          <a
            href="/admin/posts"
            className="block p-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Manage Posts
          </a>
        </div>

        <div>
          <a
            href="/admin/users"
            className="block p-4 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Manage Users
          </a>
        </div>
      </div>
    </main>
  );
}
