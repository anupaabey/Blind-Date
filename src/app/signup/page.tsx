import { AuthShell } from '@/components/auth-shell';
import { SignupForm } from '@/components/forms';
import { configured } from '@/lib/supabase/server';
export const metadata = { title: 'Join the club' };
export default function Page() {
  return (
    <AuthShell>
      <h2>Your next chapter starts here.</h2>
      <p>A few details about you. A world of possibility, right here at home.</p>
      <SignupForm enabled={configured()} />
    </AuthShell>
  );
}
