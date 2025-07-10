// app/lib/tags.ts

import { db } from '@/app/lib/db';
import slugify from 'slugify';

export async function savePostTags(postId: number, tags: string[]) {
  if (!Array.isArray(tags)) return;

  // ✅ 1. Normalize tags: lowercase, remove "#", trim
  const uniqueTags = [...new Set(
    tags
      .map(t => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean)
  )];

  if (uniqueTags.length === 0) return;

  // ✅ 2. Insert tags (name + slug) — IGNORE duplicates
  const tagTuples = uniqueTags.map(name => [
    name,
    slugify(name, { lower: true, strict: true }),
  ]);
  const insertPlaceholders = tagTuples.map(() => '(?, ?)').join(',');

  await db.query(
    `INSERT IGNORE INTO tags (name, slug) VALUES ${insertPlaceholders}`,
    tagTuples.flat()
  );

  // ✅ 3. Get tag IDs
  const [tagRows] = await db.query<any[]>(
    `SELECT id FROM tags WHERE name IN (${uniqueTags.map(() => '?').join(',')})`,
    uniqueTags
  );
  const tagIds = tagRows.map(row => row.id);

  if (tagIds.length === 0) return;

  // ✅ 4. Delete existing post-tag links
  await db.query(`DELETE FROM post_tags WHERE post_id = ?`, [postId]);

  // ✅ 5. Insert new post-tag links using safe placeholders
  const linkPlaceholders = tagIds.map(() => '(?, ?)').join(',');
  const linkValues = tagIds.flatMap(tagId => [postId, tagId]);

  await db.query(
    `INSERT INTO post_tags (post_id, tag_id) VALUES ${linkPlaceholders}`,
    linkValues
  );
}
