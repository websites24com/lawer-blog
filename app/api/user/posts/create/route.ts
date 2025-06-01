'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

function extractImageUrls(html: string): Set<string> {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const urls = new Set<string>();
  let match;
  while ((match = regex.exec(html))) {
    const src = match[1];
    if (src.startsWith('/uploads/posts/') && !src.includes('default.jpg')) {
      urls.add(src);
    }
  }
  return urls;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const title = formData.get('title')?.toString().trim() || '';
  const excerpt = formData.get('excerpt')?.toString().trim() || '';
  const content = formData.get('content')?.toString().trim() || '';
  const category_id = Number(formData.get('category_id')) || 1;
  const featured_photo_url = formData.get('featured_photo_url')?.toString();

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let photoPath = '/uploads/posts/default.jpg';
  if (featured_photo_url && featured_photo_url.startsWith('/uploads/posts/')) {
    photoPath = featured_photo_url;
  }

  try {
    await db.execute(
      `INSERT INTO posts (title, excerpt, content, category_id, user_id, featured_photo, status, slug)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [title, excerpt, content, category_id, session.user.id, photoPath, uuid()]
    );

    const usedImages = extractImageUrls(content);
    if (!usedImages.has(photoPath)) {
      usedImages.add(photoPath); // prevent deleting the featured image
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/posts');
    const files = await fs.readdir(uploadDir);
    for (const file of files) {
      const fileUrl = `/uploads/posts/${file}`;
      if (!usedImages.has(fileUrl) && !fileUrl.includes('default.jpg')) {
        await fs.unlink(path.join(uploadDir, file)).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('🔥 DB Insert Error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}