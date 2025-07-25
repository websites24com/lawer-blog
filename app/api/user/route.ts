// ✅ Route for USER Page

import { NextRequest, NextResponse } from 'next/server';
import { getUserWithDetailsPaginated } from '@/app/lib/users/users';
import { requireApiAuth } from '@/app/lib/auth/requireApiAuth';

export async function GET(req: NextRequest) {
  try {
    // ✅ Require ADMIN or MODERATOR
    await requireApiAuth({ roles: ['USER', 'ADMIN', 'MODERATOR'] });

    // ✅ Parse query parameters
    const { searchParams } = req.nextUrl;
    const email = searchParams.get('email') || undefined;
    const providerId = searchParams.get('providerId') || undefined;

    const commentPage = parseInt(searchParams.get('commentPage') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const offset = (commentPage - 1) * limit;

    // 🚫 Require at least email or providerId
    if (!email && !providerId) {
      return NextResponse.json(
        { error: 'Missing query parameter: email or providerId required' },
        { status: 400 }
      );
    }

    // ✅ Fetch user data
    const userData = await getUserWithDetailsPaginated({ email, providerId, offset, limit });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payload = {
      ...userData,
      posts: userData.posts || [],
      comments: userData.comments || [],
      followed_posts: userData.followed_posts || [],
      followers: userData.followers || [],
  
      totalComments: userData.totalComments || 0,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('❌ GET /api/user/details error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
