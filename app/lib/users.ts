import { db } from '@/app/lib/db';
import type { FullUserData, SimpleUser, PostSummary, Comment } from '@/app/lib/definitions';
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
    userQuery = 'SELECT * FROM users WHERE provider_account_id = ? LIMIT 1';
    param = providerId;
  }

  if (!userQuery || !param) return null;

  const [[user]] = await db.query<RowDataPacket[]>(userQuery, [param]);
  if (!user) return null;

  const [posts] = await db.query<PostSummary[]>(
    `SELECT id, slug, title, status
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [comments] = await db.query<Comment[]>(
    `SELECT id, name, email, message, created_at
     FROM comments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [followed_posts] = await db.query<PostSummary[]>(
    `SELECT p.id, p.title, p.slug
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const [followers] = await db.query<SimpleUser[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?`,
    [user.id]
  );

  return {
    id: user.id,
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
    posts,
    comments,
    followed_posts,
    followers,
  };
}

export async function getAllUsers(): Promise<SimpleUser[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT id, first_name, last_name, slug, avatar_url, created_at
    FROM users
    WHERE status = 'approved'
    ORDER BY created_at DESC
    `
  );
  console.log('[getAllUsers] rows:', rows); // ✅ good for debugging
  return rows as SimpleUser[];
}

// This function gets user by their slug (first_name + last_name)
export async function getUserBySlug(slug: string): Promise<FullUserData | null> {
  const [firstName, lastName] = slug.trim().split(' ');

  const [[user]] = await db.query<RowDataPacket[]>(
    `SELECT * FROM users WHERE first_name = ? AND last_name = ? AND status = 'approved' LIMIT 1`,
    [firstName, lastName]
  );

  if (!user) return null;

  const [posts] = await db.query<PostSummary[]>(
    `SELECT id, slug, title, status
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [comments] = await db.query<Comment[]>(
    `SELECT id, name, email, message, created_at
     FROM comments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const [followed_posts] = await db.query<PostSummary[]>(
    `SELECT p.id, p.title, p.slug
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const [followers] = await db.query<SimpleUser[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?`,
    [user.id]
  );

  return {
    id: user.id,
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
    posts,
    comments,
    followed_posts,
    followers,
  };
}


