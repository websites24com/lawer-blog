'use server';

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/app/lib/auth/requireApiAuth';
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
  try {
     // ✅ Authenticate the user and restrict to allowed roles
    const { user } = await requireApiAuth({ roles: ['USER', 'MODERATOR', 'ADMIN'] });

    // ✅ Step 2: Parse form data
    const formData = await req.formData();
    const title = formData.get('title')?.toString().trim() || '';
    const excerpt = formData.get('excerpt')?.toString().trim() || '';
    const content = formData.get('content')?.toString().trim() || '';
    const country_id = Number(formData.get('country_id')) || null;
    const state_id = Number(formData.get('state_id')) || null;
    const city_id = Number(formData.get('city_id')) || null;

    const category_id = Number(formData.get('category_id')) || 1;
    const featured_photo_url = formData.get('featured_photo_url')?.toString();
    const rawTags = formData.get('tags')?.toString() || '';

    // ✅ NEW: Read location values from form or use fallback (Mexico City)
    const lat = parseFloat(formData.get('lat')?.toString() || '') || 19.4326;
    const lon = parseFloat(formData.get('lon')?.toString() || '') || -99.1332;

    if (!title || !excerpt || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ✅ Step 3: Process featured photo
    let photoPath = '/uploads/posts/default.jpg';
    if (featured_photo_url && featured_photo_url.startsWith('/uploads/posts/')) {
      photoPath = featured_photo_url;
    }

    // ✅ Step 4: Insert post with location
    const slug = uuid();
    const [result] = await db.execute(
      `INSERT INTO posts (
        title, excerpt, content, category_id, user_id,
        featured_photo, status, slug, location, country_id, state_id, city_id
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ST_GeomFromText(?), ?, ?, ?)`,
      [
        title,
        excerpt,
        content,
        category_id,
        user.id,
        photoPath,
        slug,
        `POINT(${lon} ${lat})`, // POINT(X Y) = POINT(lon lat)
        country_id,
        state_id,
        city_id,
      ]
    );

    const postId = (result as any).insertId;

    // ✅ Step 5: Save tags
    const tags = extractHashtags(rawTags);
    if (tags.length > 0) {
      await savePostTags(postId, tags);
    }

    // ✅ Step 6: Cleanup unused uploaded images
    const usedImages = extractImageUrls(content);
    if (!usedImages.has(photoPath)) {
      usedImages.add(photoPath);
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/posts');
    const files = await fs.readdir(uploadDir);

    for (const file of files) {
      const fileUrl = `/uploads/posts/${file}`;
      if (!usedImages.has(fileUrl) && !fileUrl.includes('default.jpg')) {
        try {
          await fs.unlink(path.join(uploadDir, file));
        } catch {
          // File may already be deleted — ignore
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Create Post Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
