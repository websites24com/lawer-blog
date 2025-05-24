import { NextResponse } from 'next/server';
import { getAllPostsForAdmin } from '@/app/lib/admin';

export async function GET() {
  const posts = await getAllPostsForAdmin();
  return NextResponse.json(posts);
}
