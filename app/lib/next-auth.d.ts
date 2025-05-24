import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      email: string;
      role: 'USER' | 'MODERATOR' | 'ADMIN';
      name?: string;
    };
  }
}
