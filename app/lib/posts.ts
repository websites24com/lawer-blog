// ✅ Public - Approved posts
import { db } from '@/app/lib/db';
import type { PostSummary, PostWithDetails } from '@/app/lib/definitions';

// ✅ Get paginated approved posts (for public pages)
export async function getAllApprovedPosts(
  userId?: number,
  page: number = 1,
  pageSize: number = 10
): Promise<PostSummary[]> {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt, -- ✅ use excerpt column directly
      posts.created_at,
      posts.featured_photo,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,
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
    LEFT JOIN post_tags pt ON posts.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE posts.status = 'approved'
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
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
    tags: row.tags ? row.tags.split(',') : [],
    status: 'approved',
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      slug: row.user_slug,
    },
  }));
}

// ✅ Get approved post count for pagination
export async function getApprovedPostCount(): Promise<number> {
  const [rows] = await db.query('SELECT COUNT(*) as count FROM posts WHERE status = "approved"');
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
      posts.excerpt, -- ✅ use excerpt column directly
      posts.created_at,
      posts.featured_photo,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,
      EXISTS (
        SELECT 1 FROM followed_posts 
        WHERE followed_posts.user_id = ? AND followed_posts.post_id = posts.id
      ) AS followed_by_current_user
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
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
    created_at: row.created_at,
    featured_photo: row.featured_photo,
    category: row.category,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      slug: row.user_slug,
    },
  }));
}

// ✅ Get a single post by slug (for view/edit), includes comments and tags
export async function getPostBySlug(slug: string, viewerId: number): Promise<PostWithDetails | null> {
  // 1. Load main post info
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

  console.log('✅ Loaded post ID:', post.id);

  // Prepare user object
  post.user = {
    first_name: post.first_name,
    last_name: post.last_name,
    slug: post.user_slug,
    avatar_url: post.avatar_url,
  };

  delete post.first_name;
  delete post.last_name;
  delete post.user_slug;
  delete post.avatar_url;

  // 2. Load tags
  const [tagRows] = await db.query(
    `
    SELECT t.name
    FROM tags t
    JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = ?
    `,
    [post.id]
  );

  post.tags = tagRows.map((t: any) => t.name);

  // 3. Load comments
  const [allComments] = await db.query<any[]>(
    `
    SELECT 
      cm.id,
      cm.post_id,
      cm.user_id,
      cm.parent_id,
      cm.message AS content,
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

  const visibleComments = allComments.filter(comment => {
    return comment.status === 'approved' || comment.user_id === viewerId;
  });

  const commentMap: { [id: number]: any } = {};
  const rootComments: any[] = [];

  visibleComments.forEach((comment) => {
    comment.user = {
      id: comment.uid,
      first_name: comment.first_name,
      last_name: comment.last_name,
      avatar_url: comment.avatar_url,
      email: comment.email,
      role: comment.role,
      status: comment.user_status,
      provider: comment.provider,
      provider_account_id: comment.provider_account_id,
      created_at: comment.user_created_at,
    };

    delete comment.uid;
    delete comment.first_name;
    delete comment.last_name;
    delete comment.avatar_url;
    delete comment.email;
    delete comment.role;
    delete comment.user_status;
    delete comment.provider;
    delete comment.provider_account_id;
    delete comment.user_created_at;

    comment.replies = [];
    commentMap[comment.id] = comment;

    if (!comment.parent_id) {
      rootComments.push(comment);
    }
  });

  visibleComments.forEach(comment => {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      commentMap[comment.parent_id].replies.push(comment);
    }
  });

  post.comments = rootComments;

  return post as PostWithDetails;
}

// ✅ Get all categories
export async function getAllCategories(): Promise<{ id: number; name: string }[]> {
  const [rows] = await db.query('SELECT id, name FROM categories ORDER BY name ASC');
  return rows as { id: number; name: string }[];
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
  // ✅ Match your existing pagination logic
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  // ✅ Load paginated posts
  const [rows] = await db.query<any[]>(
    `
    SELECT 
      posts.id,
      posts.slug,
      posts.title,
      posts.excerpt,
      posts.created_at,
      posts.featured_photo,
      categories.name AS category,
      users.first_name,
      users.last_name,
      users.avatar_url,
      users.slug AS user_slug,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags,
      ${
        viewerId
          ? `EXISTS (
               SELECT 1 FROM followed_posts 
               WHERE followed_posts.user_id = ${db.escape(viewerId)} AND followed_posts.post_id = posts.id
             ) AS followed_by_current_user`
          : `FALSE AS followed_by_current_user`
      }
    FROM posts
    JOIN post_tags pt ON posts.id = pt.post_id
    JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.status = 'approved'
      AND LOWER(t.slug) = LOWER(?)
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [slug, limit, offset]
  );

  // ✅ Load total count for pagination
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

  // ✅ Map to PostSummary[]
  const posts: PostSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    created_at: row.created_at,
    featured_photo: row.featured_photo,
    category: row.category,
    followed_by_current_user: !!row.followed_by_current_user,
    tags: row.tags ? row.tags.split(',') : [],
    status: 'approved',
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      slug: row.user_slug,
    },
  }));

  return { posts, totalCount };
}
