import '@/app/styles/main.scss';
import { Providers } from './providers';
import { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import Header from '@/app/components/Header'; // 👈 import your header

export const metadata: Metadata = {
  title: {
    default: 'BikeApp',
    template: '%s | BikeApp',
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
            <Header /> {/* ✅ your theme toggle is here */}
            <main>{children}</main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
