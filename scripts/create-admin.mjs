import { createClient } from '@supabase/supabase-js';
const email = process.argv[2];
if (!email || !email.includes('@'))
  throw Error('Usage: npm run admin:create -- verified-account@example.com');
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
let user;
for (let page = 1; !user; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw Error(error.message);
  user = data.users.find((u) => u.email === email);
  if (data.users.length < 1000) break;
}
if (!user?.email_confirmed_at)
  throw Error('Create and verify this account before granting administrator access.');
const { error } = await db.from('user_roles').upsert({ user_id: user.id, role: 'admin' });
if (error) throw Error(error.message);
const { error: audit } = await db.from('admin_activity_logs').insert({
  admin_id: user.id,
  action: 'bootstrap_admin',
  target_id: user.id,
  detail: 'Granted through the owner-run create-admin script.',
});
if (audit) throw Error(audit.message);
console.log('Administrator access granted and audited. Sign in normally to use /admin.');
