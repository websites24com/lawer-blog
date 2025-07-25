// /api/user/blocking/block/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireAuth } from '@/app/lib/auth/requireAuth';

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(); // get authenticated user
    const { targetUserId } = await req.json();

    // ❌ Validate
    if (!targetUserId || typeof targetUserId !== 'number') {
      return NextResponse.json({ error: 'Invalid or missing targetUserId' }, { status: 400 });
    }

    // ✅ Get target user's role
    const [[target]] = await db.query<RowDataPacket[]>(
      `SELECT role FROM users WHERE id = ? LIMIT 1`,
      [targetUserId]
    );

    if (!target) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // 🚫 Prevent USER from blocking MODERATOR or ADMIN
    if (user.role === 'USER' && (target.role === 'MODERATOR' || target.role === 'ADMIN')) {
      return NextResponse.json(
        { error: 'You cannot block a moderator or admin' },
        { status: 403 }
      );
    }

    // ✅ Insert into blocked_users (ignore duplicates)
    await db.query(
      `INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)`,
      [user.id, targetUserId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ POST /blocking/block error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
