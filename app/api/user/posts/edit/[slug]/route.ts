'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { savePostTags } from '@/app/lib/tags';
import { RequireAuth } from '@/app/lib/auth/requireAuth';
import { ROLES } from '@/app/lib/auth/roles';

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');
const FALLBACK_PHOTO = '/uploads/posts/default.jpg';

// 🧠 Helper to extract clean hashtag list from raw string
function extractHashtags(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    // ✅ Centralized auth with roles
    const { user } = await RequireAuth({
      roles: [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
    });

    const formData = await req.formData();

    const title = formData.get('title')?.toString() || '';
    const excerpt = formData.get('excerpt')?.toString() || '';
    const content = formData.get('content')?.toString() || '';
    const categoryId = Number(formData.get('category_id'));
    const tagsString = formData.get('tags')?.toString() || '';
    const oldPhoto = formData.get('old_photo')?.toString() || FALLBACK_PHOTO;
    const featuredPhotoFile = formData.get('featured_photo') as File | null;

    const hashtags = extractHashtags(tagsString);

    // ✅ Get post ID and owner
    const [rows] = await db.query('SELECT id, user_id FROM posts WHERE slug = ?', [params.slug]);
    const post = (rows as any[])[0];
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const isOwner = post.user_id === user.id;
    const isPrivileged = [ROLES.ADMIN, ROLES.MODERATOR].includes(user.role);

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let featuredPhotoUrl = formData.get('featured_photo_url')?.toString() || FALLBACK_PHOTO;

    // ✅ Save new uploaded photo (if any)
    if (featuredPhotoFile && featuredPhotoFile.size > 0) {
      const ext = path.extname(featuredPhotoFile.name) || '.webp';
      const fileName = `${uuidv4()}${ext}`;
      const buffer = Buffer.from(await featuredPhotoFile.arrayBuffer());
      const fullPath = path.join(UPLOAD_DIR, fileName);

      await sharp(buffer).resize(1280).toFile(fullPath);
      featuredPhotoUrl = `/uploads/posts/${fileName}`;

      // ✅ Delete old photo if needed
      if (oldPhoto && oldPhoto !== FALLBACK_PHOTO) {
        const oldPath = path.join(process.cwd(), 'public', oldPhoto);
        try {
          await fs.unlink(oldPath);
        } catch {}
      }
    }

    // ✅ Update post
    await db.query(
      `UPDATE posts SET title = ?, excerpt = ?, content = ?, category_id = ?, featured_photo = ? WHERE id = ?`,
      [title, excerpt, content, categoryId, featuredPhotoUrl, post.id]
    );

    // ✅ Save tags
    await savePostTags(post.id, hashtags);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /edit/:slug error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
