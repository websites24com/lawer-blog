import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { REACTIONS } from '@/app/lib/definitions';
import { auth } from '@/app/lib/auth/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  // Get the authenticated user session
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract post_id and reaction from the request body
  const { post_id, reaction } = await req.json();

  // Validate that post_id is present and reaction is one of the allowed values
  if (!post_id || !reaction || !Object.values(REACTIONS).includes(reaction)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user_id = Number(session.user.id);

  // Query to check if the user already reacted to this post
  const [rows] = await db.execute(
    'SELECT reaction FROM post_reactions WHERE user_id = ? AND post_id = ?',
    [user_id, post_id]
  );

  // Cast the result to a RowDataPacket[] so TypeScript understands its structure
  const result = rows as RowDataPacket[];
  const existing = result[0] as { reaction: string } | undefined;

  if (!existing) {
    // ➕ No reaction yet — insert new
    await db.execute(
      'INSERT INTO post_reactions (user_id, post_id, reaction) VALUES (?, ?, ?)',
      [user_id, post_id, reaction]
    );
    return NextResponse.json({ status: 'added' });
  }

  if (existing.reaction === reaction) {
    // ❌ Same reaction — user clicked again → toggle off
    await db.execute(
      'DELETE FROM post_reactions WHERE user_id = ? AND post_id = ?',
      [user_id, post_id]
    );
    return NextResponse.json({ status: 'removed' });
  }

  // 🔁 Different reaction exists — update to the new one
  await db.execute(
    'UPDATE post_reactions SET reaction = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND post_id = ?',
    [reaction, user_id, post_id]
  );
  return NextResponse.json({ status: 'updated' });
}
