import { AuthShell } from '@/components/auth-shell';
import { RecoveryForm } from '@/components/forms';
import { requireUser } from '@/lib/auth';
export default async function Page() {
  await requireUser();
  return (
    <AuthShell>
      <h2>A fresh start.</h2>
      <p>Choose a new password of at least 12 characters.</p>
      <RecoveryForm reset />
    </AuthShell>
  );
}
