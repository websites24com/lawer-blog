'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleUserClick = () => {
    if (status === 'loading') return;

    const user = session?.user;

    // 🧠 Tylko jeśli sesja zawiera ważne ID i e-mail — przekieruj do /user
    if (
      status === 'authenticated' &&
      user &&
      typeof user.id === 'number' &&
      typeof user.email === 'string'
    ) {
      router.push('/user');
    } else {
      
      router.push('/auth');
    }
  };

  return (
    <header className="site-header">
      <div className="logo">BikeApp</div>
      <nav>
        <ThemeToggle />

        <button
          onClick={handleUserClick}
          title="User account"
          type="button"
        >
          <User size={24} />
        </button>
      </nav>
    </header>
  );
}
