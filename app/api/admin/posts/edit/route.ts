import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export const runtime = 'nodejs'; // Ensures this runs in full Node.js

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      id,
      title,
      excerpt,
      content,
      category,
      status,
      featured_photo,
    } = await req.json();

    if (!id || !title || !excerpt || !content || !category || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const [categoryResult] = await db.query(
      'SELECT id FROM categories WHERE name = ? LIMIT 1',
      [category]
    ) as [{ id: number }[], any];

    const category_id = categoryResult[0]?.id || null;

    await db.query(
      `UPDATE posts 
       SET title = ?, excerpt = ?, content = ?, status = ?, category_id = ?, featured_photo = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, excerpt, content, status, category_id, featured_photo, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/admin/posts/edit] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
