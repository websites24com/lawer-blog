import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export const runtime = 'nodejs'; // Ensures this runs in full Node.js

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    console.log('❌ Unauthorized access');
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

    console.log('📦 Received payload:', {
      id,
      title,
      excerpt,
      content,
      category,
      status,
      featured_photo,
    });

    if (!id || !title || !excerpt || !content || !category || !status) {
      console.log('❗ Missing fields:', {
        id,
        title,
        excerpt,
        content,
        category,
        status,
      });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    console.log('🔍 Looking up category by name:', category);
    const [categoryResult] = await db.query(
      'SELECT id FROM categories WHERE name = ? LIMIT 1',
      [category]
    ) as [{ id: number }[], any];

    console.log('📋 Category lookup result:', categoryResult);

    const category_id = categoryResult[0]?.id || null;
    console.log('✅ Final category ID:', category_id);

    const updateParams = [
      title,
      excerpt,
      content,
      status,
      category_id,
      featured_photo,
      id,
    ];

    console.log('📤 Executing UPDATE with:', updateParams);

    await db.query(
      `UPDATE posts 
       SET title = ?, excerpt = ?, content = ?, status = ?, category_id = ?, featured_photo = ?, updated_at = NOW()
       WHERE id = ?`,
      updateParams
    );

    console.log('✅ Post updated successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/admin/posts/edit] ❌ Server Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
