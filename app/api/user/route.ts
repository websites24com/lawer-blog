// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserWithDetailsPaginated } from '@/app/lib/users'; // <-- NEW version of query function

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const email = searchParams.get('email') || undefined;
    const providerId = searchParams.get('providerId') || undefined;

    const commentPage = parseInt(searchParams.get('commentPage') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const offset = (commentPage - 1) * limit;

    if (!email && !providerId) {
      return NextResponse.json(
        { error: 'Missing query parameter: email or providerId required' },
        { status: 400 }
      );
    }

    const userData = await getUserWithDetailsPaginated({ email, providerId, offset, limit });

    if (!userData) {
      console.warn('⚠️ No user found for given query');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payload = {
      ...userData,
      posts: userData.posts || [],
      comments: userData.comments || [],
      followed_posts: userData.followed_posts || [],
      followers: userData.followers || [],
      totalComments: userData.totalComments || 0, // <== IMPORTANT
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('❌ Failed to load user data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
