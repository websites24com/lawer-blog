'use server';

import { db } from '@/app/lib/db';
import { auth } from '@/app/lib/auth/auth';
import { revalidatePath } from 'next/cache';

// ✅ Block a user
export async function blockUser(blockedId: number) {
  const session = await auth();
  const blockerId = session?.user?.id;

  if (!blockerId) throw new Error('Unauthorized');
  if (blockedId === blockerId) throw new Error('You cannot block yourself');

  await db.query(
    'INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
    [blockerId, blockedId]
  );

  revalidatePath(`/users/${blockedId}`);
}

// ✅ Unblock a user
export async function unblockUser(blockedId: number) {
  const session = await auth();
  const blockerId = session?.user?.id;

  if (!blockerId) throw new Error('Unauthorized');

  await db.query(
    'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
    [blockerId, blockedId]
  );

  revalidatePath(`/users/${blockedId}`);
}
