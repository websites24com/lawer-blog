// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Allow public access to login, register, and NextAuth routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/register') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // If user is not logged in, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Restrict /admin to ADMIN only
  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // Restrict /moderator to MODERATOR or ADMIN
  if (
    pathname.startsWith('/moderator') &&
    token.role !== 'MODERATOR' &&
    token.role !== 'ADMIN'
  ) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

