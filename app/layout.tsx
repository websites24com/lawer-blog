// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lawyer Blog',
  description: 'Informative blog about legal topics and property law.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <a href="/">Home</a> | <a href="/blog">Blog</a>
          </nav>
        </header>

        {children}

        <footer>
          <p>© 2025 Lawyer Blog</p>
        </footer>
      </body>
    </html>
  );