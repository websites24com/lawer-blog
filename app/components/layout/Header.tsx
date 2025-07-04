'use client';

import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import Head from 'next/head';
import ThemeToggle from './ThemeToggle';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

export default function Header() {
  const router = useRouter();
  const { userData, status, loading } = useCurrentUser();

  const handleUserClick = () => {
    if (loading) return;

    if (status === 'authenticated' && userData) {
      router.push('/user');
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
