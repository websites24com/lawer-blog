import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Optional: delete user's posts, comments, etc. here if needed

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    console.log(`✅ User ${userId} deleted`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
