import Link from 'next/link';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FancyDate from '@/app/components/global/date/FancyDate';
import { AuthorInfo } from '@/app/lib/definitions';



export default function PostInfo({
  user_slug,
  first_name,
  last_name,
  avatar_url,
  created_at,
  category,
  language,
  country_name,
  state_name,
  city_name,
}: AuthorInfo) {
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

      {/* ✅ Language */}
      {language && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          • Language:{' '}
          <Link
            href={`/blog/language/${language.slug}`}
            style={{
              color: '#0070f3',
              textDecoration: 'none',
            }}
          >
            {language.name}
          </Link>
        </span>
      )}

      {/* ✅ Location links (fixed to use slugs instead of query params) */}
      {city_name && (
        <span style={{ color: '#555', fontSize: '0.95rem' }}>
          • City:{' '}
          <Link
            href={`/blog/location/city/${encodeURIComponent(city_name)}`}
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
            href={`/blog/location/state/${encodeURIComponent(state_name)}`}
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
            href={`/blog/location/country/${encodeURIComponent(country_name)}`}
            style={{ color: '#0070f3', textDecoration: 'none' }}
          >
            {country_name}
          </Link>
        </span>
      )}
    </div>
  );
}
