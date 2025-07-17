import { db } from '@/app/lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { RowDataPacket } from 'mysql2';

// ✅ GET /api/reactions/post/[postId]?viewerId=123
export async function GET(req: NextRequest, context: { params: { postId: string } }) {
  const postId = Number(context.params.postId);

  if (!postId || isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
  }

  // ✅ Get viewer ID from query param
  const { searchParams } = new URL(req.url);
  const viewerId = Number(searchParams.get('viewerId'));

  // ✅ Query with is_followed (only if viewerId provided)
  const [rows] = await db.execute<RowDataPacket[]>(
    `
    SELECT
      pr.user_id,
      u.first_name,
      u.last_name,
      u.avatar_url,
      pr.reaction,
      u.slug AS user_slug, 
      pr.created_at
      ${viewerId ? `,
      EXISTS (
        SELECT 1 FROM user_followers
        WHERE follower_id = ? AND followed_id = u.id
      ) AS is_followed` : ''}
    FROM post_reactions pr
    JOIN users u ON pr.user_id = u.id
    WHERE pr.post_id = ?
    ORDER BY pr.created_at DESC
    `,
    viewerId ? [viewerId, postId] : [postId]
  );

  return NextResponse.json({ reactions: rows });
}
