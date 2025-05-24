import Link from 'next/link';
import Image from 'next/image';
import { getAllApprovedPosts } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';
import FollowButton from '@/app/components/FollowButton';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export default async function BlogPage() {
  const posts: PostSummary[] = await getAllApprovedPosts();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {posts.length === 0 && <p>No posts found.</p>}

      <ul className="space-y-12">
        {posts.map((post) => (
          <li key={post.id}>
            {post.featured_photo && (
              <Link href={`/blog/${post.slug}`}>
                <Image
                  src={`/uploads/posts/${post.featured_photo}`}
                  alt={post.title}
                  width={300}
                  height={200}
                  className="rounded-md object-cover w-full aspect-[16/9]"
                />
              </Link>
            )}

            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold mt-4 hover:underline">{post.title}</h2>
            </Link>

            <p className="text-sm text-gray-600 mt-1">
              {new Date(post.created_at).toLocaleDateString()} • {post.category} •{' '}
              {post.user.first_name} {post.user.last_name}
            </p>

            <div className="mt-2">
              <FollowButton
                postId={post.id}
                initiallyFollowing={post.followed_by_current_user}
              />
            </div>

            <p className="mt-3 text-gray-800">{stripHtml(post.excerpt)}...</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
