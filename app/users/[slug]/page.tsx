// app/users/[slug]/page.tsx
import { notFound } from 'next/navigation';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import FancyDate from '@/app/components/FancyDate';
import { getUserBySlug } from '@/app/lib/users';
import type { FullUserData } from '@/app/lib/definitions';

type Props = {
  params: {
    slug: string;
  };
};

export default async function IndividualUserPage({ params }: Props) {
  const { slug } = params;

  const [firstNameRaw, lastNameRaw] = slug.split('-');
  const firstName = firstNameRaw?.charAt(0).toUpperCase() + firstNameRaw?.slice(1);
  const lastName = lastNameRaw?.charAt(0).toUpperCase() + lastNameRaw?.slice(1);

  const userData: FullUserData | null = await getUserBySlug(`${firstName} ${lastName}`);
  if (!userData) return notFound();

  const formatOrDash = (val: any) => (val ? val : '—');

  const getDurationString = (date: string) => {
    if (!date) return '';
    const start = new Date(date);
    const end = new Date();

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : 'less than a day';
  };

  const renderPhone = (phone: string | null) => {
    if (!phone) return '—';
    return (
      <a href={`tel:${phone}`} target="_blank" rel="noopener noreferrer">
        +{phone}
      </a>
    );
  };

  const renderWebsite = (url: string | null) => {
    if (!url) return '—';
    const href = url.startsWith('http') ? url : `https://${url}`;
    let display = href.replace(/^https?:\/\//, '');
    if (!display.startsWith('www.')) {
      display = 'www.' + display;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {display}
      </a>
    );
  };

  const renderEmail = (email: string | null) => {
    if (!email) return '—';
    return (
      <a href={`mailto:${email}`} target="_blank" rel="noopener noreferrer">
        {email}
      </a>
    );
  };

  return (
    <div className="user-profile-container" style={{ padding: '2rem' }}>
      <h1>👤 {userData.first_name} {userData.last_name}</h1>

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
      </div>

      <div className="user-info-block">
        <p><strong>Email:</strong> {renderEmail(userData.email)}</p>
        <p>
          <strong>Phone:</strong> {renderPhone(userData.phone)}
          {userData.chat_app ? ` (${userData.chat_app})` : ''}
        </p>
        <p><strong>Website:</strong> {renderWebsite(userData.website)}</p>
        <p><strong>About Me:</strong> {formatOrDash(userData.about_me)}</p>
        <p><strong>Provider:</strong> {formatOrDash(userData.provider)}</p>
        <p><strong>Account ID:</strong> {formatOrDash(userData.provider_account_id)}</p>
        <p><strong>Role:</strong> {formatOrDash(userData.role)}</p>
        <p><strong>Status:</strong> {formatOrDash(userData.status)}</p>
        <p>
          <strong>Created At:</strong>{' '}
          <FancyDate dateString={userData.created_at} />
        </p>
        <p>
          <strong>User is with us from:</strong>{' '}
          {getDurationString(userData.created_at)}
        </p>
      </div>

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
