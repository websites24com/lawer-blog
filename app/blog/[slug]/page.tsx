import { getPostBySlug } from '@/app/lib/posts';
import type { PostWithDetails } from '@/app/types/posts';
import { notFound } from 'next/navigation';
import Image from 'next/image';

type Props = {
  params: { slug: string };
};

export default async function BlogPostPage({ params }: Props) {
  const post: PostWithDetails | null = await getPostBySlug(params.slug);
  if (!post) return notFound();

  return (
    <main>
      <h1>{post.title}</h1>
      <div>
        {post.avatar_url && (
          <Image
            src={post.avatar_url}
            alt={post.author}
            width={50}
            height={50}
          />
        )}
        <p>
          {post.author} — {post.author_bio}
        </p>
        <p>
          {new Date(post.created_at).toLocaleDateString()} • {post.category}
        </p>
      </div>

      <article>
        {post.content}
      </article>

      <section>
        <h2>Comments</h2>
        {post.comments.length === 0 && <p>No comments yet.</p>}
        <ul>
          {post.comments.map((comment, idx) => (
            <li key={idx}>
              <p><strong>{comment.name}</strong> ({comment.email || 'anonymous'})</p>
              <p>{comment.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
