// app/lib/tags.ts
import { db } from '@/app/lib/db';
import slugify from 'slugify';

export async function savePostTags(postId: number, tags: string[]) {
  if (!Array.isArray(tags)) return;

  const uniqueTags = [...new Set(
    tags
      .map(t => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean)
  )];

  if (uniqueTags.length === 0) return;

  // ✅ 1. Insert tags (name + slug)
  const tagTuples = uniqueTags.map(name => [name, slugify(name, { lower: true, strict: true })]);
  const insertValues = tagTuples.map(() => '(?, ?)').join(',');

  await db.query(
    `INSERT IGNORE INTO tags (name, slug) VALUES ${insertValues}`,
    tagTuples.flat()
  );

  // ✅ 2. Get tag IDs
  const [tagRows] = await db.query<any[]>(
    `SELECT id FROM tags WHERE name IN (${uniqueTags.map(() => '?').join(',')})`,
    uniqueTags
  );
  const tagIds = tagRows.map(row => row.id);

  // ✅ 3. Delete existing tags for the post
  await db.query(`DELETE FROM post_tags WHERE post_id = ?`, [postId]);

  // ✅ 4. Insert new post_tag links
  const values = tagIds.map(tagId => `(${postId}, ${tagId})`).join(',');
  if (values) {
    await db.query(`INSERT INTO post_tags (post_id, tag_id) VALUES ${values}`);
  }
}
