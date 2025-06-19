import { auth } from '@/app/lib/auth';
import { getAllApprovedPosts } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';
import FollowButton from '@/app/components/posts/FollowPostButton';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FancyDate from '@/app/components/global/date/FancyDate';
import Link from 'next/link';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export default async function BlogPage() {
  const session = await auth(); // ✅ Get session
  const userId = session?.user?.id || 0; // ✅ Extract user ID

  const posts: PostSummary[] = await getAllApprovedPosts(userId); // ✅ Pass userId

  return (
    <main>
      <h1>Blog</h1>

      {posts.length === 0 && <p>No posts found.</p>}

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`}>
              <div style={{ borderBottom: '1px solid #ccc', padding: '1rem 0' }}>
                {post.featured_photo && (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '200px',
                      position: 'relative',
                      marginTop: '1rem',
                    }}
                  >
                    <ImageWithFallback
                      src={post.featured_photo}
                      alt="Featured Post"
                      imageType="post"
                      className=""
                      wrapperClassName=""
                    />
                  </div>
                )}
              </div>
            </Link>

            <Link href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
            </Link>

            <p>
              <FancyDate dateString={post.created_at} /> • {post.category} •{' '}
              {post.user.first_name} {post.user.last_name}
            </p>

            {/* ✅ Pass ID and follow state */}
            <FollowButton
              postId={post.id}
              initiallyFollowing={post.followed_by_current_user}
            />

            <p>{stripHtml(post.excerpt)}...</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
