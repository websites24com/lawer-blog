import { auth } from '@/app/lib/auth/auth';
import { getPostsByTag } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FancyDate from '@/app/components/global/date/FancyDate';
import FollowButton from '@/app/components/posts/FollowPostButton';
import Pagination from '@/app/components/global/pagination/Pagination';
import Link from 'next/link';

// Helper to strip HTML tags from excerpt
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

type TagPageProps = {
  params: { slug: string };
  searchParams?: { page?: string };
};

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const session = await auth();
  const userId = session?.user?.id || 0;
  const currentPage = Number(searchParams?.page) || 1;
  const pageSize = 3;

  // ✅ Destructure posts and totalCount from updated getPostsByTag
  const { posts, totalCount } = await getPostsByTag(params.slug, userId, currentPage, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main>
      <h1>Posts tagged with: #{params.slug}</h1>

      {posts.length === 0 && <p>No posts found for this tag.</p>}

      <ul>
        {posts.map((post: PostSummary) => (
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

      {/* ✅ Pagination component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/blog/tag/${params.slug}`}
      />
    </main>
  );
}
