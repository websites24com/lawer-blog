import { getAllUsers, getUsersCount } from '@/app/lib/users/users';
import { auth } from '@/app/lib/auth/auth';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import Pagination from '@/app/components/global/pagination/Pagination';
import Link from 'next/link';

const USERS_PER_PAGE = 3;

export default async function UsersPage({ searchParams }: { searchParams?: { page?: string } }) {
  // 🔐 Get current session user
  const session = await auth();
  const viewerId = session?.user?.id || undefined;

  const currentPage = parseInt(searchParams?.page || '1', 10);
  const limit = USERS_PER_PAGE;
  const offset = (currentPage - 1) * limit;

  // 📦 Fetch filtered users and total count
  const [users, totalUsers] = await Promise.all([
    getAllUsers(limit, offset, viewerId),
    getUsersCount(viewerId),
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>👥 All Users</h1>

      {users.length === 0 && <p>No users found.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map((user) => (
          <li key={user.id} style={{ marginBottom: '1.5rem' }}>
            <Link
              href={`/users/${user.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#333',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginRight: '1rem',
                }}
              >
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
        ))}
      </ul>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/users"
      />
    </div>
  );
}
