import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { verifyToken } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_token');
  
  if (!authCookie?.value) {
    redirect('/login');
  }
  
  const user = await verifyToken(authCookie.value);

  if (!user || !user.id) {
    redirect('/login');
  }

  return <MainLayout user={user} />;
}
