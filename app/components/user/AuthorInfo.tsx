import Link from 'next/link';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FancyDate from '@/app/components/global/date/FancyDate';
import { Category } from '@/app/lib/definitions';

export type AuthorInfoProps = {
  user_slug: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  created_at: string | null;
  category?: Category | null;
  country_name?: string | null;
  state_name?: string | null;
  city_name?: string | null;
};

export default function AuthorInfo({
  user_slug,
  first_name,
  last_name,
  avatar_url,
  created_at,
  category,
  country_name,
  state_name,
  city_name,
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
      {/* ✅ Avatar */}
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

      {/* ✅ Author name */}
      <span style={{ color: '#555', fontSize: '0.95rem' }}>Written by:</span>
      <Link
        href={`/users/${user_slug}`}
        style={{
          textDecoration: 'none',
          color: '#0070f3',
          fontWeight: 'bold',
        }}
      >
        {first_name} {last_name}
      </Link>

      {/* ✅ Date */}
      {created_at && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          on <FancyDate dateString={created_at} />
        </span>
      )}

      {/* ✅ Category */}
      {category && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          • Category:{' '}
          <Link
            href={`/blog/category/${category.slug}`}
            style={{
              color: '#0070f3',
              textDecoration: 'none',
            }}
          >
            {category.name}
          </Link>
        </span>
      )}

      {/* ✅ Location */}
      {city_name && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          • City:{' '}
          <Link
            href={`/blog?city=${encodeURIComponent(city_name)}`}
            style={{ color: '#0070f3', textDecoration: 'none' }}
          >
            {city_name}
          </Link>
        </span>
      )}

      {state_name && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          • State:{' '}
          <Link
            href={`/blog?state=${encodeURIComponent(state_name)}`}
            style={{ color: '#0070f3', textDecoration: 'none' }}
          >
            {state_name}
          </Link>
        </span>
      )}

      {country_name && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          • Country:{' '}
          <Link
            href={`/blog?country=${encodeURIComponent(country_name)}`}
            style={{ color: '#0070f3', textDecoration: 'none' }}
          >
            {country_name}
          </Link>
        </span>
      )}
    </div>
  );
}
