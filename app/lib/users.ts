// 📁 File: app/lib/users.ts
import { db } from '@/app/lib/db';
import type { FullUserData, SimpleUser, Comment, PostSummary } from '@/app/lib/definitions';
import type { RowDataPacket } from 'mysql2';

// 🔍 Utility to get all posts from a specific user
async function getPostsByUserId(userId: number): Promise<PostSummary[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, slug, title, status, featured_photo
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    featured_photo: row.featured_photo ?? null,
  }));
}

// 👤 Fetch full user profile using email or provider_account_id
export async function getUserWithDetails({ email, providerId }: { email?: string; providerId?: string; }): Promise<FullUserData | null> {
  let query = '';
  let value: string | undefined;

  // 🔎 Determine how to fetch user
  if (providerId) {
    query = 'SELECT * FROM users WHERE provider_account_id = ? LIMIT 1';
    value = providerId;
  } else if (email) {
    query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    value = email;
  }
  if (!query || !value) return null;

  const [users] = await db.query<RowDataPacket[]>(query, [value]);
  const user = users[0];
  if (!user) return null;

  const posts = await getPostsByUserId(user.id);

  // 🗨️ Get user comments + post info (slug/title) for View Post buttons
  const [comments] = await db.query<RowDataPacket[]>(
    `SELECT 
       c.id, c.message, c.created_at, c.post_id, c.parent_id,
       u.first_name, u.last_name, u.avatar_url,
       p.slug AS post_slug,
       p.title AS post_title
     FROM comments c
     JOIN users u ON c.user_id = u.id
     JOIN posts p ON c.post_id = p.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [user.id]
  );

  // ⭐ Followed posts
  const [followedPosts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug, p.featured_photo
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  // 👥 Followers (users who follow this profile)
  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?`,
    [user.id]
  );

  return {
    id: user.id,
    password: user.password,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    avatar_url: user.avatar_url,
    phone: user.phone,
    chat_app: user.chat_app,
    provider: user.provider,
    provider_account_id: user.provider_account_id,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    website: user.website,
    about_me: user.about_me,
    slug: user.slug,
    avatar_alt: user.avatar_alt,
    avatar_title: user.avatar_title,
    posts,
    comments: comments as Comment[],
    followed_posts: followedPosts as PostSummary[],
    followers: followers as SimpleUser[],
  };
}

// 📋 Get all approved users (for public listing)
// ✅ NEW: Get paginated users (for public listing)
export async function getAllUsers(limit: number, offset: number): Promise<SimpleUser[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, first_name, last_name, slug, avatar_url, created_at
     FROM users
     WHERE status = 'approved'
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows as SimpleUser[];
}

// ✅ NEW: Get total user count (for pagination)
export async function getUsersCount(): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users WHERE status = 'approved'`
  );
  return rows[0].total || 0;
}

// 👤 Get user by slug (e.g. /users/john-doe) + viewerId to check follow status
export async function getUserBySlug(slug: string, viewerId?: number): Promise<(FullUserData & { is_followed: boolean }) | null> {
  const [firstName, lastName] = slug.trim().split('-');

  const [users] = await db.query<RowDataPacket[]>(
    `SELECT * FROM users
     WHERE first_name = ? AND last_name = ? AND status = 'approved'
     LIMIT 1`,
    [firstName, lastName]
  );
  const user = users[0];
  if (!user) return null;

  // ✅ Check if viewer follows this user
  let is_followed = false;
  if (viewerId) {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM user_followers
       WHERE follower_id = ? AND followed_id = ? LIMIT 1`,
      [viewerId, user.id]
    );
    is_followed = rows.length > 0;
  }

  const posts = await getPostsByUserId(user.id);

  // 🗨️ Fetch comments with post title and slug for context
  const [comments] = await db.query<RowDataPacket[]>(
    `SELECT 
       c.id, c.message, c.created_at, c.post_id, c.parent_id,
       u.first_name, u.last_name, u.avatar_url,
       p.slug AS post_slug,
       p.title AS post_title
     FROM comments c
     JOIN users u ON c.user_id = u.id
     JOIN posts p ON c.post_id = p.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [user.id]
  );

  const [followedPosts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug, p.featured_photo
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?`,
    [user.id]
  );

  return {
    id: user.id,
    password: user.password,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    avatar_url: user.avatar_url,
    phone: user.phone,
    chat_app: user.chat_app,
    provider: user.provider,
    provider_account_id: user.provider_account_id,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    website: user.website,
    about_me: user.about_me,
    slug: user.slug,
    avatar_alt: user.avatar_alt,
    avatar_title: user.avatar_title,
    posts,
    comments: comments as Comment[],
    followed_posts: followedPosts as PostSummary[],
    followers: followers as SimpleUser[],
    is_followed,
  };
}

// ⬇️⬇️⬇️ NEW PAGINATED HELPERS ⬇️⬇️⬇️

// 🧩 Paginated user posts
export async function getUserPostsPaginated(userId: number, limit: number, offset: number): Promise<{ data: PostSummary[]; totalCount: number }> {
  const [posts] = await db.query<RowDataPacket[]>(
    `SELECT id, slug, title, status, featured_photo
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const [countResult] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM posts WHERE user_id = ?`,
    [userId]
  );

  return {
    data: posts as PostSummary[],
    totalCount: countResult[0].total || 0,
  };
}

// 🧩 Paginated user comments
export async function getUserCommentsPaginated(userId: number, limit: number, offset: number): Promise<{ data: Comment[]; totalCount: number }> {
  const [comments] = await db.query<RowDataPacket[]>(
    `SELECT 
       c.id, c.message, c.created_at, c.post_id, c.parent_id,
       u.first_name, u.last_name, u.avatar_url,
       p.slug AS post_slug,
       p.title AS post_title
     FROM comments c
     JOIN users u ON c.user_id = u.id
     JOIN posts p ON c.post_id = p.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const [countResult] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM comments WHERE user_id = ?`,
    [userId]
  );

  return {
    data: comments as Comment[],
    totalCount: countResult[0].total || 0,
  };
}

// 🧩 Paginated followed posts
export async function getFollowedPostsPaginated(userId: number, limit: number, offset: number): Promise<{ data: PostSummary[]; totalCount: number }> {
  const [posts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug, p.featured_photo
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const [countResult] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM followed_posts
     WHERE user_id = ?`,
    [userId]
  );

  return {
    data: posts as PostSummary[],
    totalCount: countResult[0].total || 0,
  };
}

// 🧩 Paginated followers
export async function getFollowersPaginated(userId: number, limit: number, offset: number): Promise<{ data: SimpleUser[]; totalCount: number }> {
  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const [countResult] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM user_followers
     WHERE followed_id = ?`,
    [userId]
  );

  return {
    data: followers as SimpleUser[],
    totalCount: countResult[0].total || 0,
  };
}




// 🧩 NEW: get full user data with paginated comments
export async function getUserWithDetailsPaginated({
  email,
  providerId,
  offset,
  limit,
}: {
  email?: string;
  providerId?: string;
  offset: number;
  limit: number;
}): Promise<(FullUserData & { totalComments: number }) | null> {
  let query = '';
  let value: string | undefined;

  if (providerId) {
    query = 'SELECT * FROM users WHERE provider_account_id = ? LIMIT 1';
    value = providerId;
  } else if (email) {
    query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    value = email;
  }
  if (!query || !value) return null;

  const [users] = await db.query<RowDataPacket[]>(query, [value]);
  const user = users[0];
  if (!user) return null;

  const posts = await getPostsByUserId(user.id);

  // ⭐ Paginated comments with post + user info
  const { data: commentRows, totalCount } = await getUserCommentsPaginated(user.id, limit, offset);

  // 🧩 Build nested comment tree
  const commentMap = new Map<number, Comment & { replies: Comment[] }>();
  const rootComments: (Comment & { replies: Comment[] })[] = [];

  for (const row of commentRows) {
    const enrichedComment: Comment & { replies: Comment[] } = { ...row, replies: [] };
    commentMap.set(row.id, enrichedComment);
  }

  for (const comment of commentMap.values()) {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  }

  const [followedPosts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug, p.featured_photo
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?`,
    [user.id]
  );

  return {
    id: user.id,
    password: user.password,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    avatar_url: user.avatar_url,
    phone: user.phone,
    chat_app: user.chat_app,
    provider: user.provider,
    provider_account_id: user.provider_account_id,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    website: user.website,
    about_me: user.about_me,
    slug: user.slug,
    avatar_alt: user.avatar_alt,
    avatar_title: user.avatar_title,
    posts,
    comments: rootComments, // ⬅️ Nested structure
    followed_posts: followedPosts as PostSummary[],
    followers: followers as SimpleUser[],
    totalComments: totalCount,
  };
}
