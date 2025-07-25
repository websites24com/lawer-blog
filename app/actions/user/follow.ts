'use server';

import { db } from '@/app/lib/db';
import { auth } from '@/app/lib/auth/auth';

export async function followPost(postId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.query(
    'INSERT IGNORE INTO followed_posts (user_id, post_id) VALUES (?, ?)',
    [session.user.id, postId]
  );
}

export async function unfollowPost(postId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.query(
    'DELETE FROM followed_posts WHERE user_id = ? AND post_id = ?',
    [session.user.id, postId]
  );
}
