import type { NextAuthOptions } from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/app/lib/db';

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [credentials?.email]);
        const user = rows[0];
        return user || null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar_url = user.avatar_url;
        token.provider = account?.provider || user.provider || null;
        token.provider_account_id = account?.providerAccountId || user.provider_account_id || null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as number;
        session.user.role = token.role as any;
        session.user.avatar_url = token.avatar_url as string | null;
        session.user.provider = token.provider as string | null;
        session.user.provider_account_id = token.provider_account_id as string | null;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};
