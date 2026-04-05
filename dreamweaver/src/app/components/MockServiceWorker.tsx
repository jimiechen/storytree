'use client';

import { useEffect, useState } from 'react';

export default function MockServiceWorker({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== 'development');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
          if (typeof window !== 'undefined') {
            (window as any).__MSW_READY__ = true;
          }
          setReady(true);
        });
      });
    }
  }, []);

  if (!ready) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
