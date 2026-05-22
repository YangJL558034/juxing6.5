'use client';

import { ToastProvider } from '@/hooks/use-toast';

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
