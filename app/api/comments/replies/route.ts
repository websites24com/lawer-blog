import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get('parent_id');

  if (!parentId || isNaN(Number(parentId))) {
    return NextResponse.json({ error: 'Invalid parent_id' }, { status: 400 });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT 
        c.id, c.post_id, c.user_id, c.parent_id,
        c.message, c.status, c.created_at, c.edited_at, c.edited_by,
        u.first_name, u.last_name, u.avatar_url
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.parent_id = ?
      ORDER BY c.created_at ASC
      `,
      [parentId]
    );

    const replies = (rows as any[]).map((row) => ({
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
      replies: [], // replies of replies can be lazy-loaded too later
    }));

    return NextResponse.json(replies);
  } catch (err) {
    console.error('💥 Error loading replies:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
