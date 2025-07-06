'use server';

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/app/lib/auth/requireApiAuth';
import { db } from '@/app/lib/db';

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

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
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

    const lat = parseFloat(formData.get('lat')?.toString() || '') || 19.4326;
    const lon = parseFloat(formData.get('lon')?.toString() || '') || -99.1332;

    // ✅ Step 3: Fetch post ID by slug
    const [rows] = await db.query('SELECT id, user_id FROM posts WHERE slug = ?', [params.slug]);
    const post = (rows as any[])[0];
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const isOwner = post.user_id === user.id;
    const isPrivileged = ['MODERATOR', 'ADMIN'].includes(user.role);
    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ Step 4: Process featured photo
    let photoPath = '/uploads/posts/default.jpg';
    if (featured_photo_url && featured_photo_url.startsWith('/uploads/posts/')) {
      photoPath = featured_photo_url;
    }

    // ✅ Step 5: Update post
    await db.query(
      `UPDATE posts SET
        title = ?, excerpt = ?, content = ?, category_id = ?, featured_photo = ?,
        location = ST_GeomFromText(?), country_id = ?, state_id = ?, city_id = ?
      WHERE id = ?`,
      [
        title,
        excerpt,
        content,
        category_id,
        photoPath,
        `POINT(${lon} ${lat})`,
        country_id,
        state_id,
        city_id,
        post.id,
      ]
    );

    // ✅ Step 6: Save tags
    const tags = extractHashtags(rawTags);
    if (tags.length > 0) {
      await savePostTags(post.id, tags);
    }

    // ✅ Step 7: Cleanup unused uploaded images
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
          // Ignore errors if already deleted
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Edit Post Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
