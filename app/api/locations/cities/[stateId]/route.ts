import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(_: NextRequest, { params }: { params: { stateId: string } }) {
  const [rows] = await db.query('SELECT id, name FROM cities WHERE state_id = ?', [params.stateId]);
  return NextResponse.json(rows);
}
