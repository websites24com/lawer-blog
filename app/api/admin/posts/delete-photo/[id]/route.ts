import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth/auth';
import { db } from '@/app/lib/db';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { postId, photoUrl } = await req.json();
    if (!postId || !photoUrl) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const fallback = '/uploads/posts/default.jpg';
    if (photoUrl !== fallback) {
      const filePath = path.join(process.cwd(), 'public', photoUrl);
      try {
        await fs.unlink(filePath);
        console.log(`✅ Deleted photo: ${filePath}`);
      } catch (err) {
        console.warn(`⚠️ Could not delete file: ${filePath}`, err);
      }
    }

    await db.query(
      `UPDATE posts SET featured_photo = ? WHERE id = ?`,
      [fallback, postId]
    );

    return NextResponse.json({ success: true, fallback });
  } catch (err) {
    console.error('❌ Error deleting photo:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
