import { Suspense } from 'react';
import NotificationCenterPage from '@/components/pages/NotificationCenterPage';

export default function NotificationCenter() {
  return (
    <Suspense fallback={<div className="p-6">加载中...</div>}>
      <NotificationCenterPage />
    </Suspense>
  );
}