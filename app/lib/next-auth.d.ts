// lawyer-blog/app/lib/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: number;
    email: string | null;
    name: string | null;
    role: 'USER' | 'MODERATOR' | 'ADMIN';
    avatar_url: string | null;
    provider: string | null;
    provider_account_id: string | null;
  }

  interface Session {
    user: {
      id: number;
      email: string | null;
      name: string | null;
      role: 'USER' | 'MODERATOR' | 'ADMIN';
      avatar_url: string | null;
      provider: string | null;
      provider_account_id: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    role: 'USER' | 'MODERATOR' | 'ADMIN';
    avatar_url: string | null;
    provider: string | null;
    provider_account_id: string | null;
  }
}
