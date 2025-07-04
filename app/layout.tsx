import '@/app/styles/main.scss';
import { Providers } from './providers';
import { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import Header from '@/app/components/layout/Header';
import ErrorBoundary from './components/errors/ErrorBoundary';



export const metadata: Metadata = {
  title: {
    default: 'Lawyers blog',
    template: '%s | Lawyers blog',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light">
          <Providers>
            <Toaster />
            <Header />
            <ErrorBoundary>
              <main>{children}</main>
            </ErrorBoundary>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
