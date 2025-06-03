import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const FALLBACK_PHOTO = '/uploads/posts/default.jpg';
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get('title')?.toString().trim() || '';
    const excerpt = formData.get('excerpt')?.toString().trim() || '';
    const content = formData.get('content')?.toString().trim() || '';
    const category_id = Number(formData.get('category_id')) || 1;

    const oldPhoto = formData.get('old_photo')?.toString() || '';
    const newPhotoUrl = formData.get('featured_photo_url')?.toString() || FALLBACK_PHOTO;
    const file = formData.get('featured_photo') as File | null;

    let finalPhoto = newPhotoUrl;

    console.log('➡️ RECEIVED DATA:');
    console.log('oldPhoto:', oldPhoto);
    console.log('newPhotoUrl:', newPhotoUrl);
    console.log('File uploaded:', !!file);
    console.log('FALLBACK_PHOTO:', FALLBACK_PHOTO);

    // ✅ If a new photo was uploaded, overwrite newPhotoUrl
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const newFilename = `${uuidv4()}.webp`;
      const finalPath = path.join(UPLOAD_DIR, newFilename);

      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await sharp(buffer).resize(1200).webp().toFile(finalPath);

      finalPhoto = `/uploads/posts/${newFilename}`;
      console.log('✅ Saved new photo to:', finalPhoto);
    }

    // ✅ Delete old photo if changed and not fallback
    if (
      oldPhoto &&
      oldPhoto !== FALLBACK_PHOTO &&
      oldPhoto !== finalPhoto
    ) {
      const oldPath = path.join(process.cwd(), 'public', oldPhoto);

      try {
        await fs.access(oldPath); // Check if file exists
        console.log('🧩 Deleting old photo at path:', oldPath);
        await fs.unlink(oldPath);
        console.log('🗑️ Deleted old featured photo:', oldPhoto);
      } catch (err) {
        console.warn('⚠️ Failed to delete old featured photo:', err);
      }
    } else {
      console.log('📛 No photo deleted — same or fallback image.');
    }

    // ✅ Update the post in the database
    await db.query(
      `UPDATE posts
       SET title = ?, excerpt = ?, content = ?, category_id = ?, featured_photo = ?, updated_at = NOW()
       WHERE slug = ? AND user_id = ?`,
      [title, excerpt, content, category_id, finalPhoto, params.slug, session.user.id]
    );

    console.log('✅ Updated post:', params.slug);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Internal error during post update:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
