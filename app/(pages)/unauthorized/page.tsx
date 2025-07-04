'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown interval
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Redirect timeout
    const timeout = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🚫 Access Denied</h1>
      <p>You are not authorized to view this page.</p>
      <p>Redirecting to <Link href="/">Home</Link> in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
    </div>
  );
}
