// app/lib/posts.ts
import { db } from '@/app/lib/db';
import type { PostSummary, PostWithDetails } from '@/app/lib/definitions';

export async function getAllPosts(): Promise<PostSummary[]> {
  const [rows] = await db.query(`
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      LEFT(posts.content, 200) AS excerpt,
      posts.created_at,
      categories.name AS category,
      authors.name AS author,
      authors.avatar_url
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN authors ON posts.author_id = authors.id
    ORDER BY posts.created_at DESC
  `);
  return rows as PostSummary[];
}

export async function getPostBySlug(slug: string): Promise<PostWithDetails | null> {
  const [rows] = await db.query<any[]>(`
    SELECT 
      posts.*, 
      categories.name AS category,
      authors.name AS author,
      authors.bio AS author_bio,
      authors.avatar_url
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN authors ON posts.author_id = authors.id
    WHERE posts.slug = ?
  `, [slug]);

  const post = rows[0];
  if (!post) return null;

  const [comments] = await db.query<any[]>(`
    SELECT name, email, message, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC
  `, [post.id]);

  return {
    ...post,
    comments
  } as PostWithDetails;
}
