'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        first_name: form.get('first_name'),
        last_name: form.get('last_name'),
        email: form.get('email'),
        password: form.get('password'),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      router.push('/login');
    } else {
      const data = await res.json();
      setError(data.error || 'Registration failed');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Register</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="text" name="first_name" placeholder="First name" required />
      <input type="text" name="last_name" placeholder="Last name" required />
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Create Account</button>
    </form>
  );
}
