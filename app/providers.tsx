'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // ✅ Fix Facebook #_=_ redirect bug
  useEffect(() => {
    if (window.location.hash === '#_=_') {
      history.replaceState(null, '', window.location.href.split('#')[0]);
    }
  }, []);
  
  return <SessionProvider>{children}</SessionProvider>;
}
