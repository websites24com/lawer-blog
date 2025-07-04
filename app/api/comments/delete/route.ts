import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { auth } from '@/app/lib/auth/auth';

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { comment_id } = body;

    if (!comment_id || isNaN(Number(comment_id))) {
      return NextResponse.json({ error: 'Invalid comment_id' }, { status: 400 });
    }

    // Optional: verify ownership or role
    const [rows] = await db.query(
      `SELECT user_id FROM comments WHERE id = ?`,
      [comment_id]
    );
    const comment = (rows as any[])[0];

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isOwner = comment.user_id === userId;
    const isModerator = ['MODERATOR', 'ADMIN'].includes(session.user.role);

    if (!isOwner && !isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete comment (or soft-delete if needed)
    await db.query(`DELETE FROM comments WHERE id = ?`, [comment_id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('💥 Error in DELETE /api/comments/delete:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
