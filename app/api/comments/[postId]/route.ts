// ✅ File: app/api/comments/[postId]/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = parseInt(params.postId);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Fetch all approved comments for this post with user info
    const [rows] = await db.query(
      `SELECT 
         c.id, c.post_id, c.user_id, c.parent_id, c.message, c.status, c.created_at, c.edited_at, c.edited_by,
         u.first_name, u.last_name, u.slug, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'approved'
       ORDER BY c.created_at ASC`,
      [postId]
    );

    const flatComments = rows as any[];

    // Build nested structure
    const commentMap: Record<number, any> = {};
    const rootComments: any[] = [];

    for (const comment of flatComments) {
      comment.replies = [];
      comment.user = {
        id: comment.user_id,
        first_name: comment.first_name,
        last_name: comment.last_name,
        slug: comment.slug,
        avatar_url: comment.avatar_url,
      };
      delete comment.first_name;
      delete comment.last_name;
      delete comment.slug;
      delete comment.avatar_url;

      commentMap[comment.id] = comment;
    }

    for (const comment of flatComments) {
      if (comment.parent_id && commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    }

    return NextResponse.json(rootComments);
  } catch (error) {
    console.error('[GET_COMMENTS_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
