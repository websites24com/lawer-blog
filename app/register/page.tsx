'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/ActionButton';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const first_name = form.get('first_name') as string;
    const last_name = form.get('last_name') as string;
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    setError('');

    startTransition(async () => {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ first_name, last_name, email, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const login = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (login?.error) {
          toast.error('Account created, but login failed.');
          setError('Login failed');
          return;
        }

        toast.success('Account created successfully!');
        router.push('/user');
      } else {
        const data = await res.json();
        const message = data.error || 'Registration failed';
        toast.error(message);
        setError(message);
      }
    });
  }

  return (
    <main>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <h1>Register</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <input type="text" name="first_name" placeholder="First name" required />
        <input type="text" name="last_name" placeholder="Last name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />

        <ActionButton type="submit" loading={isPending}>
          Create Account
        </ActionButton>
      </form>
<div>
<h3>OR</h3>
</div>
     

      <hr style={{ margin: '2rem 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <ActionButton onClick={() => signIn('google', { callbackUrl: '/user' })}>
          Continue with Google
        </ActionButton>

        <ActionButton onClick={() => signIn('facebook', { callbackUrl: '/user' })}>
          Continue with Facebook
        </ActionButton>
      </div>
    </main>
  );
}
