// File: app/api/tags/search/route.ts

import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase().replace(/^#/, '').trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const [rows] = await db.query(
    `SELECT name FROM tags WHERE name LIKE ? ORDER BY name LIMIT 10`,
    [`${q}%`]
  );

  const tagNames = (rows as { name: string }[]).map((row) => row.name);
  return NextResponse.json(tagNames);
}
