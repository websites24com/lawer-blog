'use server';

import { deletePost } from '@/app/lib/admin';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import type { PostWithDetails, PostRow, CategoryRow } from '@/app/lib/definitions';

export async function deletePostAction(postId: number) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await deletePost(postId);
}

export async function updatePostStatus(postId: number, status: 'approved' | 'declined') {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await db.query(
    `UPDATE posts SET status = ?, updated_at = NOW() WHERE id = ?`,
    [status, postId]
  );
}

export async function getPostById(id: number): Promise<PostWithDetails> {
  const query = `
    SELECT
      posts.id,
      posts.slug,
      posts.title,
      posts.content,
      posts.excerpt,
      posts.created_at,
      posts.updated_at,
      posts.featured_photo,
      posts.status,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `;

  const [rows] = await db.query(query, [id]) as [PostRow[], any];

  const post = rows[0];

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    created_at: post.created_at,
    updated_at: post.updated_at,
    featured_photo: post.featured_photo,
    status: post.status,
    category: post.category,
    followed_by_current_user: false,
    user: {
      first_name: post.first_name,
      last_name: post.last_name,
      avatar_url: post.avatar_url,
    },
    comments: []
  };
}

export async function updatePost(
  id: number,
  data: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    status: 'pending' | 'approved' | 'draft' | 'declined';
    featured_photo: string;
  }
): Promise<void> {
  const [rows] = await db.query('SELECT id FROM categories WHERE name = ? LIMIT 1', [data.category]) as [CategoryRow[], any];

  const category_id = rows[0]?.id || null;

  await db.query(
    `UPDATE posts SET title = ?, excerpt = ?, content = ?, featured_photo = ?, status = ?, category_id = ? WHERE id = ?`,
    [
      data.title,
      data.excerpt,
      data.content,
      data.featured_photo,
      data.status,
      category_id,
      id
    ]
  );
}
