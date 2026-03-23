import { redirect } from 'next/navigation';
import HomeShell from '@/components/HomeShell';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <HomeShell userEmail={user.email ?? 'Authenticated User'} />;
}
