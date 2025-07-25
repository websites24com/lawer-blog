'use server';

import { db } from '@/app/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { SimpleUser } from '@/app/lib/definitions';

// ✅ Get users that the given user has blocked
export async function getBlockedUsers(userId: number): Promise<SimpleUser[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.slug, u.avatar_url
     FROM blocked_users bu
     JOIN users u ON u.id = bu.blocked_id
     WHERE bu.blocker_id = ?`,
    [userId]
  );

  return rows as SimpleUser[];
}

// ✅ Get users who have blocked the given user
export async function getBlockedByUsers(userId: number): Promise<SimpleUser[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.first_name, u.last_name, u.slug, u.avatar_url
     FROM blocked_users bu
     JOIN users u ON u.id = bu.blocker_id
     WHERE bu.blocked_id = ?`,
    [userId]
  );

  return rows as SimpleUser[];
}

// ✅ Check if either user has blocked the other (returns true if blocked)
export async function isUserBlocked(viewerId: number, targetId: number): Promise<boolean> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 1 FROM blocked_users
     WHERE (blocker_id = ? AND blocked_id = ?)
        OR (blocker_id = ? AND blocked_id = ?)
     LIMIT 1`,
    [viewerId, targetId, targetId, viewerId]
  );

  return rows.length > 0;
}
