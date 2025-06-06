import Link from 'next/link';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import FancyDate from '@/app/components/FancyDate'; // ✅ import your FancyDate component

export type AuthorInfoProps = {
  user_id: number;
  user_slug: string; // ✅ This is needed
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string | null;
  category: string | null;
};


export default function AuthorInfo({
  user_id,
  user_slug,
  first_name,
  last_name,
  avatar_url,
  created_at,
  category,
}: AuthorInfoProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        <ImageWithFallback
          src={avatar_url || '/uploads/avatars/default.jpg'}
          alt={`${first_name} ${last_name}`}
          imageType="avatar"
          className="fallback-image-avatar"
          wrapperClassName="image-wrapper-avatar"
        />
      </div>

      {/* Written by */}
      <span style={{ color: '#555', fontSize: '0.95rem' }}>Written by:</span>
      <Link
        href={`/users/${user_slug}`} // ✅ Correct route using slug
        style={{
          textDecoration: 'none',
          color: '#0070f3',
          fontWeight: 'bold',
        }}
      >
        {first_name} {last_name}
      </Link>

      {/* on Date */}
      {created_at && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          on <FancyDate dateString={created_at} />
        </span>
      )}

      {/* Category */}
      {category && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          • Category:{' '}
          <Link
            href={`/blog?category=${encodeURIComponent(category)}`}
            style={{
              color: '#0070f3',
              textDecoration: 'none',
            }}
          >
            {category}
          </Link>
        </span>
      )}
    </div>
  );
}
