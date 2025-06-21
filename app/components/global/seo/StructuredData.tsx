'use client';

import Script from 'next/script';
import type { PostWithUserAndCategoryAndComments } from '@/app/lib/definitions';

type Props = {
  post: PostWithUserAndCategoryAndComments;
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
    user,
    slug,
    category,
    comments = [],
  } = post;

  const fullUrl = `https://yourdomain.com/blog/${slug}`; // ← zamień na swoją domenę
  const publisherLogo = 'https://yourdomain.com/logo.png'; // ← aktualizuj jeśli masz logo

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    headline: title,
    description: excerpt,
    articleBody: content?.replace(/<[^>]*>/g, '').slice(0, 500), // usuń HTML i skróć
    author: {
      '@type': 'Person',
      name: `${user.first_name} ${user.last_name}`,
      url: `https://yourdomain.com/users/${user.slug}`,
      image: user.avatar_url || undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Your Site Name', // ← Zmień na nazwę bloga
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
    datePublished: new Date(created_at).toISOString(),
    image: featured_photo ? {
      '@type': 'ImageObject',
      url: featured_photo,
      description: photo_alt || 'Featured image',
    } : undefined,
    keywords: category?.name || '',
    commentCount: comments.length,
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
