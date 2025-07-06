// lawyer-blog/app/lib/next-auth.d.ts
import 'next-auth';
import type { SessionUser } from '@/app/lib/definitions';

declare module 'next-auth' {
  interface User extends SessionUser {
    name: string | null;
  }

  interface Session {
    user: SessionUser & { name: string | null };
  }
}

declare module 'next-auth/jwt' {
  // No need to re-import SessionUser — the import above is in scope
  type JWT = SessionUser;
}
