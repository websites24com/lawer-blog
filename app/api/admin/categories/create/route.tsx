import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth/auth';
import { db } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name || typeof name !== 'string' || name.length < 2) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  const [existing] = await db.query(
    'SELECT id FROM categories WHERE name = ? LIMIT 1',
    [name]
  ) as any[];

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Category exists' }, { status: 400 });
  }

  const [result] = await db.query(
    'INSERT INTO categories (name, slug) VALUES (?, ?)',
    [name, name.toLowerCase().replace(/\s+/g, '-')]
  ) as any;

  return NextResponse.json({ id: result.insertId, name });
}
