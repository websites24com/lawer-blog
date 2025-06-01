// File: app/api/user/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import path from 'path';
import fs from 'fs/promises';
import type { RowDataPacket } from 'mysql2';

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    console.log('🔍 Attempting to delete post', {
      postId,
      userId: session.user.id
    });

    // Fetch the post's featured photo path
    const [rows] = await db.execute(
      'SELECT featured_photo FROM posts WHERE id = ? AND user_id = ? LIMIT 1',
      [postId, session.user.id]
    );

    const post = (rows as RowDataPacket[])[0];
    const photoPath = post?.featured_photo;

    // Move the photo to the /to_delete subfolder if it's not the default
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

    // Delete the post
    const [result] = await db.execute('DELETE FROM posts WHERE id = ? AND user_id = ?', [postId, session.user.id]);
    console.log('✅ Deletion result:', result);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ DELETE route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
