import { auth } from '@/app/lib/auth';
import { getAllApprovedPosts, getApprovedPostCount } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';
import FollowButton from '@/app/components/posts/FollowPostButton';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FancyDate from '@/app/components/global/date/FancyDate';
import Pagination from '@/app/components/global/pagination/Pagination';
import Link from 'next/link';

// Helper to clean HTML tags from excerpt
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

// Blog page with server-side pagination
export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const session = await auth();
  const userId = session?.user?.id || 0;

  const currentPage = Number(searchParams?.page) || 1;
  const pageSize = 3;

  const posts: PostSummary[] = await getAllApprovedPosts(userId, currentPage, pageSize);
  const totalPosts = await getApprovedPostCount();
  const totalPages = Math.ceil(totalPosts / pageSize);

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
                  <div className="image-wrapper">
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

            <FollowButton
              postId={post.id}
              initiallyFollowing={post.followed_by_current_user}
            />

            <p>{stripHtml(post.excerpt)}...</p>
          </li>
        ))}
      </ul>

      {/* ✅ PAGINATION with SCSS styles */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/blog"
      />
    </main>
  );
}
