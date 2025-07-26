import { auth } from '@/app/lib/auth/auth';
import { getPostsByStateSlug } from '@/app/lib/posts';
import { PostSummary } from '@/app/lib/definitions';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FollowButton from '@/app/components/blog/posts/FollowPostButton';
import Pagination from '@/app/components/global/pagination/Pagination';
import AuthorInfo from '@/app/components/user/AuthorInfo';
import Link from 'next/link';
import { capitalizeFirstLetter } from '@/app/utils/capitalizeFirstLetter';
import BlockedProfileNotice from '@/app/components/user/BlockProfileNotice'; // ✅ FIXED

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

type Props = {
  params: { slug: string };
  searchParams?: { page?: string };
};

export default async function StatePage({ params, searchParams }: Props) {
  const session = await auth();
  const userId = session?.user?.id || 0;
  const currentPage = Number(searchParams?.page) || 1;
  const pageSize = 3;

  const { posts, totalCount, blocked } = await getPostsByStateSlug( // ✅ FIXED
    params.slug,
    userId,
    currentPage,
    pageSize
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  if (blocked) return <BlockedProfileNotice />; // ✅ FIXED

  if (totalCount === 0) return <p>No posts found for this state.</p>;

  return (
    <main>
      <h1>Posts from State: {capitalizeFirstLetter(params.slug)}</h1>

      {posts.length === 0 && <p>No posts found for this state.</p>}

      <ul>
        {posts.map((post: PostSummary) => (
          <li key={post.id} style={{ marginBottom: '2rem' }}>
            {/* ✅ Featured Image */}
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

            {/* ✅ Title */}
            <Link href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
            </Link>

            {/* ✅ Excerpt */}
            <p>{stripHtml(post.excerpt)}...</p>

            {/* ✅ Author Info */}
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

            {/* ✅ Follow Button */}
            <FollowButton postId={post.id} initiallyFollowing={post.followed_by_current_user} />
          </li>
        ))}
      </ul>

      {/* ✅ Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/blog/location/state/${encodeURIComponent(decodeURIComponent(params.slug))}`}
      />
    </main>
  );
}
