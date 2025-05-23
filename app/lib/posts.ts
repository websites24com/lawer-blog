import { db } from '@/app/lib/db';
import type { PostSummary, PostWithDetails } from '@/app/lib/definitions';


// Public 

export async function getAllApprovedPosts(userId?: number): Promise<PostSummary[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      LEFT(posts.content, 200) AS excerpt,
      posts.created_at,
      posts.featured_photo,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url,
      ${
        userId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(userId)} AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.status = 'approved'
    ORDER BY posts.created_at DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    created_at: row.created_at,
    featured_photo: row.featured_photo,
    category: row.category,
    followed_by_current_user: !!row.followed_by_current_user,
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
    },
  }));
}


// To user dashboard

export async function getAllPosts(userId: number): Promise<PostSummary[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      LEFT(posts.content, 200) AS excerpt,
      posts.created_at,
      posts.featured_photo,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url,
      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ? AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    created_at: row.created_at,
    featured_photo: row.featured_photo,
    category: row.category,
    followed_by_current_user: !!row.followed_by_current_user,
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
    },
  }));
}

export async function getPostBySlug(slug: string, userId: number): Promise<PostWithDetails | null> {
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.*,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url,
      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ? AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.slug = ?
    LIMIT 1
  `,
    [userId, slug]
  );

  const post = rows[0];
  if (!post) return null;

  const [comments] = await db.query<any[]>(
    `SELECT name, email, message, created_at 
     FROM comments 
     WHERE post_id = ? 
     ORDER BY created_at DESC`,
    [post.id]
  );

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
    followed_by_current_user: !!post.followed_by_current_user,
    user: {
      first_name: post.first_name,
      last_name: post.last_name,
      avatar_url: post.avatar_url,
    },
    comments,
  };
}

