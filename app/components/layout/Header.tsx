'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';
import Head from 'next/head';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleUserClick = async () => {
    if (status === 'loading') return;

    const user = session?.user;

    const hasValidId = typeof user?.id === 'number' || typeof user?.id === 'string';
    const hasEmailOrProvider = typeof user?.email === 'string' || hasValidId;

    if (status === 'authenticated' && hasValidId && hasEmailOrProvider) {
      try {
        // ⛔ Validate user truly exists in DB (important for OAuth edge cases)
        const res = await fetch(`/api/user?email=${encodeURIComponent(user?.email || '')}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        if (!data || !data.id) throw new Error('User data invalid');
        router.push('/user');
      } catch (err) {
        router.push('/auth'); // 🔁 fallback if DB lookup fails
      }
    } else {
      router.push('/auth');
    }
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "BikeApp Blog",
              "url": "https://yourdomain.com/blog",
              "description": "A blog about bicycles, reviews, and riding tips.",
              "publisher": {
                "@type": "Organization",
                "name": "BikeApp",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://yourdomain.com/logo.png"
                }
              }
            }),
          }}
        />
      </Head>

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
    </>
  );
}
