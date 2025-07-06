export const revalidate = 60; // ✅ Enable ISR (Incremental Static Regeneration)

import { getPostBySlug } from '@/app/lib/posts';
import { auth } from '@/app/lib/auth/auth';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FollowButton from '@/app/components/posts/FollowPostButton';
import AuthorInfo from '@/app/components/user/AuthorInfo';
import Comments from '@/app/components/comments/Comments';
import StructuredData from '@/app/components/global/seo/StructuredData';

import type { Metadata } from 'next';
import Link from 'next/link';

type PageProps = {
  params: {
    slug: string;
  };
};

// ✅ Fixed: Safe access to params.slug for dynamic metadata (NO AWAIT!)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = params.slug; // ✅ no await here
  const session = await auth();
  const userId = session?.user?.id ?? 0;

  const post = await getPostBySlug(slug, userId); // ✅ no crash
  const commentCount = post?.comments?.length || 0;

  console.log('✅ Loaded post.tags:', post?.tags);

  return {
    title: post?.title || 'Post Not Found',
    description: `${post?.excerpt || 'Read the full article'} — 💬 ${commentCount} comment(s)`,
    openGraph: {
      title: post?.title,
      description: `${post?.excerpt || 'Read the full article'} — 💬 ${commentCount} comment(s)`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id ?? 0;
  const post = await getPostBySlug(params.slug, userId);

  if (!post) {
    return <div><h1>404 - Post Not Found</h1></div>;
  }

  

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>{post.title}</h1>

     <AuthorInfo
  user_slug={post.user.slug}
  first_name={post.user.first_name}
  last_name={post.user.last_name}
  avatar_url={post.user.avatar_url}
  created_at={post.created_at}
  category={post.category}
  country_name={post.country_name}
  state_name={post.state_name}
  city_name={post.city_name}
/>


      <FollowButton
        postId={post.id}
        initiallyFollowing={post.followed_by_current_user}
      />

      {post.featured_photo && (
        <div style={{ maxWidth: '100%', margin: '2rem 0' }}>
          <ImageWithFallback
            src={post.featured_photo}
            alt={post.photo_alt || 'Featured Image'}
            title={post.photo_title || ''}
            imageType="post"
            className=""
            wrapperClassName=""
          />
        </div>
      )}

      <p style={{ fontStyle: 'italic', color: '#444' }}>{post.excerpt}</p>

      <article
        dangerouslySetInnerHTML={{ __html: post.content }}
        style={{ lineHeight: '1.7', marginTop: '2rem' }}
      />

      
{post.tags && post.tags.length > 0 && (
  <div style={{ marginTop: '2rem' }}>
    <strong>Tags: </strong>
    {post.tags.map((tag) => (
      <Link
        key={tag}
        href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}
        style={{
          marginRight: '0.5rem',
          color: '#0070f3',
          textDecoration: 'none',
        }}
      >
        #{tag}
      </Link>
    ))}
  </div>
)}


      {/* ✅ Inject SEO Structured Data (JSON-LD) */}
      <StructuredData post={post} />

      <section style={{ marginTop: '3rem' }}>
        {/* 💬 Comments */}
        <Comments comments={post.comments || []} postId={post.id} />
      </section>
    </main>
  );
}
