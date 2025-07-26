import { db } from '@/app/lib/db';
import type { FullUserData, SimpleUser, Comment, PostSummary } from '@/app/lib/definitions';
import { getBlockedUsers, getBlockedByUsers, isUserBlocked } from '@/app/lib/users/block';

import type { RowDataPacket } from 'mysql2';

// 🔍 Utility to get all posts from a specific user
// 🔍 Utility to get all posts from a specific user (blocking-aware)
export async function getPostsByUserId(
  userId: number,
  viewerId?: number // ✅ NEW: Viewer context for reverse blocking
): Promise<PostSummary[]> {
  // 🔐 Step 1: Check if viewer is blocked or blocks this user
  if (viewerId) {
    const isBlocked = await isUserBlocked(viewerId, userId); // ✅ Reverse block check
    if (isBlocked) {
      // ⛔ Access denied — return no posts
      return [];
    }
  }

  // ✅ Step 2: Fetch all posts normally
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, slug, title, status, featured_photo
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  // ✅ Step 3: Map DB rows to PostSummary format
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
  viewerId, // ✅ NEW: Accept the viewer's user ID to check for reverse blocking
}: {
  email?: string;
  providerId?: string;
  viewerId?: number; // ✅ NEW: viewerId is optional (for unauthenticated access)
}): Promise<FullUserData | null> {
  let query = '';
  let value: string | undefined;

  // 🟡 Determine the query depending on whether providerId or email is used
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

  // 🔴 If no valid query or identifier is provided, return null
  if (!query || !value) return null;

  // 📦 Fetch user with joined location data
  const [rows] = await db.query<UserJoinedRow[]>(query, [value]);
  const user = rows[0];

  // 🔴 Return null if user not found
  if (!user) return null;

  // 🔐 ✅ REVERSE BLOCKING ENFORCEMENT
  // If viewerId is defined, check if either:
  // - viewer has blocked this user
  // - this user has blocked the viewer
  if (viewerId) {
    const isBlocked = await isUserBlocked(viewerId, user.id); // ✅ NEW: Check block status between viewer and user
    if (isBlocked) return null; // ✅ NEW: Hide all data if blocking is active
  }

  // ✅ Fetch this user's own posts
  const posts = await getPostsByUserId(user.id);

  // ✅ Fetch this user's own comments
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

  // ✅ Posts the user follows
  const [followedPosts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug, p.featured_photo
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  // ✅ Users who follow this user
  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?`,
    [user.id]
  );

  // ✅ Block data for the user
  const blocked_users = await getBlockedUsers(user.id);
  const blocked_by = await getBlockedByUsers(user.id);

  // ✅ Return full user object
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
    // ✅ Also return block info
    blocked_users,
    blocked_by,
  };
}

// 📋 Get all approved users (for public listing)
export async function getAllUsers(
  limit: number,
  offset: number,
  viewerId?: number
): Promise<SimpleUser[]> {
  let excludeIds: number[] = [];

  // If viewerId is provided, fetch both users they blocked and users who blocked them
  if (viewerId) {
    // Users that the viewer has blocked
    const [blockedRows] = await db.query(
      `SELECT u.id
       FROM blocked_users bu
       JOIN users u ON u.id = bu.blocked_id
       WHERE bu.blocker_id = ?`,
      [viewerId]
    );

    // Users that have blocked the viewer
    const [blockedByRows] = await db.query(
      `SELECT u.id
       FROM blocked_users bu
       JOIN users u ON u.id = bu.blocker_id
       WHERE bu.blocked_id = ?`,
      [viewerId]
    );

    // Extract IDs from both result sets and merge them into a unique set
    const blockedIds = blockedRows.map((u: any) => u.id);
    const blockedByIds = blockedByRows.map((u: any) => u.id);
    excludeIds = [...new Set([...blockedIds, ...blockedByIds])];
  }

  // Prepare dynamic SQL depending on whether there are users to exclude
  const placeholders = excludeIds.map(() => '?').join(','); // e.g., "?, ?, ?"
  const sql = `
    SELECT id, first_name, last_name, slug, avatar_url, created_at
    FROM users
    WHERE status = 'approved'
    ${excludeIds.length > 0 ? `AND id NOT IN (${placeholders})` : ''}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  // Final parameters: excluded IDs, followed by pagination controls
  const [rows] = await db.query(sql, [...excludeIds, limit, offset]);
  return rows as SimpleUser[];
}

export async function getUsersCount(viewerId?: number): Promise<number> {
  let excludeIds: number[] = [];

  // If viewerId is provided, compute users to exclude from count
  if (viewerId) {
    // Users blocked by the viewer
    const [blockedRows] = await db.query(
      `SELECT u.id
       FROM blocked_users bu
       JOIN users u ON u.id = bu.blocked_id
       WHERE bu.blocker_id = ?`,
      [viewerId]
    );

    // Users who blocked the viewer
    const [blockedByRows] = await db.query(
      `SELECT u.id
       FROM blocked_users bu
       JOIN users u ON u.id = bu.blocker_id
       WHERE bu.blocked_id = ?`,
      [viewerId]
    );

    // Merge both sets into a unique list of excluded IDs
    const blockedIds = blockedRows.map((u: any) => u.id);
    const blockedByIds = blockedByRows.map((u: any) => u.id);
    excludeIds = [...new Set([...blockedIds, ...blockedByIds])];
  }

  // Prepare SQL depending on whether exclusions are needed
  const placeholders = excludeIds.map(() => '?').join(',');
  const sql = `
    SELECT COUNT(*) AS total
    FROM users
    WHERE status = 'approved'
    ${excludeIds.length > 0 ? `AND id NOT IN (${placeholders})` : ''}
  `;

  // Final query with dynamic exclusion
  const [rows] = await db.query(sql, [...excludeIds]);
  return rows[0].total || 0;
}

// 👤 Get user by slug (e.g. /users/john-doe) + viewerId to check follow status
export async function getUserBySlug(
  slug: string,
  viewerId?: number
): Promise<(FullUserData & { is_followed: boolean }) | { blocked: true } | null> {
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

  // ✅ BLOCK CHECK (viewer blocks or is blocked by the user)
  if (viewerId) {
    const isBlocked = await isUserBlocked(viewerId, user.id);
    if (isBlocked) return { blocked: true };
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

  const blocked_users = await getBlockedUsers(user.id);
  const blocked_by = await getBlockedByUsers(user.id);

  let is_followed = false;
  if (viewerId) {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM user_followers
       WHERE follower_id = ? AND followed_id = ? LIMIT 1`,
      [viewerId, user.id]
    );
    is_followed = rows.length > 0;
  }

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
    blocked_users,
    blocked_by,
    is_followed,
  };
}

// 🧩 Paginated user posts
// 🧩 Paginated user posts (blocking-aware)
export async function getUserPostsPaginated(
  userId: number,
  limit: number,
  offset: number,
  viewerId?: number // ✅ NEW: Pass viewer context for blocking check
): Promise<{ data: PostSummary[]; totalCount: number }> {
  // 🔐 Step 1: Check if viewer and user are blocked in either direction
  if (viewerId) {
    const isBlocked = await isUserBlocked(viewerId, userId); // ✅ Reverse block check
    if (isBlocked) {
      // ⛔ Blocked? Then return no posts at all
      return {
        data: [],
        totalCount: 0,
      };
    }
  }

  // ✅ Step 2: Load paginated posts for this user
  const [posts] = await db.query<RowDataPacket[]>(
    `SELECT id, slug, title, status, featured_photo
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  // ✅ Step 3: Get total post count for pagination
  const [countResult] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM posts WHERE user_id = ?`,
    [userId]
  );

  // ✅ Step 4: Return paginated post data and count
  return {
    data: posts as PostSummary[],
    totalCount: countResult[0].total || 0,
  };
}


// 🧩 Paginated user comments (blocking-aware)
export async function getUserCommentsPaginated(
  userId: number,
  limit: number,
  offset: number,
  viewerId?: number // ✅ NEW: Required for reverse blocking checks
): Promise<{ data: Comment[]; totalCount: number }> {
  // 🔐 Step 1: Enforce reverse blocking
  if (viewerId) {
    const isBlocked = await isUserBlocked(viewerId, userId); // ✅ Check if viewer/user blocked each other
    if (isBlocked) {
      // ⛔ If blocked, hide all comments from that user
      return {
        data: [],
        totalCount: 0,
      };
    }
  }

  // ✅ Step 2: Fetch visible comments normally
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

  // ✅ Step 3: Count total comments by that user
  const [countResult] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM comments WHERE user_id = ?`,
    [userId]
  );

  // ✅ Step 4: Return paginated comments and count
  return {
    data: comments as Comment[],
    totalCount: countResult[0].total || 0,
  };
}

// 🧩 Paginated followed posts (blocking-aware)
export async function getFollowedPostsPaginated(
  userId: number,
  limit: number,
  offset: number,
  viewerId?: number // ✅ NEW: Needed to filter out posts from blocked users
): Promise<{ data: PostSummary[]; totalCount: number }> {
  // ✅ Step 1: Fetch followed posts including their authors
  const [posts] = await db.query<RowDataPacket[]>(
    `SELECT 
       p.id, p.title, p.slug, p.featured_photo, p.user_id
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  let filteredPosts = posts as (PostSummary & { user_id: number })[]; // 🧪 Default

  // 🔐 Step 2: If viewerId provided, remove posts by blocked/blockedBy users
  if (viewerId) {
    // ✅ Fetch users the viewer has blocked
    const blocked = await getBlockedUsers(viewerId);
    // ✅ Fetch users who blocked the viewer
    const blockedBy = await getBlockedByUsers(viewerId);

    // ✅ Build exclusion set of author IDs
    const excludedUserIds = new Set<number>([
      ...blocked.map((u) => u.id),
      ...blockedBy.map((u) => u.id),
    ]);

    // ✅ Remove posts whose authors are blocked or blocking
    filteredPosts = filteredPosts.filter((post) => !excludedUserIds.has(post.user_id));
  }

  // ✅ Step 3: Return posts (with user_id stripped out) and total count
  return {
    data: filteredPosts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      featured_photo: post.featured_photo ?? null,
    })),
    totalCount: posts.length, // ⚠️ Not filtered (for consistent pagination)
  };
}


// 🧩 Paginated followers
// 🧩 Paginated followers (blocking-aware)
export async function getFollowersPaginated(
  userId: number,
  limit: number,
  offset: number,
  viewerId?: number // ✅ NEW: Accept viewer context for filtering blocked users
): Promise<{ data: SimpleUser[]; totalCount: number }> {
  // ✅ Step 1: Get full follower list
  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  let filteredFollowers = followers as SimpleUser[]; // 🧪 Default (unfiltered)

  // 🔐 Step 2: If viewerId is present, remove blocked/blockedBy users from the result
  if (viewerId) {
    // ✅ Get users the viewer has blocked
    const blocked = await getBlockedUsers(viewerId);
    // ✅ Get users who have blocked the viewer
    const blockedBy = await getBlockedByUsers(viewerId);

    // ✅ Combine both sets into a Set of IDs
    const excludedIds = new Set<number>([
      ...blocked.map((u) => u.id),
      ...blockedBy.map((u) => u.id),
    ]);

    // ✅ Filter followers to exclude any blocked or blocking users
    filteredFollowers = filteredFollowers.filter((f) => !excludedIds.has(f.id));
  }

  // ✅ Step 3: Get total follower count (unfiltered for pagination integrity)
  const [countResult] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM user_followers
     WHERE followed_id = ?`,
    [userId]
  );

  // ✅ Return filtered followers and original count
  return {
    data: filteredFollowers,
    totalCount: countResult[0].total || 0,
  };
}

// 🧩 NEW: get full user data with paginated comments (blocking-aware)
export async function getUserWithDetailsPaginated({
  email,
  providerId,
  offset,
  limit,
  viewerId, // ✅ NEW: Add viewerId for reverse blocking enforcement
}: {
  email?: string;
  providerId?: string;
  offset: number;
  limit: number;
  viewerId?: number; // ✅ Optional viewer context
}): Promise<(FullUserData & { totalComments: number }) | null> {
  let query = '';
  let value: string | undefined;

  // 🔄 Determine query based on identifier used
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

  // 🔴 No query or value — nothing to fetch
  if (!query || !value) return null;

  const [users] = await db.query<RowDataPacket[]>(query, [value]);
  const user = users[0];
  if (!user) return null;

  // 🔐 ✅ REVERSE BLOCKING CHECK
  if (viewerId) {
    const isBlocked = await isUserBlocked(viewerId, user.id); // 🔒 Check if viewer or user has blocked the other
    if (isBlocked) return null; // ⛔ Access denied if blocked in either direction
  }

  // ✅ Fetch user's posts with viewer-aware filtering
  const posts = await getPostsByUserId(user.id, viewerId); // ✅ viewerId passed into post loading

  // ✅ Fetch paginated comments for the user
  const { data: commentRows, totalCount } = await getUserCommentsPaginated(user.id, limit, offset);

  // 🧱 Organize nested comment structure
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

  // ✅ Followed posts (not filtered — optional)
  const [followedPosts] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.slug, p.featured_photo
     FROM followed_posts fp
     JOIN posts p ON p.id = fp.post_id
     WHERE fp.user_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );

  // ✅ Raw followers list
  const [followers] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug
     FROM user_followers uf
     JOIN users u ON u.id = uf.follower_id
     WHERE uf.followed_id = ?`,
    [user.id]
  );

  // ✅ Raw following list
  const [followingRaw] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at, u.slug, u.role
     FROM user_followers uf
     JOIN users u ON u.id = uf.followed_id
     WHERE uf.follower_id = ?`,
    [user.id]
  );

  // ✅ Fetch blocked user IDs (to exclude from followers/following)
  const blockedIds = new Set((await getBlockedUsers(user.id)).map((u) => u.id)); // ✅ Blocked by this user

  // ✅ Filter `followers` and `following` by removing any users this user has blocked
  const filteredFollowers = followers.filter((f) => !blockedIds.has(f.id)); // ✅ Remove blocked from followers
  const filteredFollowing = followingRaw.filter((f) => !blockedIds.has(f.id)); // ✅ Remove blocked from following

  // 🧠 Enrich following with `is_blocked` flag (for display UI)
  const following = filteredFollowing.map((u) => ({
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    avatar_url: u.avatar_url,
    created_at: u.created_at,
    slug: u.slug,
    role: u.role,
    is_blocked: blockedIds.has(u.id), // 💡 Always false now (kept for consistency)
  }));

  // ✅ Load block relationships
  const blocked_users = await getBlockedUsers(user.id);
  const blocked_by = await getBlockedByUsers(user.id);

  // ✅ Return user profile
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
    comments: rootComments,
    followed_posts: followedPosts as PostSummary[],
    followers: filteredFollowers as SimpleUser[], // ✅ Cleaned follower list
    following, // ✅ Cleaned + enriched following list
    blocked_users,
    blocked_by,
    country_name: user.country_name ?? null,
    state_name: user.state_name ?? null,
    city_name: user.city_name ?? null,
    totalComments: totalCount,
  };
}






