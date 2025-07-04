
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/lib/auth/authConfig';

export async function auth() {
  return await getServerSession(authConfig);
}
