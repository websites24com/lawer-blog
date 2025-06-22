'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { savePostTags } from '@/app/lib/tags';

// ✅ Extract image paths used in post content
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

// ✅ Extract hashtags like #law #rights from string
function extractHashtags(text: string): string[] {
  return Array.from(new Set((text.match(/#\w+/g) || []).map(tag => tag.trim())));
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
  const rawTags = formData.get('tags')?.toString() || ''; // ✅ now included

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let photoPath = '/uploads/posts/default.jpg';
  if (featured_photo_url && featured_photo_url.startsWith('/uploads/posts/')) {
    photoPath = featured_photo_url;
  }

  try {
    // ✅ 1. Insert post
    const slug = uuid();
    const [result] = await db.execute(
      `INSERT INTO posts (title, excerpt, content, category_id, user_id, featured_photo, status, slug)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [title, excerpt, content, category_id, session.user.id, photoPath, slug]
    );

    const postId = (result as any).insertId;

    // ✅ 2. Extract hashtags from tags field (NOT title/content)
    const tags = extractHashtags(rawTags);
    if (tags.length > 0) {
      await savePostTags(postId, tags);
    }

    // ✅ 3. Cleanup unused uploaded images
    const usedImages = extractImageUrls(content);
    if (!usedImages.has(photoPath)) {
      usedImages.add(photoPath);
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
