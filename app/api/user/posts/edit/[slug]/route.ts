'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { z } from 'zod';

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const FALLBACK_PHOTO = '/uploads/posts/default.jpg';
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

// ✅ Zod schema to validate form fields
const PostUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  category_id: z.coerce.number().min(1),
  featured_photo_url: z.string().min(0), // ✅ Accepts relative or empty
  old_photo: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    // ✅ Extract all non-file fields into raw object
    const raw = {
      title: formData.get('title')?.toString() || '',
      excerpt: formData.get('excerpt')?.toString() || '',
      content: formData.get('content')?.toString() || '',
      category_id: formData.get('category_id')?.toString() || '',
      featured_photo_url: formData.get('featured_photo_url')?.toString() || '',
      old_photo: formData.get('old_photo')?.toString() || '',
    };

    console.log('📥 Incoming raw form fields:', raw);

    // ✅ Validate the fields using Zod
    const result = PostUpdateSchema.safeParse(raw);
    if (!result.success) {
      console.log('❌ Validation failed:', result.error.issues);
      return NextResponse.json({ error: 'Validation failed', issues: result.error.issues }, { status: 400 });
    }

    // ✅ Use validated values
    const { title, excerpt, content, category_id, featured_photo_url, old_photo } = result.data;

    const file = formData.get('featured_photo') as File | null;
    let finalPhoto = featured_photo_url || FALLBACK_PHOTO;

    // ✅ Upload new file if exists
    if (file && file.size > 0) {
      console.log('📸 Uploading new featured photo...');
      const buffer = Buffer.from(await file.arrayBuffer());
      const newFilename = `${uuidv4()}.webp`;
      const finalPath = path.join(UPLOAD_DIR, newFilename);

      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await sharp(buffer).resize(1200).webp().toFile(finalPath);

      finalPhoto = `/uploads/posts/${newFilename}`;
      console.log('✅ New photo saved at:', finalPhoto);
    }

    // ✅ Delete old photo if changed and not fallback
    if (old_photo && old_photo !== finalPhoto && old_photo !== FALLBACK_PHOTO) {
      const oldPath = path.join(process.cwd(), 'public', old_photo);
      try {
        await fs.access(oldPath);
        await fs.unlink(oldPath);
        console.log('🗑️ Deleted old photo:', oldPath);
      } catch (err) {
        console.warn('⚠️ Could not delete old photo:', oldPath, err);
      }
    }

    // ✅ Update the post in the database
    await db.query(
      `UPDATE posts
       SET title = ?, excerpt = ?, content = ?, category_id = ?, featured_photo = ?, updated_at = NOW()
       WHERE slug = ? AND user_id = ?`,
      [
        title,
        excerpt,
        content,
        category_id,
        finalPhoto,
        params.slug,
        session.user.id,
      ]
    );

    console.log('✅ Post successfully updated in database.');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Post update route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
