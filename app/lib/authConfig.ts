import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

import { db } from '@/app/lib/db';
import slugify from 'slugify';

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // console.log('🟡 [authorize] Credentials login attempt:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [credentials.email]);
        const user = rows[0];
        if (!user || !user.password) {
          console.log('❌ User not found or no password');
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.log('❌ Invalid password');
          return null;
        }

        console.log('✅ Credentials login success:', user);

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          provider: 'credentials',
          provider_account_id: null,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'openid email profile' },
      },
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }) as any,
  ],

  callbacks: {
    async jwt({ token, account, profile, user }) {
      // console.log('🟢 [jwt] Start');
      // console.log('token (in):', token);
      // console.log('account:', account);
      // console.log('profile:', profile);
      // console.log('user:', user);

      if (account?.provider === 'credentials' && user) {
        token.id = user.id;
        token.email = user.email ?? null;
        token.role = user.role ?? 'USER';
        token.avatar_url = user.avatar_url ?? null;
        token.provider = 'credentials';
        token.provider_account_id = null;

        console.log('✅ token (credentials):', token);
        return token;
      }

      if (account && profile) {
        const provider = account.provider;
        const providerAccountId = account.providerAccountId;

        const [rows] = await db.query(
          'SELECT * FROM users WHERE provider = ? AND provider_account_id = ? LIMIT 1',
          [provider, providerAccountId]
        );
        let user = rows[0];

        if (!user) {
          // console.log(`🆕 Creating user for ${provider} (${providerAccountId})`);

          let first_name = 'First';
          let last_name = 'Last';
          if (profile?.name) {
            const parts = profile.name.trim().split(' ');
            first_name = parts[0] || 'First';
            last_name = parts.slice(1).join(' ') || 'Last';
          }

          const email = profile.email || null;

          let avatar_url: string | null = null;
          if (typeof profile.picture === 'string') {
            avatar_url = profile.picture;
          } else if (profile.picture?.data?.url) {
            avatar_url = profile.picture.data.url;
          }

          const baseSlug = slugify(`${first_name} ${last_name}`, { lower: true, strict: true });
          let slug = baseSlug;
          let suffix = 1;
          while (true) {
            const [slugRows] = await db.query('SELECT COUNT(*) as count FROM users WHERE slug = ?', [slug]);
            if ((slugRows as any)[0].count === 0) break;
            slug = `${baseSlug}-${suffix++}`;
          }

          try {
            const [result] = await db.query(
              `INSERT INTO users (
                first_name, last_name, slug, email, password, phone, chat_app,
                avatar_url, avatar_alt, avatar_title,
                role, status, provider, provider_account_id,
                website, about_me
              ) VALUES (?, ?, ?, ?, NULL, NULL, 'None', ?, NULL, NULL, 'USER', 'approved', ?, ?, NULL, NULL)`,
              [
                first_name,
                last_name,
                slug,
                email,
                avatar_url,
                provider,
                providerAccountId,
              ]
            );

            const [newRows] = await db.query('SELECT * FROM users WHERE id = ?', [
              (result as any).insertId,
            ]);
            user = newRows[0];
            // console.log('✅ Inserted user:', user);
          } catch (err) {
            console.error('❌ DB error inserting user:', err);
          }
        }

        if (user) {
          token.id = user.id;
          token.email = user.email ?? null;
          token.role = user.role;
          token.avatar_url = user.avatar_url ?? null;
          token.provider = user.provider;
          token.provider_account_id = user.provider_account_id;
          // console.log('✅ token (oauth):', token);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // console.log('🔵 [session] building from token:', token);

      if (session.user) {
        session.user.id = token.id ?? 0;
        session.user.email = token.email ?? null;
        session.user.role = token.role ?? 'USER';
        session.user.avatar_url = token.avatar_url ?? null;
        session.user.provider = token.provider ?? null;
        session.user.provider_account_id = token.provider_account_id ?? null;
      }

      // console.log('✅ Final session:', session);
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};
