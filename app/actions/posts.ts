'use server';

import { db } from '@/app/lib/db';
import slugify from 'slugify';
import { auth } from '@/app/lib/auth';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import sharp from 'sharp';

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const user_id = session.user.id;

  const [userRows] = await db.query('SELECT id FROM users WHERE id = ? LIMIT 1', [user_id]);
  if ((userRows as any[]).length === 0) throw new Error('User not found in database');

  const title = formData.get('title')?.toString().trim() || '';
  const content = formData.get('content')?.toString().trim() || '';
  const excerpt = formData.get('excerpt')?.toString().trim() || '';
  const category_id = parseInt(formData.get('category_id')?.toString() || '0', 10);
  const photoFile = formData.get('featured_photo') as File | null;

  if (!title || !content || !excerpt || !category_id) {
    throw new Error('Missing required post data');
  }

  let featured_photo: string | null = null;

  if (photoFile && photoFile.size > 0) {
    const buffer = Buffer.from(await photoFile.arrayBuffer());

    const fileName = `${uuid()}.webp`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/posts');
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true }); // make sure folder exists

    // ✅ Convert to WebP and resize to max width 1200px
    const processedImage = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    await writeFile(filePath, processedImage);
    featured_photo = fileName;
  }

  const slug = slugify(title, { lower: true, strict: true }).substring(0, 100);

  await db.query(
    `INSERT INTO posts (title, slug, excerpt, content, user_id, category_id, featured_photo, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
    [title, slug, excerpt, content, user_id, category_id, featured_photo]
  );
}


// ✅ RESTORED follow/unfollow functions

export async function followPost(postId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.query(
    'INSERT IGNORE INTO followed_posts (user_id, post_id) VALUES (?, ?)',
    [session.user.id, postId]
  );
}

export async function unfollowPost(postId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.query(
    'DELETE FROM followed_posts WHERE user_id = ? AND post_id = ?',
    [session.user.id, postId]
  );
}
