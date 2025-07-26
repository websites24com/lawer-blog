import { auth } from '@/app/lib/auth/auth';
import { getAllApprovedPosts, getApprovedPostCount } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';
import FollowButton from '@/app/components/blog/posts/FollowPostButton';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';

import Pagination from '@/app/components/global/pagination/Pagination';
import Link from 'next/link';
import AuthorInfo from '@/app/components/user/AuthorInfo';


function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: {
  page?: string;
  city?: string;
  state?: string;
  country?: string;
};

}) {
  const session = await auth();
  const userId = session?.user?.id || 0;

  const currentPage = Number(searchParams?.page) || 1;
  const pageSize = 3;

  const posts: PostSummary[] = await getAllApprovedPosts(userId, currentPage, pageSize);
  const totalPosts = await getApprovedPostCount(userId); // ✅ Pass viewerId

  const totalPages = Math.ceil(totalPosts / pageSize);

  return (
    <main>
      <h1>Blog</h1>

      {posts.length === 0 && <p>No posts found.</p>}

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
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

            {/* ✅ Author Info injected here */}
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
        basePath="/blog"
      />
    </main>
  );
}