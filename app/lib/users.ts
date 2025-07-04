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
export async function getUserWithDetails({
  email,
  providerId,
}: {
  email?: string;
  providerId?: string;
}): Promise<FullUserData | null> {
  let query = '';
  let value: string | undefined;

  if (providerId) {
    query = `
      SELECT 
        users.*, 
        countries.name AS country_name,
        states.name AS state_name,
        cities.name AS city_name
      FROM users
      LEFT JOIN countries ON users.country_id = countries.id
      LEFT JOIN states ON users.state_id = states.id
      LEFT JOIN cities ON users.city_id = cities.id
      WHERE users.provider_account_id = ?
      LIMIT 1
    `;
    value = providerId;
  } else if (email) {
    query = `
      SELECT 
        users.*, 
        countries.name AS country_name,
        states.name AS state_name,
        cities.name AS city_name
      FROM users
      LEFT JOIN countries ON users.country_id = countries.id
      LEFT JOIN states ON users.state_id = states.id
      LEFT JOIN cities ON users.city_id = cities.id
      WHERE users.email = ?
      LIMIT 1
    `;
    value = email;
  }

  if (!query || !value) return null;

  type UserJoinedRow = RowDataPacket & {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    password: string | null;
    phone: string | null;
    chat_app: string;
    avatar_url: string | null;
    avatar_alt: string | null;
    avatar_title: string | null;
    role: string;
    status: string;
    provider: string | null;
    provider_account_id: string | null;
    website: string | null;
    about_me: string | null;
    slug: string;
    created_at: string;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    location: any;
    country_name: string | null;
    state_name: string | null;
    city_name: string | null;
  };

  const [rows] = await db.query<UserJoinedRow[]>(query, [value]);
  const user = rows[0];
  if (!user) return null;

  const posts = await getPostsByUserId(user.id);

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
    chat_app: user.chat_app as any,
    provider: user.provider,
    provider_account_id: user.provider_account_id,
    role: user.role as any,
    status: user.status as any,
    created_at: user.created_at,
    website: user.website,
    about_me: user.about_me,
    slug: user.slug,
    avatar_alt: user.avatar_alt,
    avatar_title: user.avatar_title,
    country_id: user.country_id,
    state_id: user.state_id,
    city_id: user.city_id,
    location: user.location,
    country_name: user.country_name ?? null,
    state_name: user.state_name ?? null,
    city_name: user.city_name ?? null,
    posts,
    comments: comments as Comment[],
    followed_posts: followedPosts as PostSummary[],
    followers: followers as SimpleUser[],
  };
}



// 📋 Get all approved users (for public listing)
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

export async function getUsersCount(): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users WHERE status = 'approved'`
  );
  return rows[0].total || 0;
}

// 👤 Get user by slug (e.g. /users/john-doe) + viewerId to check follow status
export async function getUserBySlug(
  slug: string,
  viewerId?: number
): Promise<(FullUserData & { is_followed: boolean }) | null> {
  const [firstName, lastName] = slug.trim().split('-');

  const [users] = await db.query<RowDataPacket[]>(
    `SELECT 
       u.*, 
       co.name AS country_name,
       s.name AS state_name,
       ci.name AS city_name
     FROM users u
     LEFT JOIN countries co ON u.country_id = co.id
     LEFT JOIN states s ON u.state_id = s.id
     LEFT JOIN cities ci ON u.city_id = ci.id
     WHERE u.first_name = ? AND u.last_name = ? AND u.status = 'approved'
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
    country_id: user.country_id,
    state_id: user.state_id,
    city_id: user.city_id,
    location: user.location,
    country_name: user.country_name ?? null,
    state_name: user.state_name ?? null,
    city_name: user.city_name ?? null,
    posts,
    comments: comments as Comment[],
    followed_posts: followedPosts as PostSummary[],
    followers: followers as SimpleUser[],
    is_followed,
  };
}


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
   query = `
  SELECT 
    users.*, 
    countries.name AS country_name,
    states.name AS state_name,
    cities.name AS city_name
  FROM users
  LEFT JOIN countries ON users.country_id = countries.id
  LEFT JOIN states ON users.state_id = states.id
  LEFT JOIN cities ON users.city_id = cities.id
  WHERE users.provider_account_id = ?
  LIMIT 1
`;

    value = providerId;
  } else if (email) {
    query = 'SELECT * FROM users WHERE email = ? LIMIT 1';query = `
  SELECT 
    users.*, 
    countries.name AS country_name,
    states.name AS state_name,
    cities.name AS city_name
  FROM users
  LEFT JOIN countries ON users.country_id = countries.id
  LEFT JOIN states ON users.state_id = states.id
  LEFT JOIN cities ON users.city_id = cities.id
  WHERE users.email = ?
  LIMIT 1
`;

    value = email;
  }
  if (!query || !value) return null;

  const [users] = await db.query<RowDataPacket[]>(query, [value]);
  const user = users[0];
  if (!user) return null;

  const posts = await getPostsByUserId(user.id);
  const { data: commentRows, totalCount } = await getUserCommentsPaginated(user.id, limit, offset);

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
    country_id: user.country_id,
    state_id: user.state_id,
    city_id: user.city_id,
    location: user.location,
    posts,
    country_name: user.country_name ?? null,
state_name: user.state_name ?? null,
city_name: user.city_name ?? null,

    comments: rootComments,
    followed_posts: followedPosts as PostSummary[],
    followers: followers as SimpleUser[],
    totalComments: totalCount,
  };
}
