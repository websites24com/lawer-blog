// ✅ Public - Approved posts
import { db } from '@/app/lib/db';
import type { RowDataPacket } from 'mysql2';
import { isUserBlocked } from '@/app/lib/users/block'; // ✅ Add this at the top if not already
import type { PostSummary, PostWithDetails, Category, CommentWithUser} from '@/app/lib/definitions';

// ✅ Get paginated approved posts (for public pages)

// ✅ Get all approved posts (paginated), only visible to viewerId
export async function getAllApprovedPosts(
  viewerId: number,
  page: number,
  pageSize: number
): Promise<PostSummary[]> {
  const offset = (page - 1) * pageSize;

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.slug,
      p.title,
      p.excerpt,
      p.created_at,
      p.featured_photo,
      p.photo_alt,

      -- ✅ language
      ln.id AS language_id,           -- ✅ added
      ln.name AS language_name,       -- ✅ added
      ln.slug AS language_slug,       -- ✅ added

      -- ✅ author
      u.slug AS user_slug,
      u.first_name,
      u.last_name,
      u.avatar_url,

      -- ✅ category
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,

      -- ✅ location (from posts)
      co.name AS country_name,
      s.name AS state_name,
      ci.name AS city_name,

      -- follow status
      CASE
        WHEN fp.user_id IS NULL THEN FALSE
        ELSE TRUE
      END AS followed_by_current_user

    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN languages ln ON p.language_id = ln.id       -- ✅ added
    LEFT JOIN countries co ON p.country_id = co.id
    LEFT JOIN states s ON p.state_id = s.id
    LEFT JOIN cities ci ON p.city_id = ci.id
    LEFT JOIN followed_posts fp ON p.id = fp.post_id AND fp.user_id = ?

    WHERE p.status = 'approved'
    AND u.id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)
    AND u.id NOT IN (SELECT blocker_id FROM blocked_users WHERE blocked_id = ?)

    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [viewerId, viewerId, viewerId, pageSize, offset]
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    created_at: row.created_at,
    featured_photo: row.featured_photo,
    photo_alt: row.photo_alt,
    followed_by_current_user: !!row.followed_by_current_user,

    user: {
      slug: row.user_slug,
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
    },

    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
    },

    language: row.language_id
      ? {
          id: row.language_id,        // ✅ added
          name: row.language_name,    // ✅ added
          slug: row.language_slug,    // ✅ added
        }
      : null,

    country_name: row.country_name || null,
    state_name: row.state_name || null,
    city_name: row.city_name || null,
  }));
}

// ✅ Count of all approved posts the current viewer is allowed to see
export async function getApprovedPostCount(viewerId: number): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS count
    FROM posts p
    JOIN users u ON p.user_id = u.id

    -- ✅ Only approved posts
    WHERE p.status = 'approved'

    -- ✅ Exclude posts by users this viewer has blocked
    AND u.id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
    )

    -- ✅ Exclude posts by users who blocked this viewer
    AND u.id NOT IN (
      SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
    )
    `,
    [viewerId, viewerId] // ✅ used twice: once for blocker_id, once for blocked_id
  );

  return rows[0]?.count || 0;
}

// ✅ Get all posts for a specific user (dashboard)


export async function getAllPosts(userId: number): Promise<PostSummary[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.status,
      posts.excerpt,
      posts.created_at,
      posts.featured_photo,
      posts.photo_alt,

      -- Category info
      categories.id AS category_id,
      categories.name AS category_name,
      categories.slug AS category_slug,

      -- Language info
      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      -- User info
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,

      -- ✅ Location info from posts
      countries.name AS country_name, -- ✅ added
      states.name AS state_name,      -- ✅ added
      cities.name AS city_name,       -- ✅ added

      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ? AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user

    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN countries ON posts.country_id = countries.id -- ✅ fixed: from posts
    LEFT JOIN states ON posts.state_id = states.id         -- ✅ fixed: from posts
    LEFT JOIN cities ON posts.city_id = cities.id          -- ✅ fixed: from posts
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id

    GROUP BY posts.id
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
    created_at: new Date(row.created_at).toISOString(),
    featured_photo: row.featured_photo ?? null,
    photo_alt: row.photo_alt ?? null,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
    language: row.language_id
      ? {
          id: row.language_id,
          name: row.language_name,
          slug: row.language_slug,
        }
      : null,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },

    country_name: row.country_name || null, // ✅ added
    state_name: row.state_name || null,     // ✅ added
    city_name: row.city_name || null,       // ✅ added
  }));
}


// ✅ Get a single post by slug (for view/edit), includes comments and tags

export async function getPostBySlug(
  slug: string,
  viewerId: number
): Promise<PostWithDetails | { blocked: true } | null>
 {
  // ✅ 1. Load post data including author info
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      p.*,

      -- Category info
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,

      -- Language info
      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      -- Location info
      cn.name AS country_name,
      st.name AS state_name,
      ci.name AS city_name,

      -- Author info
      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.slug AS user_slug,
      u.avatar_url,

      -- Follow info
      EXISTS (
        SELECT 1 FROM followed_posts fp
        WHERE fp.post_id = p.id AND fp.user_id = ?
      ) AS followed_by_current_user

    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN languages ln ON p.language_id = ln.id
    LEFT JOIN countries cn ON p.country_id = cn.id
    LEFT JOIN states st ON p.state_id = st.id
    LEFT JOIN cities ci ON p.city_id = ci.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.slug = ?
    LIMIT 1
    `,
    [viewerId, slug]
  );

  const post = rows[0];
  if (!post) return null;

  // 🔐 ✅ 2. BLOCK CHECK: If viewer is blocked or has blocked the author, return null
  if (viewerId) {
    const blocked = await isUserBlocked(viewerId, post.user_id); // ✅ Both directions
   if (blocked) return { blocked: true };

  }

  // ✅ 3. Map post author info
  const user: PostWithDetails['user'] = {
    id: post.user_id,
    first_name: post.first_name,
    last_name: post.last_name,
    slug: post.user_slug,
    avatar_url: post.avatar_url ?? null,
  };

  // ✅ 4. Map category
  const category = post.category_id
    ? {
        id: post.category_id,
        name: post.category_name,
        slug: post.category_slug,
      }
    : null;

  // ✅ 5. Map language
  const language = post.language_id
    ? {
        id: post.language_id,
        name: post.language_name,
        slug: post.language_slug,
      }
    : null;

  // ✅ 6. Load tags
  const [tagRows] = await db.query<any[]>(
    `
    SELECT t.name
    FROM tags t
    JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = ?
    `,
    [post.id]
  );
  const tags = tagRows.map((t) => t.name);

  // ✅ 7. Load all comments for this post
  const [allComments] = await db.query<any[]>(
    `
    SELECT 
      cm.id,
      cm.post_id,
      cm.user_id,
      cm.parent_id,
      cm.message AS message,
      cm.status,
      cm.edited_by,
      cm.edited_at,
      cm.created_at,
      u.id AS uid,
      u.first_name,
      u.last_name,
      u.avatar_url,
      u.email,
      u.role,
      u.status AS user_status,
      u.provider,
      u.provider_account_id,
      u.created_at AS user_created_at
    FROM comments cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.post_id = ?
    ORDER BY cm.created_at ASC
    `,
    [post.id]
  );

  // ✅ 8. Filter comments to only show approved ones or viewer's own
  const visibleComments = allComments.filter(
    (comment) => comment.status === 'approved' || comment.user_id === viewerId
  );

  // ✅ 9. Build nested comment tree
  const commentMap: { [id: number]: CommentWithUser } = {};
  const rootComments: CommentWithUser[] = [];

  for (const comment of visibleComments) {
    const formatted: CommentWithUser = {
      id: comment.id,
      post_id: comment.post_id,
      parent_id: comment.parent_id,
      message: comment.message,
      status: comment.status,
      edited_by: comment.edited_by,
      edited_at: comment.edited_at,
      created_at: new Date(comment.created_at).toISOString(),
      post_slug: slug,
      post_title: post.title,
      user: {
        id: comment.uid,
        first_name: comment.first_name,
        last_name: comment.last_name,
        slug: '', // optional
        avatar_url: comment.avatar_url ?? null,
      },
      replies: [],
    };

    commentMap[formatted.id] = formatted;

    if (!formatted.parent_id) {
      rootComments.push(formatted);
    }
  }

  for (const comment of visibleComments) {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
    }
  }

  // ✅ 10. Return full structured post
  const result: PostWithDetails = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    featured_photo: post.featured_photo ?? null,
    photo_alt: post.photo_alt ?? null,
    photo_title: post.photo_title ?? null,
    status: post.status,
    user_id: post.user_id,
    category_id: post.category_id,
    created_at: new Date(post.created_at).toISOString(),
    updated_at: new Date(post.updated_at).toISOString(),
    edited_by: post.edited_by,
    edited_at: post.edited_at,
    country_id: post.country_id,
    state_id: post.state_id,
    city_id: post.city_id,
    country_name: post.country_name ?? null,
    state_name: post.state_name ?? null,
    city_name: post.city_name ?? null,
    location: post.location,
    followed_by_current_user: !!post.followed_by_current_user,
    tags,
    user,
    category,
    language,
    comments: rootComments,
  };

  return result;
}

// ✅ Get all categories with correct shape (id, name, slug)
export async function getAllCategories(): Promise<Category[]> {
  const [rows] = await db.query<any[]>(
    'SELECT id, name, slug FROM categories ORDER BY name ASC'
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
  }));
}

/**
 * Get all approved posts by tag slug
 */


export async function getPostsByTag(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number; blocked: boolean }> {
  const offset = (page - 1) * pageSize;

  // ✅ 1. Check if author is blocked
  const [authorResult] = await db.query<RowDataPacket[]>(
    `
    SELECT u.id AS user_id
    FROM posts p
    JOIN post_tags pt ON p.id = pt.post_id
    JOIN tags t ON pt.tag_id = t.id
    JOIN users u ON p.user_id = u.id
    WHERE t.slug = ? AND p.status = 'approved'
    LIMIT 1
    `,
    [slug]
  );

  const author = authorResult[0];
  if (author) {
    const blocked = await isUserBlocked(viewerId, author.user_id);
    if (blocked) return { posts: [], totalCount: 0, blocked: true };
  }

  // ✅ 2. Load posts
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT 
      p.id,
      p.slug,
      p.title,
      p.excerpt,
      p.created_at,
      p.featured_photo,
      p.photo_alt,
      p.status,

      -- Location
      co.name AS country_name,
      s.name AS state_name,
      ci.name AS city_name,

      -- Category
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,

      -- Language
      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      -- Author
      u.first_name,
      u.last_name,
      u.avatar_url,
      u.slug AS user_slug,

      -- Tags
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ? 
        AND followed_posts.post_id = p.id
      ) AS followed_by_current_user

    FROM posts p
    JOIN post_tags pt ON p.id = pt.post_id
    JOIN tags t ON pt.tag_id = t.id
    JOIN users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN languages ln ON p.language_id = ln.id
    LEFT JOIN countries co ON p.country_id = co.id
    LEFT JOIN states s ON p.state_id = s.id
    LEFT JOIN cities ci ON p.city_id = ci.id

    WHERE p.status = 'approved'
      AND LOWER(t.slug) = LOWER(?)

    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [viewerId, slug, pageSize, offset]
  );

  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(DISTINCT p.id) AS count
    FROM posts p
    JOIN post_tags pt ON p.id = pt.post_id
    JOIN tags t ON pt.tag_id = t.id
    WHERE p.status = 'approved'
      AND LOWER(t.slug) = LOWER(?)
    `,
    [slug]
  );

  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    status: 'approved',
    created_at: new Date(row.created_at).toISOString(),
    featured_photo: row.featured_photo ?? null,
    photo_alt: row.photo_alt ?? null,
    country_name: row.country_name ?? null,
    state_name: row.state_name ?? null,
    city_name: row.city_name ?? null,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
    language: row.language_id
      ? {
          id: row.language_id,
          name: row.language_name,
          slug: row.language_slug,
        }
      : null,
  }));

  return {
    posts,
    totalCount: countRows[0].count,
    blocked: false,
  };
}



// ✅ Get all approved posts by category slug (for /blog/category/[slug])

export async function getPostsByCategorySlug(
  slug: string,
  viewerId: number,
  page: number,
  pageSize: number
): Promise<{ posts: PostSummary[]; totalCount: number; blocked: boolean }> {
  const offset = (page - 1) * pageSize;

  // ✅ Fetch author ID for posts in this category (assuming same author per category)
  const [authorResult] = await db.query<RowDataPacket[]>(
    `
    SELECT u.id AS user_id
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = ? AND p.status = 'approved'
    LIMIT 1
    `,
    [slug]
  );

  const author = authorResult[0];
  if (author) {
    const blocked = await isUserBlocked(viewerId, author.user_id); // ✅ check block relation
    if (blocked) {
      return { posts: [], totalCount: 0, blocked: true }; // ✅ signal frontend to show <BlockedProfileNotice />
    }
  }

  // ✅ Normal post fetch with full metadata
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.slug,
      p.title,
      p.excerpt,
      p.created_at,
      p.featured_photo,
      p.photo_alt,
      p.photo_title,

      u.first_name,
      u.last_name,
      u.slug AS user_slug,
      u.avatar_url,

      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,

      l.id AS language_id,
      l.name AS language_name,
      l.slug AS language_slug,

      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

      EXISTS (
        SELECT 1 FROM followed_posts fp
        WHERE fp.post_id = p.id AND fp.user_id = ?
      ) AS followed_by_current_user

    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN languages l ON p.language_id = l.id
    LEFT JOIN countries ON p.country_id = countries.id
    LEFT JOIN states ON p.state_id = states.id
    LEFT JOIN cities ON p.city_id = cities.id
    WHERE c.slug = ? AND p.status = 'approved'
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [viewerId, slug, pageSize, offset]
  );

  const [countResult] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS count
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = ? AND p.status = 'approved'
    `,
    [slug]
  );

  return {
    posts: rows as PostSummary[],
    totalCount: countResult[0].count,
    blocked: false, // ✅ not blocked, allow frontend to render
  };
}

// ✅ Get all approved posts by country slug
// ✅ Get all approved posts by country slug
export async function getPostsByCountrySlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number; blocked: boolean }> {
  const decodedSlug = decodeURIComponent(slug);
  const offset = (page - 1) * pageSize;

  // ✅ STEP 1: Count all posts in the country (even blocked ones)
  const [rawCountryPosts] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM posts
    JOIN countries ON posts.country_id = countries.id
    WHERE posts.status = 'approved'
      AND LOWER(countries.name) = LOWER(?)
    `,
    [decodedSlug]
  );

  const totalUnfiltered = rawCountryPosts[0]?.total || 0;

  // ✅ STEP 2: Get filtered posts (excluding blocked users)
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt,
      posts.status,
      posts.created_at,
      posts.featured_photo,
      posts.photo_alt,

      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

      categories.id AS category_id,
      categories.name AS category_name,
      categories.slug AS category_slug,

      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,

      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ?
        AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user

    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id

    WHERE posts.status = 'approved'
      AND LOWER(countries.name) = LOWER(?)

      -- ✅ BLOCKING LOGIC
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      )
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      )

    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [viewerId, decodedSlug, viewerId, viewerId, pageSize, offset]
  );

  // ✅ STEP 3: Count filtered (visible) posts
  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    JOIN users ON posts.user_id = users.id
    JOIN countries ON posts.country_id = countries.id
    WHERE posts.status = 'approved'
      AND LOWER(countries.name) = LOWER(?)
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      )
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      )
    `,
    [decodedSlug, viewerId, viewerId]
  );

  // ✅ STEP 4: Build post list
  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    status: 'approved',
    created_at: new Date(row.created_at).toISOString(),
    featured_photo: row.featured_photo ?? null,
    photo_alt: row.photo_alt ?? null,
    country_name: row.country_name ?? null,
    state_name: row.state_name ?? null,
    city_name: row.city_name ?? null,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
    language: row.language_id
      ? {
          id: row.language_id,
          name: row.language_name,
          slug: row.language_slug,
        }
      : null,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  // ✅ STEP 5: Check if viewer is blocked
  const blocked = totalUnfiltered > 0 && posts.length === 0;

  return {
    posts,
    totalCount: countRows[0].count,
    blocked,
  };
}



// ✅ Get all approved posts by state slug
export async function getPostsByStateSlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number; blocked: boolean }> {
  const decodedSlug = decodeURIComponent(slug);
  const offset = (page - 1) * pageSize;

  // ✅ STEP 1: Check if any posts exist in this state (even if viewer is blocked)
  const [rawStatePosts] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM posts
    JOIN states ON posts.state_id = states.id
    WHERE posts.status = 'approved'
      AND LOWER(states.name) = LOWER(?)
    `,
    [decodedSlug]
  );

  const totalUnfiltered = rawStatePosts[0]?.total || 0; // ✅ Raw post count before block filtering

  // ✅ STEP 2: Fetch filtered posts (excluding blocked authors)
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt,
      posts.status,
      posts.created_at,
      posts.featured_photo,
      posts.photo_alt,

      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

      categories.id AS category_id,
      categories.name AS category_name,
      categories.slug AS category_slug,

      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,

      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ?
        AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user

    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id

    WHERE posts.status = 'approved'
      AND LOWER(states.name) = LOWER(?)

      -- ✅ BLOCKING FILTER
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      )
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      )

    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [viewerId, decodedSlug, viewerId, viewerId, pageSize, offset] // ✅ Clean param order
  );

  // ✅ STEP 3: Count visible posts (excluding blocked authors)
  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    JOIN users ON posts.user_id = users.id
    JOIN states ON posts.state_id = states.id
    WHERE posts.status = 'approved'
      AND LOWER(states.name) = LOWER(?)
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      )
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      )
    `,
    [decodedSlug, viewerId, viewerId]
  );

  // ✅ STEP 4: Map results
  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    status: 'approved',
    created_at: new Date(row.created_at).toISOString(),
    featured_photo: row.featured_photo ?? null,
    photo_alt: row.photo_alt ?? null,
    country_name: row.country_name ?? null,
    state_name: row.state_name ?? null,
    city_name: row.city_name ?? null,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
    language: row.language_id
      ? {
          id: row.language_id,
          name: row.language_name,
          slug: row.language_slug,
        }
      : null,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  // ✅ STEP 5: Final check — block status
  const blocked = totalUnfiltered > 0 && posts.length === 0; // ✅ Correct blocked detection

  return {
    posts,
    totalCount: countRows[0].count,
    blocked,
  };
}


// ✅ Get all approved posts by city slug
export async function getPostsByCitySlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number; blocked: boolean }> {
  const decodedSlug = decodeURIComponent(slug);
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  // ✅ Check if there are ANY posts for this city (even blocked ones)
  const [rawCityPosts] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM posts
    JOIN cities ON posts.city_id = cities.id
    WHERE posts.status = 'approved'
      AND LOWER(cities.name) = LOWER(?)
    `,
    [decodedSlug]
  );

  const totalUnfiltered = rawCityPosts[0]?.total || 0; // ✅ total posts without block filter

  // ✅ Now fetch filtered posts
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt,
      posts.status,
      posts.created_at,
      posts.featured_photo,
      posts.photo_alt,

      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

      categories.id AS category_id,
      categories.name AS category_name,
      categories.slug AS category_slug,

      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,

      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ?
        AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user

    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id

    WHERE posts.status = 'approved'
      AND LOWER(cities.name) = LOWER(?)

      -- ✅ BLOCK FILTER
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      )
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      )

    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [viewerId, decodedSlug, viewerId, viewerId, limit, offset]
  );

  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    JOIN users ON posts.user_id = users.id
    JOIN cities ON posts.city_id = cities.id
    WHERE posts.status = 'approved'
      AND LOWER(cities.name) = LOWER(?)
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      )
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      )
    `,
    [decodedSlug, viewerId, viewerId]
  );

  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    status: 'approved',
    created_at: new Date(row.created_at).toISOString(),
    featured_photo: row.featured_photo ?? null,
    photo_alt: row.photo_alt ?? null,
    country_name: row.country_name ?? null,
    state_name: row.state_name ?? null,
    city_name: row.city_name ?? null,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
    language: row.language_id
      ? {
          id: row.language_id,
          name: row.language_name,
          slug: row.language_slug,
        }
      : null,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  // ✅ FINAL LOGIC: if original posts exist but none are visible = viewer is blocked
  const blocked = totalUnfiltered > 0 && posts.length === 0; // ✅ FIXED

  return {
    posts,
    totalCount: countRows[0].count,
    blocked,
  };
}



// ✅ Get all approved posts by language slug
// ✅ Required for block check


// ✅ Get all approved posts by language slug
export async function getPostsByLanguageSlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number; blocked: boolean }> {
  const decodedSlug = decodeURIComponent(slug);
  const offset = (page - 1) * pageSize;

  // ✅ Fetch filtered posts
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt,
      posts.status,
      posts.created_at,
      posts.featured_photo,
      posts.photo_alt,

      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

      categories.id AS category_id,
      categories.name AS category_name,
      categories.slug AS category_slug,

      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,

      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ? 
        AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user

    FROM posts
    JOIN users ON posts.user_id = users.id
    JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id

    WHERE posts.status = 'approved'
      AND LOWER(ln.slug) = LOWER(?)
      
      -- ✅ FIX: exclude blocked authors
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      ) -- ✅ FIX
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      ) -- ✅ FIX

    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [viewerId, decodedSlug, viewerId, viewerId, pageSize, offset] // ✅ FIX: viewerId passed twice for block checks
  );

  // ✅ Count total matching posts (excluding blocked authors)
  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    JOIN users ON posts.user_id = users.id
    JOIN languages ln ON posts.language_id = ln.id

    WHERE posts.status = 'approved'
      AND LOWER(ln.slug) = LOWER(?)

      -- ✅ FIX: exclude blocked authors from count as well
      AND users.id NOT IN (
        SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
      )
      AND users.id NOT IN (
        SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
      )
    `,
    [decodedSlug, viewerId, viewerId] // ✅ FIX
  );

  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    status: 'approved',
    created_at: new Date(row.created_at).toISOString(),
    featured_photo: row.featured_photo ?? null,
    photo_alt: row.photo_alt ?? null,
    country_name: row.country_name ?? null,
    state_name: row.state_name ?? null,
    city_name: row.city_name ?? null,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
    language: row.language_id
      ? {
          id: row.language_id,
          name: row.language_name,
          slug: row.language_slug,
        }
      : null,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  // ✅ Always return blocked: false – filtering is handled in SQL now
  return {
    posts,
    totalCount: countRows[0].count,
    blocked: false, // ✅ FIX: viewer never sees blocked content
  };
}





export async function getAllLanguages(): Promise<Language[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, name, slug FROM languages ORDER BY name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
  }));
}


export async function getAllCountries(): Promise<Country[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, name FROM countries ORDER BY name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}
