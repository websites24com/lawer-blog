import { db } from './db';
import type { UserRow, PostSummary, Comment } from './definitions';

export async function getUserWithDetails({
  email,
  providerId,
}: {
  email?: string;
  providerId?: string;
}): Promise<(UserRow & {
  posts: PostSummary[];
  comments: Comment[];
  followed_posts: PostSummary[];
}) | null> {
  if (!email && !providerId) {
    throw new Error('Missing identifier: email or providerId required');
  }

  const query = email
    ? 'SELECT * FROM users WHERE email = ? LIMIT 1'
    : 'SELECT * FROM users WHERE provider_account_id = ? LIMIT 1';
  const value = email || providerId;

  const [rows] = await db.query(query, [value]);
  const user = (rows as any[])[0];

  if (!user) return null;

  // Fix bad phone formatting
  if (user.phone === 'null') user.phone = null;

  // Format as UserRow
  const userRow: UserRow = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    password: user.password,
    phone: user.phone,
    chat_app: user.chat_app,
    avatar_url: user.avatar_url,
    role: user.role,
    status: user.status,
    provider: user.provider,
    provider_account_id: user.provider_account_id,
    created_at: user.created_at,
  };

  const [posts] = await db.query(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.created_at, c.name AS category,
            u.first_name, u.last_name, u.avatar_url, p.featured_photo, p.status
     FROM posts p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const formattedPosts: PostSummary[] = (posts as any[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    created_at: p.created_at,
    category: p.category,
    user: {
      first_name: p.first_name,
      last_name: p.last_name,
    },
    avatar_url: p.avatar_url,
    featured_photo: p.featured_photo,
    status: p.status,
    followed_by_current_user: false,
  }));

  const [comments] = await db.query(
    `SELECT id, message, created_at, name, email
     FROM comments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user.id]
  );

  const formattedComments: Comment[] = (comments as any[]).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    message: c.message,
    created_at: c.created_at,
  }));

  const [followed] = await db.query(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.created_at, c.name AS category,
            u.first_name, u.last_name, u.avatar_url, p.featured_photo, p.status
     FROM followed_posts f
     JOIN posts p ON f.post_id = p.id
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE f.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  const followedPosts: PostSummary[] = (followed as any[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    created_at: p.created_at,
    category: p.category,
    user: {
      first_name: p.first_name,
      last_name: p.last_name,
    },
    avatar_url: p.avatar_url,
    featured_photo: p.featured_photo,
    status: p.status,
    followed_by_current_user: true,
  }));

  return {
    ...userRow,
    posts: formattedPosts,
    comments: formattedComments,
    followed_posts: followedPosts,
  };
}
