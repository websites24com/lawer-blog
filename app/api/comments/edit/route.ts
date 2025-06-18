import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/lib/authConfig'; // ✅ Correct auth config path
import type { UserRow } from '@/app/lib/definitions';

// PATCH /api/comments/edit
export async function PATCH(req: Request) {
  try {
    // ✅ Get the current session using NextAuth and your auth config
    const session = await getServerSession(authConfig);
    const user = session?.user as UserRow | undefined;

    // ✅ If the user is not logged in, return Unauthorized
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Parse incoming JSON request body
    const body = await req.json();
    const { comment_id, content } = body;

    // ✅ Validate input: comment_id must exist, content must be a non-empty string
    if (!comment_id || typeof content !== 'string' || content.trim().length < 2) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // ✅ Update the comment:
    // - Set new message
    // - Set status back to 'pending'
    // - Record who edited and when
    const [result] = await db.query(
      `
      UPDATE comments
      SET message = ?, status = 'pending', edited_by = ?, edited_at = NOW()
      WHERE id = ? AND user_id = ?
      `,
      [content.trim(), user.id, comment_id, user.id]
    );

    // ✅ If no rows were updated (e.g. wrong user or comment doesn't exist)
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Comment not found or not allowed' }, { status: 404 });
    }

    // ✅ Fetch the updated comment with user info to return to the frontend
    const [rows] = await db.query<any[]>(
      `
      SELECT 
        c.id, c.post_id, c.user_id, c.parent_id,
        c.message AS content, c.status,
        c.edited_by, c.edited_at, c.created_at,
        u.first_name, u.last_name, u.avatar_url, u.slug
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
      `,
      [comment_id]
    );

    const updated = rows[0];

    // ✅ Return the updated comment in the expected format
    return NextResponse.json({
      id: updated.id,
      post_id: updated.post_id,
      user_id: updated.user_id,
      parent_id: updated.parent_id,
      content: updated.content,
      status: updated.status,
      edited_by: updated.edited_by,
      edited_at: updated.edited_at,
      created_at: updated.created_at,
      user: {
        id: updated.user_id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        avatar_url: updated.avatar_url,
        slug: updated.slug,
      },
      replies: [], // optional, used for nesting
    });
  } catch (err) {
    console.error('💥 Error in PATCH /api/comments/edit:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
