import { notFound } from 'next/navigation';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import FancyDate from '@/app/components/FancyDate';
import TimeFromDate from '@/app/components/TimeFromDate';
import RenderPhone from '@/app/components/RenderPhone';
import RenderEmail from '@/app/components/RenderEmail';
import RenderWebsite from '@/app/components/RenderWebsite';
import FollowUserButton from '@/app/components/FollowUserButton'; // ✅ NEW
import { getUserBySlug } from '@/app/lib/users';
import { formatOrDash } from '@/app/utils/formatOrDash';
import type { FullUserData } from '@/app/lib/definitions';

type Props = {
  params: {
    slug: string;
  };
};

export default async function IndividualUserPage({ params }: Props) {
  const { slug } = params;

  // Convert slug "john-doe" to "John Doe"
  const userData: FullUserData | null = await getUserBySlug(slug);
  if (!userData) return notFound();

  return (
    <div className="user-profile-container" style={{ padding: '2rem' }}>
      <h1>👤 {userData.first_name} {userData.last_name}</h1>

      {/* Avatar */}
      <div className="user-avatar-section" style={{ marginBottom: '1rem' }}>
        <div className="image-wrapper-avatar">
          <ImageWithFallback
            src={userData.avatar_url || '/uploads/avatars/default.jpg'}
            alt={`${userData.first_name} ${userData.last_name}`}
            imageType="avatar"
            className="fallback-image-avatar"
            wrapperClassName="image-wrapper-avatar"
          />
        </div>
        <p className="user-name">
          {userData.first_name} {userData.last_name}
        </p>

        {/* ✅ Follow button added here */}
        <div style={{ marginTop: '1rem' }}>
          <FollowUserButton followedId={userData.id} />
        </div>
      </div>

      {/* User Info */}
      <div className="user-info-block">
        <p><strong>Email:</strong> <RenderEmail email={userData.email} /></p>
        <p>
          <strong>Phone:</strong> <RenderPhone phone={userData.phone} />
          {userData.chat_app ? ` (${userData.chat_app})` : ''}
        </p>
        <p><strong>Website:</strong> <RenderWebsite url={userData.website} /></p>
        <p><strong>About Me:</strong> {formatOrDash(userData.about_me)}</p>
        <p><strong>Provider:</strong> {formatOrDash(userData.provider)}</p>
        <p><strong>Account ID:</strong> {userData.id}</p>
        <p><strong>Role:</strong> {formatOrDash(userData.role)}</p>
        <p><strong>Status:</strong> {formatOrDash(userData.status)}</p>
        <p><strong>Created At:</strong> <FancyDate dateString={userData.created_at} /></p>
        <p><strong>User is with us from:</strong> <TimeFromDate date={userData.created_at} /></p>
      </div>

      {/* User's Posts */}
      <div className="user-section" style={{ marginTop: '2rem' }}>
        <h2>📝 User’s Posts</h2>
        {userData.posts?.length > 0 ? (
          <ul>
            {userData.posts.map((post) => (
              <li key={post.id}>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                  {post.title} ({post.status})
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>This user hasn’t published any posts.</p>
        )}
      </div>
    </div>
  );
}
