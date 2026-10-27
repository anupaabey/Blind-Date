import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
  throw Error(
    'Demo seeding is restricted to local services. Never seed fictional profiles into production.',
  );
if (existsSync('.local/demo-accounts.json')) {
  console.log('Demo accounts already exist. Existing credentials were preserved.');
  process.exit(0);
}
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const password = randomBytes(24).toString('base64url');
const accounts = [];
const check = async (p) => {
  const r = await p;
  if (r.error) throw Error(r.error.message);
  return r.data;
};
for (const [i, [first_name, gender, city, district]] of [
  ['DEMO Tharushi', 'Woman', 'Colombo', 'Colombo'],
  ['DEMO Kavindu', 'Man', 'Colombo', 'Colombo'],
  ['DEMO Anjali', 'Woman', 'Maharagama', 'Colombo'],
  ['DEMO Dilan', 'Man', 'Maharagama', 'Colombo'],
  ['DEMO Nethmi', 'Woman', 'Kandy', 'Kandy'],
  ['DEMO Club host', 'Non-binary', 'Colombo', 'Colombo'],
].entries()) {
  const email = `demo-${i + 1}@blinddateclub.example`;
  const { user } = await check(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        gender,
        city,
        district,
        phone: '+94770000000',
        dob: `${1994 + i}-04-12`,
        country: 'LK',
        resident: true,
        consent: true,
      },
    }),
  );
  await check(admin.from('profiles').update({ is_demo: true }).eq('id', user.id));
  const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  await check(client.auth.signInWithPassword({ email, password }));
  const payload = {
    display_name: first_name,
    occupation: 'Fictional demo professional',
    introduction: 'Fictional demonstration profile. Not a real member.',
    genders: gender === 'Woman' ? ['Man'] : ['Woman'],
    age_min: 23,
    age_max: 40,
    goal: 'Long-term relationship',
    districts: ['Colombo'],
    travel: true,
    nearby: false,
    max_km: 30,
    smoking: 'Never',
    drinking: 'Occasionally',
    no_smoking: true,
    no_drinking: false,
    interests: i % 2 === 0 ? ['Coffee', 'Books', 'Hiking'] : ['Coffee', 'Books', 'Music'],
    experience: 'Coffee',
    share_age: true,
    share_district: true,
    share_interests: true,
    share_score: true,
    answers: Array.from({ length: 24 }, (_, j) => 3 + ((i + j) % 3)),
  };
  await check(client.rpc('save_questionnaire', { payload }));
  accounts.push({ id: user.id, email, password, role: i === 5 ? 'admin' : 'member' });
}
await check(admin.from('user_roles').insert({ user_id: accounts[5].id, role: 'admin' }));
const reviewer = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
await check(reviewer.auth.signInWithPassword({ email: accounts[5].email, password }));
for (const a of accounts)
  await check(
    reviewer.rpc('admin_action', {
      operation: 'verify',
      target: a.id,
      note: 'Fictional demo residency approval only; not a real verification.',
    }),
  );
await check(
  admin.from('partner_venues').insert([
    {
      name: 'DEMO Cinnamon Courtyard Café',
      district: 'Colombo',
      city: 'Colombo',
      address: 'Fictional public café in Colombo — no real partnership',
      contact: 'Fictional demo venue — do not contact',
      vetted: true,
      active: true,
      is_demo: true,
    },
    {
      name: 'DEMO The Garden Table',
      district: 'Colombo',
      city: 'Maharagama',
      address: 'Fictional public café in Maharagama — no real partnership',
      contact: 'Fictional demo venue — do not contact',
      vetted: true,
      active: true,
      is_demo: true,
    },
  ]),
);
await check(reviewer.rpc('generate_recommendations'));
writeFileSync('.local/demo-accounts.json', JSON.stringify(accounts, null, 2), { mode: 0o600 });
console.log(
  'Created six clearly labeled fictional demo accounts and two demo-only venues. Local login details are in ignored .local/demo-accounts.json.',
);
