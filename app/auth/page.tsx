'use client';

import { useRouter } from 'next/navigation';
import ActionButton from '@/app/components/global/ActionButton';

export default function AuthPage() {
  const router = useRouter();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome</h1>
      <p>Please choose:</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <ActionButton onClick={() => router.push('/login')}>🔐 Login</ActionButton>
        <ActionButton onClick={() => router.push('/register')}>📝 Register</ActionButton>
      </div>
    </div>
  );
}
