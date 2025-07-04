import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { RowDataPacket } from 'mysql2';

import { db } from '@/app/lib/db';
import { RequireAuth } from '@/app/lib/auth/requireAuth';
import { ROLES } from '@/app/lib/auth/roles';

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ Step 1: Auth and role validation
    const { user } = await RequireAuth({
      roles: [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
    });

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // ✅ Step 2: Load post with owner
    const [rows] = await db.execute(
      'SELECT id, user_id, featured_photo FROM posts WHERE id = ? LIMIT 1',
      [postId]
    );
    const post = (rows as RowDataPacket[])[0];

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // ✅ Step 3: Access check
    const isOwner = post.user_id === user.id;
    const isPrivileged = [ROLES.ADMIN, ROLES.MODERATOR].includes(user.role);

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ Step 4: Move photo to /to_delete if not default
    const photoPath = post.featured_photo;
    if (photoPath && !photoPath.includes('default.jpg')) {
      const currentPhotoPath = path.join(process.cwd(), 'public', photoPath);
      const toDeleteDir = path.join(process.cwd(), 'public/uploads/posts/to_delete');
      const fileName = path.basename(currentPhotoPath);
      const markedPath = path.join(toDeleteDir, fileName);

      try {
        await fs.mkdir(toDeleteDir, { recursive: true });
        await fs.rename(currentPhotoPath, markedPath);
        console.log('🗑️ Moved photo to /to_delete:', markedPath);
      } catch (err) {
        console.warn('⚠️ Failed to move photo to /to_delete:', err);
      }
    }

    // ✅ Step 5: Delete related tags and post
    await db.execute('DELETE FROM post_tags WHERE post_id = ?', [postId]);
    const [result] = await db.execute('DELETE FROM posts WHERE id = ?', [postId]);

    console.log(`✅ Post #${postId} deleted by user #${user.id} (${user.role})`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ DELETE route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
