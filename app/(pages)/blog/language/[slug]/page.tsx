import { auth } from '@/app/lib/auth/auth';
import { getPostsByLanguageSlug } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FollowButton from '@/app/components/blog/posts/FollowPostButton';
import Pagination from '@/app/components/global/pagination/Pagination';
import AuthorInfo from '@/app/components/user/AuthorInfo';
import Link from 'next/link';
import { capitalizeFirstLetter } from '@/app/utils/capitalizeFirstLetter';
import BlockedProfileNotice from '@/app/components/user/BlockProfileNotice'; // ✅ NEW

// ✅ Strip HTML tags from excerpt
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

type LanguagePageProps = {
  params: { slug: string };
  searchParams?: { page?: string };
};

export default async function LanguagePage({ params, searchParams }: LanguagePageProps) {
  const session = await auth();
  const userId = session?.user?.id || 0;
  const currentPage = Number(searchParams?.page) || 1;
  const pageSize = 3;

  // ✅ Now fetch posts and block status using updated function
  const { posts, totalCount, blocked } = await getPostsByLanguageSlug(params.slug, userId, currentPage, pageSize); // ✅ NEW
  const totalPages = Math.ceil(totalCount / pageSize);

  // ✅ Show block notice if viewer is blocked by author(s)
  if (blocked) return <BlockedProfileNotice />; // ✅ NEW

  // ✅ Show message if there are no posts
  if (totalCount === 0) {
    return <p>No posts found for this language.</p>; // ✅ NEW
  }

  return (
    <main>
      <h1>Posts written in: {capitalizeFirstLetter(params.slug)}</h1>

      {posts.length === 0 && <p>No posts found for this language.</p>}

      <ul>
        {posts.map((post: PostSummary) => (
          <li key={post.id} style={{ marginBottom: '2rem' }}>
            {/* ✅ Featured image */}
            <Link href={`/blog/${post.slug}`}>
              <div style={{ borderBottom: '1px solid #ccc', padding: '1rem 0' }}>
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

            {/* ✅ Title */}
            <Link href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
            </Link>

            {/* ✅ Excerpt */}
            <p>{stripHtml(post.excerpt)}...</p>

            {/* ✅ AuthorInfo block */}
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

            {/* ✅ Follow button */}
            <FollowButton
              postId={post.id}
              initiallyFollowing={post.followed_by_current_user}
            />
          </li>
        ))}
      </ul>

      {/* ✅ Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/blog/language/${encodeURIComponent(decodeURIComponent(params.slug))}`}
      />
    </main>
  );
}
