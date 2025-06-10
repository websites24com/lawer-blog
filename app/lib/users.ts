import { db } from '@/app/lib/db';
import type { FullUserData, SimpleUser, Comment } from '@/app/lib/definitions';
import type { RowDataPacket } from 'mysql2';

type Params = {
  email?: string;
  providerId?: string;
};

export async function getUserWithDetails({ email, providerId }: Params): Promise<FullUserData | null> {
  let userQuery = '';
  let param: string | undefined;

  if (email) {
    userQuery = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    param = email;
  } else if (providerId) {
    return null; // no provider_account_id in DB
  }

  if (!userQuery || !param) return null;

  const [[user]] = await db.query<RowDataPacket[]>(userQuery, [param]);
  if (!user) return null;

  const [postRows] = await db.query<RowDataPacket[]>(
    `SELECT id, slug, title, status, featured_photo
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const posts = postRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    featured_photo: row.featured_photo,
  }));

  const [comments] = await db.query<RowDataPacket[]>(
    `SELECT id, name, email, message, created_at
     FROM comments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [followedPostsRows] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const followed_posts = followedPostsRows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
  }));

  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at
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
    followed_posts,
    followers: followers as SimpleUser[],
  };
}

export async function getAllUsers(): Promise<SimpleUser[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, first_name, last_name, slug, avatar_url, created_at
     FROM users
     WHERE status = 'approved'
     ORDER BY created_at DESC`
  );
  return rows as SimpleUser[];
}

// File: app/lib/users.ts
export async function getUserBySlug(
  slug: string,
  viewerId?: number // 👈 current session user ID (optional)
): Promise<FullUserData & { is_followed: boolean } | null> {
  const [firstName, lastName] = slug.trim().split('-');

  const [[user]] = await db.query<RowDataPacket[]>(
    `SELECT * FROM users WHERE first_name = ? AND last_name = ? AND status = 'approved' LIMIT 1`,
    [firstName, lastName]
  );

  if (!user) return null;

  // ✅ Check if viewer follows this user
  let is_followed = false;
  if (viewerId) {
    const [[row]] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM user_followers WHERE follower_id = ? AND followed_id = ? LIMIT 1`,
      [viewerId, user.id]
    );
    is_followed = !!row;
  }

  const [postRows] = await db.query<RowDataPacket[]>(
    `SELECT id, slug, title, status, featured_photo
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const posts = postRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    featured_photo: row.featured_photo,
  }));

  const [comments] = await db.query<RowDataPacket[]>(
    `SELECT id, name, email, message, created_at
     FROM comments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [followedPostsRows] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const followed_posts = followedPostsRows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
  }));

  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at
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
    followed_posts,
    followers: followers as SimpleUser[],
    is_followed, // ✅ NEW FIELD
  };
}

