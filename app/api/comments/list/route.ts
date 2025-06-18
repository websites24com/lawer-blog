import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('post_id');
  const sortParam = searchParams.get('sort'); // 'asc' or 'desc'

  if (!postId || isNaN(Number(postId))) {
    return NextResponse.json({ error: 'Invalid post_id' }, { status: 400 });
  }

  const sortDirection = sortParam === 'desc' ? 'DESC' : 'ASC';

  try {
    const [rows] = await db.query(
      `
      SELECT 
        c.id, c.post_id, c.user_id, c.parent_id,
        c.message, c.status, c.created_at, c.edited_at, c.edited_by,
        u.first_name, u.last_name, u.avatar_url
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ${sortDirection}
      `,
      [postId]
    );

    const map = new Map<number, any>();
    const rootComments: any[] = [];

    for (const row of rows as any[]) {
      const comment = {
        id: row.id,
        post_id: row.post_id,
        parent_id: row.parent_id,
        content: row.message,
        status: row.status,
        created_at: row.created_at,
        edited_at: row.edited_at,
        edited_by: row.edited_by,
        user: {
          id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name,
          avatar_url: row.avatar_url,
        },
        replies: [],
      };

      map.set(comment.id, comment);

      if (comment.parent_id === null) {
        rootComments.push(comment);
      } else {
        const parent = map.get(comment.parent_id);
        if (parent) parent.replies.push(comment);
      }
    }

    return NextResponse.json(rootComments);
  } catch (err) {
    console.error('💥 Error loading comments:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
