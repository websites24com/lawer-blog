import Link from 'next/link';
import { getAllApprovedPosts } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';
import FollowButton from '@/app/components/FollowButton';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import FancyDate from '@/app/components/FancyDate'; // ✅ Adjust path based on your folder structure

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export default async function BlogPage() {
  const posts: PostSummary[] = await getAllApprovedPosts();

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
                      maxWidth: '400px',
                      height: '200px',
                      position: 'relative',
                      marginTop: '1rem',
                    }}
                  >
                    <ImageWithFallback
                      src={post.featured_photo}
                      alt="Featured Post"
                      imageType="bike"
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
