import { getPostBySlug } from '@/app/lib/posts';
import { auth } from '@/app/lib/auth';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import FollowButton from '@/app/components/FollowPostButton';
import AuthorInfo from '@/app/components/AuthorInfo';

import type { Metadata } from 'next';

type PageProps = {
  params: {
    slug: string; // ✅ fixed
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const session = await auth();
  const userId = session?.user?.id ?? 0; // ✅ safe default
  const post = await getPostBySlug(params.slug, userId);

  return {
    title: post?.title || 'Post Not Found',
    description: post?.excerpt || '',
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id ?? 0; // ✅ safe default
  const post = await getPostBySlug(params.slug, userId);

  if (!post) return <div><h1>404 - Post Not Found</h1></div>;

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>{post.title}</h1>

      <AuthorInfo
        user_id={post.user_id}
        user_slug={post.user.slug}
        first_name={post.user.first_name}
        last_name={post.user.last_name}
        avatar_url={post.user.avatar_url}
        created_at={post.created_at}
        category={post.category}
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

      <section style={{ marginTop: '3rem' }}>
        <h2>Comments ({post.comments?.length || 0})</h2>

        {post.comments?.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {post.comments.map((comment) => (
              <li
                key={comment.id}
                style={{
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '1rem',
                }}
              >
                <p>
                  <strong>{comment.name}</strong> –{' '}
                  <span style={{ color: '#666' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
