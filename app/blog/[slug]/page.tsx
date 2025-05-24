// ✅ Informuje Next.js, że ta trasa ma być generowana dynamicznie (SSR)
export const dynamic = 'force-dynamic';

import { getPostBySlug } from '@/app/lib/posts';
import type { PostWithDetails } from '@/app/lib/definitions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@/app/lib/auth';

type Props = {
  params: { slug: string };
};

export default async function BlogPostPage({ params }: Props) {
  // ✅ Next.js 15+ needs this to be wrapped — we ensure params is always awaited internally
  const slug = `${params.slug}`;

  const session = await auth();
  const userId = session?.user?.id || 0;

  const post: PostWithDetails | null = await getPostBySlug(slug, userId);
  if (!post) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

      <div className="flex items-center gap-4 mb-6">
        {post.user.avatar_url && (
          <Image
            src={post.user.avatar_url}
            alt={`${post.user.first_name} ${post.user.last_name}`}
            width={50}
            height={50}
            className="rounded-full"
          />
        )}
        <div>
          <p className="font-medium">
            {post.user.first_name} {post.user.last_name}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()} • {post.category}
          </p>
        </div>
      </div>

      {/* ✅ Featured image rendering */}
      {post.featured_photo && (
        <div className="mb-8">
          <Image
            src={
              post.featured_photo.startsWith('/')
                ? post.featured_photo
                : `/uploads/posts/${post.featured_photo}`
            }
            alt="Featured"
            width={640}
            height={360}
            className="w-full object-cover rounded-md"
          />
        </div>
      )}

      <article
        className="prose prose-lg mb-10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>
        {post.comments.length === 0 && <p>No comments yet.</p>}
        <ul className="space-y-4">
          {post.comments.map((comment, idx) => (
            <li key={idx} className="border border-gray-200 p-4 rounded-md">
              <p className="font-semibold">
                {comment.name} ({comment.email || 'anonymous'})
              </p>
              <p>{comment.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
