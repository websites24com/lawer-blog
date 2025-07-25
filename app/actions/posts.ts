// File: app/actions/posts.ts

'use server';

import { db } from '@/app/lib/db';
import slugify from 'slugify';
import { auth } from '@/app/lib/auth/auth';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { mkdir, writeFile, unlink, rename } from 'fs/promises';
import sharp from 'sharp';

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const user_id = session.user.id;

  const title = formData.get('title')?.toString().trim() || '';
  const content = formData.get('content')?.toString().trim() || '';
  const excerpt = formData.get('excerpt')?.toString().trim() || '';
  const category_id = parseInt(formData.get('category_id')?.toString() || '0', 10);
  const tagsRaw = formData.get('tags')?.toString().trim() || '';
  const photoFile = formData.get('featured_photo') as File | null;

  if (!title || !content || !excerpt || !category_id) {
    throw new Error('Missing required post data');
  }

  let featured_photo: string | null = null;

  // ✅ Save and process image if present
  if (photoFile && photoFile.size > 0) {
    const buffer = Buffer.from(await photoFile.arrayBuffer());

    const fileName = `${uuid()}.webp`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/posts');
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const processedImage = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    await writeFile(filePath, processedImage);
    featured_photo = `/uploads/posts/${fileName}`;
  }

  const slug = slugify(title, { lower: true, strict: true }).substring(0, 100);

  // ✅ Insert the post
  const [result] = await db.query(
    `INSERT INTO posts (title, slug, excerpt, content, user_id, category_id, featured_photo, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
    [title, slug, excerpt, content, user_id, category_id, featured_photo]
  );

  const post_id = (result as any).insertId;

  // ✅ Handle tags
  if (tagsRaw) {
    // Parse and normalize tags from input
    const tagList = tagsRaw
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#+/, '').toLowerCase())
      .filter((tag) => tag.length > 1);

    const uniqueTags = Array.from(new Set(tagList)).slice(0, 10);

    for (const name of uniqueTags) {
      const slug = slugify(name, { lower: true, strict: true });

      // Insert tag if not exists
      const [tagRows] = await db.query('SELECT id FROM tags WHERE name = ?', [name]);
      let tag_id: number;

      if ((tagRows as any[]).length > 0) {
        tag_id = (tagRows as any)[0].id;
      } else {
        const [insertTag] = await db.query(
          'INSERT INTO tags (name, slug) VALUES (?, ?)',
          [name, slug]
        );
        tag_id = (insertTag as any).insertId;
      }

      // ✅ Link post to tag
      await db.query(
        'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
        [post_id, tag_id]
      );
    }
  }
}




export async function updatePost(
  postId: number,
  data: {
    title: string;
    excerpt: string;
    content: string;
    category_id: string;
    featured_photo: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [rows] = await db.query('SELECT id FROM posts WHERE id = ? AND user_id = ?', [postId, session.user.id]);
  if ((rows as any[]).length === 0) throw new Error('Post not found or access denied');

  await db.query(
    `UPDATE posts SET title = ?, excerpt = ?, content = ?, category_id = ?, featured_photo = ?, updated_at = NOW() WHERE id = ?`,
    [data.title, data.excerpt, data.content, data.category_id, data.featured_photo, postId]
  );
}

export async function deletePostAction(postId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [rows] = await db.query('SELECT featured_photo FROM posts WHERE id = ? AND user_id = ?', [postId, session.user.id]);
  const post = (rows as any[])[0];
  if (!post) throw new Error('Post not found or access denied');

  if (post.featured_photo && !post.featured_photo.includes('default.jpg')) {
    const photoPath = path.join(process.cwd(), 'public', post.featured_photo);
    try {
      await rename(photoPath, photoPath + '.to_delete');
      console.log('🗑️ Marked post photo for deletion:', photoPath + '.to_delete');
    } catch (err) {
      console.warn('⚠️ Failed to mark post photo for deletion:', err);
    }
  }

  await db.query('DELETE FROM posts WHERE id = ? AND user_id = ?', [postId, session.user.id]);
}
