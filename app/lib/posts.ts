// ✅ Public - Approved posts
import { db } from '@/app/lib/db';
import type { RowDataPacket } from 'mysql2';

import type { PostSummary, PostWithDetails, Category, CommentWithUser} from '@/app/lib/definitions';

// ✅ Get paginated approved posts (for public pages)

export async function getAllApprovedPosts(
  userId: number | null,
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

      -- Join user info
      u.first_name,
      u.last_name,
      u.slug AS user_slug,
      u.avatar_url,

      -- Category info
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,

      -- Language info
      ln.id AS language_id,
      ln.name AS language_name,
      ln.slug AS language_slug,

      -- Location info
      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

      -- Tags
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name ASC SEPARATOR ',') AS tags,

      ${
        userId
          ? `EXISTS (
              SELECT 1 FROM followed_posts fp
              WHERE fp.post_id = p.id AND fp.user_id = ?
            ) AS followed_by_current_user`
          : `false AS followed_by_current_user`
      }

    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN languages ln ON p.language_id = ln.id
    LEFT JOIN countries ON p.country_id = countries.id
    LEFT JOIN states ON p.state_id = states.id
    LEFT JOIN cities ON p.city_id = cities.id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id

    WHERE p.status = 'approved'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ?
    OFFSET ?
    `,
    userId ? [userId, pageSize, offset] : [pageSize, offset]
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
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
    status: 'approved',
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      slug: row.user_slug,
      avatar_url: row.avatar_url,
    },
  }));
}



// ✅ Get approved post count for pagination
export async function getApprovedPostCount(): Promise<number> {
  const [rows] = await db.query<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM posts WHERE status = "approved"'
  );
  return rows[0].count;
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

      -- Tags
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ? AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user

    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN users ON posts.user_id = users.id
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
  }));
}





// ✅ Get a single post by slug (for view/edit), includes comments and tags


export async function getPostBySlug(
  slug: string,
  viewerId: number
): Promise<PostWithDetails | null> {
  // ✅ 1. Load post data with language info
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

  // ✅ User
  const user: PostWithDetails['user'] = {
    id: post.user_id,
    first_name: post.first_name,
    last_name: post.last_name,
    slug: post.user_slug,
    avatar_url: post.avatar_url ?? null,
  };

  // ✅ Category
  const category = post.category_id
    ? {
        id: post.category_id,
        name: post.category_name,
        slug: post.category_slug,
      }
    : null;

  // ✅ Language
  const language = post.language_id
    ? {
        id: post.language_id,
        name: post.language_name,
        slug: post.language_slug,
      }
    : null;

  // ✅ Tags
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

  // ✅ Comments
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

  const visibleComments = allComments.filter(
    (comment) => comment.status === 'approved' || comment.user_id === viewerId
  );

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

  // ✅ Final result
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
): Promise<{ posts: PostSummary[]; totalCount: number }> {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt,
      posts.created_at,
      posts.featured_photo,
      posts.photo_alt,

      -- Location info
      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

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

      -- Tags
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      ${
        viewerId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(viewerId)} 
               AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }

    FROM posts
    JOIN post_tags pt ON posts.id = pt.post_id
    JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    WHERE posts.status = 'approved'
      AND LOWER(t.slug) = LOWER(?)
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [slug, limit, offset]
  );

  const [countRows] = await db.query<any[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    JOIN post_tags pt ON posts.id = pt.post_id
    JOIN tags t ON pt.tag_id = t.id
    WHERE posts.status = 'approved'
      AND LOWER(t.slug) = LOWER(?)
    `,
    [slug]
  );

  const totalCount = countRows[0].count;

  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
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
    status: 'approved',
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  return { posts, totalCount };
}

// ✅ Get all approved posts by category slug (for /blog/category/[slug])




export async function getPostsByCategorySlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number }> {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt,
      posts.created_at,
      posts.featured_photo,
      posts.photo_alt,

      -- Location info
      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

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

      -- Tags
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      ${
        viewerId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(viewerId)} 
               AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }

    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON pt.post_id = posts.id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE posts.status = 'approved'
      AND LOWER(categories.slug) = LOWER(?)
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [slug, limit, offset]
  );

  const [countRows] = await db.query<any[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    WHERE posts.status = 'approved'
      AND LOWER(categories.slug) = LOWER(?)
    `,
    [slug]
  );

  const totalCount = countRows[0].count;

  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
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
    status: 'approved',
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  return { posts, totalCount };
}








// ✅ Get all approved posts by country slug
export async function getPostsByCountrySlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number }> {
  const decodedSlug = decodeURIComponent(slug);
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const [rows] = await db.query<any[]>(
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
      ln.id AS language_id, -- ✅ new line
      ln.name AS language_name, -- ✅ new line
      ln.slug AS language_slug, -- ✅ new line
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,
      ${
        viewerId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(viewerId)} 
               AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id -- ✅ new line
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE posts.status = 'approved'
      AND LOWER(countries.name) = LOWER(?)
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [decodedSlug, limit, offset]
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
    language: row.language_id // ✅ new line
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

  const [countRows] = await db.query<any[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    LEFT JOIN countries ON posts.country_id = countries.id
    WHERE posts.status = 'approved'
      AND LOWER(countries.name) = LOWER(?)
    `,
    [slug]
  );

  return {
    posts,
    totalCount: countRows[0].count,
  };
}



// ✅ Get all approved posts by state slug
export async function getPostsByStateSlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number }> {
  const decodedSlug = decodeURIComponent(slug);
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const [rows] = await db.query<any[]>(
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
      ln.id AS language_id, -- ✅ new line
      ln.name AS language_name, -- ✅ new line
      ln.slug AS language_slug, -- ✅ new line
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,
      ${
        viewerId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(viewerId)} 
               AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id -- ✅ new line
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE posts.status = 'approved'
      AND LOWER(states.name) = LOWER(?)
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [decodedSlug, limit, offset]
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
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  const [countRows] = await db.query<any[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    LEFT JOIN states ON posts.state_id = states.id
    WHERE posts.status = 'approved'
      AND LOWER(states.name) = LOWER(?)
    `,
    [slug]
  );

  return {
    posts,
    totalCount: countRows[0].count,
  };
}



// ✅ Get all approved posts by city slug
export async function getPostsByCitySlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number }> {
  const decodedSlug = decodeURIComponent(slug); 
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const [rows] = await db.query<any[]>(
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
      ln.id AS language_id, -- ✅ new line
      ln.name AS language_name, -- ✅ new line
      ln.slug AS language_slug, -- ✅ new line
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,
      ${
        viewerId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(viewerId)} 
               AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id -- ✅ new line
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE posts.status = 'approved'
      AND LOWER(cities.name) = LOWER(?)
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [decodedSlug, limit, offset]
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
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url ?? null,
      slug: row.user_slug,
    },
  }));

  const [countRows] = await db.query<any[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    LEFT JOIN cities ON posts.city_id = cities.id
    WHERE posts.status = 'approved'
      AND LOWER(cities.name) = LOWER(?)
    `,
    [slug]
  );

  return {
    posts,
    totalCount: countRows[0].count,
  };
}

// ✅ Get all approved posts by language slug
export async function getPostsByLanguageSlug(
  slug: string,
  viewerId: number = 0,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: PostSummary[]; totalCount: number }> {
  const decodedSlug = decodeURIComponent(slug);
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const [rows] = await db.query<any[]>(
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

      -- Location info
      countries.name AS country_name,
      states.name AS state_name,
      cities.name AS city_name,

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

      -- Tags
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,

      ${
        viewerId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(viewerId)} 
               AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }

    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN languages ln ON posts.language_id = ln.id
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN countries ON posts.country_id = countries.id
    LEFT JOIN states ON posts.state_id = states.id
    LEFT JOIN cities ON posts.city_id = cities.id
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id

    WHERE posts.status = 'approved'
      AND LOWER(ln.slug) = LOWER(?)

    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [decodedSlug, limit, offset]
  );

  const [countRows] = await db.query<any[]>(
    `
    SELECT COUNT(DISTINCT posts.id) AS count
    FROM posts
    LEFT JOIN languages ln ON posts.language_id = ln.id
    WHERE posts.status = 'approved'
      AND LOWER(ln.slug) = LOWER(?)
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

  return {
    posts,
    totalCount: countRows[0].count,
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
