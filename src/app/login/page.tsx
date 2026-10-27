import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/components/forms';
import { configured } from '@/lib/supabase/server';
export const metadata = { title: 'Welcome back' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <AuthShell title={'Your story is\nstill unfolding.'}>
      <h2>Lovely to see you again.</h2>
      <p>Your next possibility might be waiting.</p>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <LoginForm enabled={configured()} />
    </AuthShell>
  );
}
