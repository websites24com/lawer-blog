import Link from 'next/link';
import { getAllPosts } from '@/app/lib/posts';
import type { PostSummary } from '@/app/lib/definitions';

export default async function BlogPage() {
  const posts: PostSummary[] = await getAllPosts();

  return (
    <main>
      <h1>Blog</h1>
      {posts.length === 0 && <p>No posts found.</p>}
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            <p>
              {new Date(post.created_at).toLocaleDateString()} • {post.category} • {post.author}
            </p>
            <p>{post.excerpt}...</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
