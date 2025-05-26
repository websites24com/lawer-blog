import { db } from '@/app/lib/db';
import type { PostSummary, Category } from '@/app/lib/definitions';

export async function getAllPostsForAdmin(): Promise<PostSummary[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      LEFT(posts.content, 200) AS excerpt,
      posts.created_at,
      posts.status,
      posts.featured_photo,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
    `
  );

  return (rows as any[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    created_at: row.created_at,
    featured_photo: row.featured_photo,
    category: row.category,
    status: row.status,
    followed_by_current_user: false,
    avatar_url: row.avatar_url,
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
    },
  }));
}

export async function deletePost(postId: number): Promise<void> {
  await db.query('DELETE FROM posts WHERE id = ?', [postId]);
}

export async function getAllCategories(): Promise<Category[]> {
  const [rows] = await db.query<any[]>('SELECT id, name FROM categories ORDER BY name');
  return rows as Category[];
}
