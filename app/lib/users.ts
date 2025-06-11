// app/lib/users.ts

import { db } from '@/app/lib/db';
import type {
  FullUserData,
  SimpleUser,
  Comment,
  PostSummary,
} from '@/app/lib/definitions';
import type { RowDataPacket } from 'mysql2';

// ✅ Fetch user's posts (id, slug, title, status, featured_photo)
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

// ✅ Main user fetcher by email or provider_account_id
type Params = {
  email?: string;
  providerId?: string;
};

export async function getUserWithDetails({
  email,
  providerId,
}: Params): Promise<FullUserData | null> {
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

  const [comments] = await db.query<RowDataPacket[]>(
    `SELECT id, name, email, message, created_at
     FROM comments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [followedPosts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug
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
  };
}

// ✅ Public user list with limited fields (for /users)
export async function getAllUsers(): Promise<SimpleUser[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, first_name, last_name, slug, avatar_url, created_at
     FROM users
     WHERE status = 'approved'
     ORDER BY created_at DESC`
  );
  return rows as SimpleUser[];
}

// ✅ Fetch full user profile by slug (e.g. /users/john-doe)
export async function getUserBySlug(
  slug: string,
  viewerId?: number
): Promise<(FullUserData & { is_followed: boolean }) | null> {
  const [firstName, lastName] = slug.trim().split('-');

  const [users] = await db.query<RowDataPacket[]>(
    `SELECT * FROM users
     WHERE first_name = ? AND last_name = ? AND status = 'approved'
     LIMIT 1`,
    [firstName, lastName]
  );
  const user = users[0];
  if (!user) return null;

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

  const [comments] = await db.query<RowDataPacket[]>(
    `SELECT id, name, email, message, created_at
     FROM comments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [followedPosts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug
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
