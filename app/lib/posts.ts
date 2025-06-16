import { db } from '@/app/lib/db';
import type { PostSummary, PostWithDetails } from '@/app/lib/definitions';

// ✅ Public - Approved posts
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
      users.slug AS user_slug,
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
    status: 'approved',
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      slug: row.user_slug,
    },
  }));
}

// ✅ To user dashboard - All posts
export async function getAllPosts(userId: number): Promise<PostSummary[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.status,
      LEFT(posts.content, 200) AS excerpt,
      posts.created_at,
      posts.featured_photo,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,
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
    status: row.status,
    excerpt: row.excerpt,
    created_at: row.created_at,
    featured_photo: row.featured_photo,
    category: row.category,
    followed_by_current_user: !!row.followed_by_current_user,
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      slug: row.user_slug,
    },
  }));
}

// ✅ Get post with all details for editing or viewing
// app/lib/posts.ts



export async function getPostBySlug(slug: string, viewerId: number): Promise<PostWithDetails | null> {
  // ✅ Get main post info
  const [rows] = await db.query(
    `
    SELECT 
      p.*, 
      c.name AS category,
      u.first_name, u.last_name, u.slug AS user_slug, u.avatar_url,
      EXISTS (
        SELECT 1 FROM followed_posts fp
        WHERE fp.post_id = p.id AND fp.user_id = ?
      ) AS followed_by_current_user
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.slug = ?
    LIMIT 1
    `,
    [viewerId, slug]
  );

  const post = (rows as any[])[0];
  if (!post) return null;

  // ✅ Attach nested user object
  post.user = {
    first_name: post.first_name,
    last_name: post.last_name,
    slug: post.user_slug,
    avatar_url: post.avatar_url,
  };

  // Clean flat fields
  delete post.first_name;
  delete post.last_name;
  delete post.user_slug;
  delete post.avatar_url;

  // ✅ Get all approved comments (top-level + replies)
  const [allComments] = await db.query<any[]>(
    `
    SELECT 
      cm.id, cm.post_id, cm.user_id, cm.parent_id, cm.message AS content, cm.created_at,
      u.first_name, u.last_name, u.slug AS user_slug, u.avatar_url
    FROM comments cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.post_id = ? AND cm.status = 'approved'
    ORDER BY cm.created_at ASC
    `,
    [post.id]
  );

  // ✅ Build nested comment tree
  const commentMap: { [id: number]: any } = {};
  const rootComments: any[] = [];

  allComments.forEach((comment) => {
    // Attach user info
    comment.user = {
      first_name: comment.first_name,
      last_name: comment.last_name,
      slug: comment.user_slug,
      avatar_url: comment.avatar_url,
    };

    delete comment.first_name;
    delete comment.last_name;
    delete comment.user_slug;
    delete comment.avatar_url;

    comment.replies = [];
    commentMap[comment.id] = comment;

    if (!comment.parent_id) {
      rootComments.push(comment);
    }
  });

  allComments.forEach((comment) => {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      commentMap[comment.parent_id].replies.push(comment);
    }
  });

  // ✅ Attach to post
  post.comments = rootComments;

  return post as PostWithDetails;
}


// ✅ All categories
export async function getAllCategories(): Promise<{ id: number; name: string }[]> {
  const [rows] = await db.query('SELECT id, name FROM categories ORDER BY name ASC');
  return rows as { id: number; name: string }[];
}
