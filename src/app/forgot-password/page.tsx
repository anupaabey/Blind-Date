import { AuthShell } from '@/components/auth-shell';
import { RecoveryForm } from '@/components/forms';
export default function Page() {
  return (
    <AuthShell>
      <h2>Let’s get you back in.</h2>
      <p>We’ll email a secure link to reset your password.</p>
      <RecoveryForm />
    </AuthShell>
  );
}
