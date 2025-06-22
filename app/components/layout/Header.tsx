'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';
import Head from 'next/head'; // ✅ Add Head for injecting content into <head>
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleUserClick = () => {
    if (status === 'loading') return;

    const user = session?.user;

    // ✅ Accept numeric or string ID and allow login even if email is missing (e.g. Facebook)
    const hasValidId = typeof user?.id === 'number' || typeof user?.id === 'string';
    const hasEmailOrProvider = typeof user?.email === 'string' || hasValidId;

    if (status === 'authenticated' && hasValidId && hasEmailOrProvider) {
      router.push('/user');
    } else {
      router.push('/auth');
    }
  };

  return (
    <>
      {/* ✅ Inject global structured data into <head> using JSON-LD */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "BikeApp Blog",
              "url": "https://yourdomain.com/blog", // ❗ replace with your actual URL
              "description": "A blog about bicycles, reviews, and riding tips.",
              "publisher": {
                "@type": "Organization",
                "name": "BikeApp",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://yourdomain.com/logo.png" // ❗ update logo URL
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
