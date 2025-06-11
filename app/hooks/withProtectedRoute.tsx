'use client';

// For protecting fronted components

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from '@/app/components/Spinner'; // ✅ Your spinner

type Props = {
  allowedRoles: string[];
  redirectTo?: string;
  children: React.ReactNode;
};

export default function WithProtectedRoute({ allowedRoles, redirectTo = '/login', children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    const userRole = session?.user?.role;

    const isUnauthorized =
      status === 'unauthenticated' ||
      !userRole ||
      !allowedRoles.includes(userRole);

    if (isUnauthorized) {
      router.push(redirectTo);
    }
  }, [session, status, allowedRoles, redirectTo, router]);

  if (status === 'loading') {
    return <Spinner />; // ✅ Show loading spinner while checking session
  }

  return <>{children}</>; // ✅ Render protected content if authorized
}
