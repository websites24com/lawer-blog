import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { post_id, message, parent_id = null } = await req.json();

    // Validate required fields
    if (!post_id || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 2) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO comments (post_id, user_id, message, parent_id, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [post_id, userId, trimmedMessage, parent_id]
    );

    return NextResponse.json({ success: true, comment_id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('[COMMENT_CREATE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
