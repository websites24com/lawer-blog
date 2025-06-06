import Link from 'next/link';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import { getAllUsers } from '@/app/lib/users';
import type { SimpleUser } from '@/app/lib/definitions';

export const metadata = {
  title: 'All Users',
  description: 'List of all users',
};

export default async function UsersPage() {
  const users: SimpleUser[] = await getAllUsers();

  if (!users || users.length === 0) {
    return <p>No users found.</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>👥 All Users</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map((user) => {
          const slug = `${user.first_name.toLowerCase()}-${user.last_name.toLowerCase()}`;

          return (
            <li key={user.id} style={{ marginBottom: '1.5rem' }}>
              <Link href={`/users/${slug}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#333' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', marginRight: '1rem' }}>
                  <ImageWithFallback
                    src={user.avatar_url || '/uploads/avatars/default.jpg'}
                    alt={`${user.first_name} ${user.last_name}`}
                    imageType="avatar"
                    className="fallback-image-avatar"
                    wrapperClassName="image-wrapper-avatar"
                  />
                </div>
                <span style={{ fontWeight: 'bold' }}>
                  {user.first_name} {user.last_name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
