import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(_: NextRequest, { params }: { params: { countryId: string } }) {
  const [rows] = await db.query('SELECT id, name FROM states WHERE country_id = ?', [params.countryId]);
  return NextResponse.json(rows);
}
