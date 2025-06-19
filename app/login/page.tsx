'use client';

import { signIn } from 'next-auth/react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ActionButton from '@/app/components/global/ActionButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
      }
    });
  };

  return (
    <main>
      <h1>Login</h1>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <ActionButton type="submit" loading={isPending}>Login</ActionButton>
      </form>
      <div>
<h3>OR</h3>
</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
      <ActionButton onClick={() => signIn('google', { callbackUrl: '/' })}>
  Continue with Google
</ActionButton>

<ActionButton onClick={() => signIn('facebook', { callbackUrl: '/' })}>
  Continue with Facebook
</ActionButton>

      </div>
    </main>
  );
}
