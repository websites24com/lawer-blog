import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { unlink, stat } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();

  const title = formData.get('title')?.toString().trim() || '';
  const content = formData.get('content')?.toString().trim() || '';
  const excerpt = formData.get('excerpt')?.toString().trim() || '';
  const category_id = parseInt(formData.get('category_id')?.toString() || '0');
  const old_photo = formData.get('old_photo')?.toString() || '';

  const file = formData.get('featured_photo') as File | null;
  const uploadedUrl = formData.get('featured_photo_url')?.toString() || '';

  const [[post]] = await db.query('SELECT id, featured_photo FROM posts WHERE slug = ?', [params.slug]) as any[];
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  let newPhotoPath = old_photo;

  // ✅ CASE 1: Raw image file uploaded
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const filename = `${uuidv4()}.webp`;
    const fullPath = path.join(UPLOAD_DIR, filename);
    newPhotoPath = `/uploads/posts/${filename}`;

    await sharp(buffer).resize(1200, 800).webp().toFile(fullPath);

    // ✅ Delete old image if it's not fallback and not the same
    await tryDeleteOldPhoto(old_photo, newPhotoPath);

  // ✅ CASE 2: Cropped photo uploaded earlier and passed as URL
  } else if (
    uploadedUrl &&
    uploadedUrl.startsWith('/uploads/posts/') &&
    uploadedUrl !== old_photo
  ) {
    newPhotoPath = uploadedUrl;

    // ✅ Delete old image if it's not fallback and not the same
    await tryDeleteOldPhoto(old_photo, uploadedUrl);

  // ✅ CASE 3: No image selected → fallback used
  } else if (
    (!file || file.size === 0) &&
    (!uploadedUrl || uploadedUrl.trim() === '') &&
    old_photo &&
    !old_photo.includes('default.jpg')
  ) {
    newPhotoPath = '/uploads/posts/default.jpg';
    await tryDeleteOldPhoto(old_photo, newPhotoPath);
  }

  // ✅ Update post in DB
  await db.query(
    'UPDATE posts SET title = ?, content = ?, excerpt = ?, category_id = ?, featured_photo = ? WHERE slug = ?',
    [title, content, excerpt, category_id, newPhotoPath, params.slug]
  );

  return NextResponse.json({ success: true });
}

// 🔧 Utility: Try to delete photo only if it's different and valid
async function tryDeleteOldPhoto(oldPath: string, newPath: string) {
  if (
    oldPath &&
    oldPath.startsWith('/uploads/posts/') &&
    !oldPath.includes('default.jpg') &&
    oldPath !== newPath
  ) {
    const absolutePath = path.join(process.cwd(), 'public', oldPath);
    try {
      await stat(absolutePath); // Check if file exists first
      await unlink(absolutePath);
      console.log('🗑️ Deleted old photo:', oldPath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.warn('⚠️ File not found (already deleted?):', oldPath);
      } else {
        console.error('❌ Failed to delete photo:', oldPath, err);
      }
    }
  }
}
