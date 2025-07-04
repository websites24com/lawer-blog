import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  const [rows] = await db.query('SELECT id, name FROM countries');
  return NextResponse.json(rows);
}
