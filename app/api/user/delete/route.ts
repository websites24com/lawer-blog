import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { requireApiAuth } from '@/app/lib/auth/requireApiAuth';

export async function DELETE(req: NextRequest) {
  try {
   const { user } = await requireApiAuth({ roles: ['USER', 'ADMIN', 'MODERATOR'] });
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');

    let targetUserId: number = user.id;
    const isAdmin = user.role === 'ADMIN';
    const isModerator = user.role === 'MODERATOR';

    if (idParam !== null) {
      const parsedId = Number(idParam);
      if (isNaN(parsedId) || parsedId <= 0) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      if ((isAdmin || isModerator) && parsedId !== user.id) {
        const [rows] = (await db.query(
          'SELECT role FROM users WHERE id = ?',
          [parsedId]
        )) as unknown as Array<{ role: string }[]>;

        const targetUser = rows?.[0];
        if (!targetUser) {
          return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        if (
          isModerator &&
          (targetUser.role === 'ADMIN' || targetUser.role === 'MODERATOR')
        ) {
          return NextResponse.json(
            { error: 'You are not allowed to delete ADMIN or MODERATOR accounts' },
            { status: 403 }
          );
        }

        targetUserId = parsedId;
      } else if (parsedId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized deletion attempt' },
          { status: 403 }
        );
      }
    }

    // 🌪 Delete related data in order (if not ON DELETE CASCADE)
    await db.query('DELETE FROM followed_posts WHERE user_id = ?', [targetUserId]);
    await db.query('DELETE FROM user_followers WHERE follower_id = ? OR followed_id = ?', [targetUserId, targetUserId]);
    await db.query('DELETE FROM comments WHERE user_id = ?', [targetUserId]);
    await db.query('DELETE FROM posts WHERE user_id = ?', [targetUserId]); // optionally delete associated post photos from disk

    // ❌ Finally delete user
    await db.query('DELETE FROM users WHERE id = ?', [targetUserId]);

    return NextResponse.json({ success: true, targetUserId });
  } catch (error) {
    console.error('DELETE /api/user/delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
