import { NextRequest, NextResponse } from 'next/server';
import { getUserWithDetails } from '@/app/lib/users';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const email = searchParams.get('email') || undefined;
    const providerId = searchParams.get('providerId') || undefined;

    if (!email && !providerId) {
      return NextResponse.json({ error: 'Missing query parameter: email or providerId required' }, { status: 400 });
    }

    const userData = await getUserWithDetails({ email, providerId });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ✅ Ensure consistent response shape
    const payload = {
      ...userData,
      posts: userData.posts || [],
      comments: userData.comments || [],
      followed_posts: userData.followed_posts || [],
      followers: userData.followers || [],
    };

    console.log('📦 Sending user dashboard payload:', payload);
    return NextResponse.json(payload);
  } catch (err) {
    console.error('❌ Failed to load user data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
