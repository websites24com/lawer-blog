import { auth } from '@/app/lib/auth/auth';
import { getPostsByCategorySlug } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';

import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FollowButton from '@/app/components/blog/posts/FollowPostButton';
import Pagination from '@/app/components/global/pagination/Pagination';
import AuthorInfo from '@/app/components/user/AuthorInfo';
import { capitalizeFirstLetter } from '@/app/utils/capitalizeFirstLetter';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlockedProfileNotice from '@/app/components/user/BlockProfileNotice';

// ✅ Strip HTML from excerpt safely
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

type CategoryPageProps = {
  params: { slug: string };
  searchParams?: { page?: string };
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const session = await auth();
  const userId = session?.user?.id || 0;
  const currentPage = Number(searchParams?.page) || 1;
  const pageSize = 3;

  // ✅ Get posts + blocked info
  const { posts, totalCount, blocked } = await getPostsByCategorySlug(params.slug, userId, currentPage, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  // ✅ Show blocked notice if blocked
  if (blocked) return <BlockedProfileNotice />;

  // ✅ Not blocked but truly empty
  if (totalCount === 0) return notFound();

  return (
    <main>
      <h1>Posts in category: {capitalizeFirstLetter(params.slug)}</h1>

      {posts.length === 0 && <p>No posts found for this category.</p>}

      <ul>
        {posts.map((post: PostSummary) => (
          <li key={post.id} style={{ marginBottom: '2rem' }}>
            <Link href={`/blog/${post.slug}`}>
              <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
                {post.featured_photo && (
                  <div className="image-wrapper">
                    <ImageWithFallback
                      src={post.featured_photo}
                      alt={post.photo_alt || 'Featured Post'}
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

            <p>{stripHtml(post.excerpt)}...</p>

            <AuthorInfo
              user_slug={post.user.slug}
              first_name={post.user.first_name}
              last_name={post.user.last_name}
              avatar_url={post.user.avatar_url}
              created_at={post.created_at}
              category={post.category}
              language={post.language}
              country_name={post.country_name}
              state_name={post.state_name}
              city_name={post.city_name}
            />

            <FollowButton
              postId={post.id}
              initiallyFollowing={post.followed_by_current_user}
            />
          </li>
        ))}
      </ul>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/blog/category/${encodeURIComponent(decodeURIComponent(params.slug))}`}
      />
    </main>
  );
}
