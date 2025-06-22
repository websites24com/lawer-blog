'use client';

import Script from 'next/script';
import type { PostWithDetails } from '@/app/lib/definitions';

type Props = {
  post: PostWithDetails;
};

export default function StructuredData({ post }: Props) {
  if (!post) return null;

  const {
    title,
    excerpt,
    content,
    created_at,
    featured_photo,
    photo_alt,
    slug,
    user,
    category,
    comments,
  } = post;

  // 🔧 Podmień na swoją prawdziwą domenę i logo
  const fullUrl = `https://yourdomain.com/blog/${slug}`;
  const publisherLogo = 'https://yourdomain.com/logo.png';

  // 🔍 Structured Data schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    headline: title,
    description: excerpt,
    articleBody: content, // NIE ścinamy! Google sam analizuje długość
    author: {
      '@type': 'Person',
      name: `${user.first_name} ${user.last_name}`,
      url: `https://yourdomain.com/users/${user.slug}`,
      image: user.avatar_url || undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Your Site Name', // ← Zmień na nazwę Twojego bloga
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
    datePublished: new Date(created_at).toISOString(),
    image: featured_photo
      ? {
          '@type': 'ImageObject',
          url: featured_photo,
          description: photo_alt || 'Featured image',
        }
      : undefined,
    keywords: category?.name || '',
    commentCount: comments?.length || 0,
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}
