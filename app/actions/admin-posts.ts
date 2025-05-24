'use server';

import { deletePost } from '@/app/lib/admin';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export async function deletePostAction(postId: number) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await deletePost(postId);
}

export async function updatePostStatus(postId: number, status: 'approved' | 'declined') {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
  
    await db.query('UPDATE posts SET status = ?, updated_at = NOW() WHERE id = ?', [status, postId]);
  }
