// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authConfig } from '@/app/lib/auth/authConfig';

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
