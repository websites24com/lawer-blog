
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/lib/authConfig';

export async function auth() {
  return await getServerSession(authConfig);
}
