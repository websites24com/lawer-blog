// File: app/api/posts/route.ts
import { getAllApprovedPosts } from '@/app/lib/posts';
import { NextResponse } from 'next/server';

export async function GET() {
  const posts = await getAllApprovedPosts();
  return NextResponse.json(posts);
}
