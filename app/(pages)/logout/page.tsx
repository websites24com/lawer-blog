'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Wait 2.5 seconds before signing out
    const timeout = setTimeout(() => {
      signOut({ callbackUrl: '/' });
    }, 2500);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h1>Thank you for visiting us!</h1>
      <p>See you soon...</p>
    </div>
  );
}
