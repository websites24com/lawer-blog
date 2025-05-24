import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { db, bcrypt } from '@/app/lib/db';
import type { UserRecord } from '@/app/lib/definitions';

async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return (rows as UserRecord[])[0];
}

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt:', credentials);
        if (!credentials?.email || !credentials?.password) return null;

        const user = await findUserByEmail(credentials.email);
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: { params: { scope: 'public_profile,email' } },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        const email = user.email ?? null;

        if (account.provider !== 'credentials') {
          const [rows] = await db.query(
            'SELECT * FROM users WHERE provider = ? AND provider_account_id = ? LIMIT 1',
            [account.provider, account.providerAccountId]
          );

          let dbUser = (rows as UserRecord[])[0];

          if (!dbUser && email) {
            const [existingEmailUserRows] = await db.query(
              'SELECT * FROM users WHERE email = ? LIMIT 1',
              [email]
            );
            dbUser = (existingEmailUserRows as UserRecord[])[0];
          }

          if (!dbUser) {
            const nameParts = (user.name || '').split(' ');
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.slice(1).join(' ') || ' ';

            const [result]: any = await db.query(
              `INSERT INTO users (first_name, last_name, email, password, provider, provider_account_id, location)
               VALUES (?, ?, ?, '', ?, ?, ST_PointFromText(?))`,
              [
                firstName,
                lastName,
                email,
                account.provider,
                account.providerAccountId,
                'POINT(0 0)',
              ]
            );

            token.id = result.insertId;
            token.role = 'USER';
          } else {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } else {
          token.id = user.id;
          token.role = user.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as number;
      session.user.role = token.role as string;
      return session;
    },
  },
};
