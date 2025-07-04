import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth/auth';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    // ✅ Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      console.warn('🔒 Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Parse request body
    const body = await req.json();
    const { post_id, parent_id = null, message } = body;

    // ✅ Log incoming data
    console.log('📨 Incoming comment payload:', {
      post_id,
      parent_id,
      message,
      sessionUserId: session.user.id,
    });

    // ✅ Basic input validation
    const numericPostId = Number(post_id);
    if (
      !numericPostId || isNaN(numericPostId) ||
      typeof message !== 'string' ||
      message.trim().length < 2
    ) {
      console.error('❌ Invalid input received:', body);
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // ✅ Insert comment into database (pending by default)
    const [result] = await db.query(
      `INSERT INTO comments (post_id, user_id, message, parent_id, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [numericPostId, session.user.id, trimmedMessage, parent_id]
    );

    const commentId = (result as any).insertId;

    // ✅ Retrieve full comment including user info
    const [rows] = await db.query(
      `SELECT 
         c.id, c.post_id, c.user_id, c.message, c.parent_id, c.status, c.created_at,
         c.edited_by, c.edited_at,
         u.first_name, u.last_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    const row = (rows as any[])[0];
    if (!row) {
      console.error('❌ Comment insert succeeded but fetch failed');
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    // ✅ Return the formatted comment object
    return NextResponse.json({
      id: row.id,
      post_id: row.post_id,
      message: row.message,
      parent_id: row.parent_id,
      status: row.status,
      created_at: row.created_at,
      edited_by: row.edited_by,
      edited_at: row.edited_at,
      user: {
        id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        avatar_url: row.avatar_url,
      },
      replies: [],
    }, { status: 201 });

  } catch (err: any) {
    console.error('💥 ERROR in /api/comments/new:', err.stack || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
