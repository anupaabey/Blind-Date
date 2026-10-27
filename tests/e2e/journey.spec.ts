import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, service, { auth: { persistSession: false } });
const ids: string[] = [];
const venueIds: string[] = [];
const password = randomUUID() + 'Test!';
async function ok<T extends { data: unknown; error: unknown }>(
  r: PromiseLike<T>,
): Promise<NonNullable<T['data']>> {
  const result = await r;
  expect(result.error).toBeNull();
  return result.data as NonNullable<T['data']>;
}
async function person(gender = 'Woman') {
  const email = `e2e-${randomUUID()}@example.com`;
  const { user } = await ok(
    db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Fictional',
        phone: '+94771234567',
        dob: '1997-01-01',
        gender,
        country: 'LK',
        resident: true,
        consent: true,
        district: 'Colombo',
        city: 'Colombo',
      },
    }),
  );
  ids.push(user!.id);
  return { id: user!.id, email };
}
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Welcome back' }).click();
  await expect(page).toHaveURL(/dashboard/);
}
async function questionnaire(page: Page, gender: string) {
  await page.goto('/onboarding');
  await page.getByRole('checkbox', { name: 'Coffee', exact: true }).check();
  await page.getByRole('button', { name: 'Next chapter' }).click();
  await page.getByText(gender, { exact: true }).click();
  await page.getByRole('button', { name: 'Next chapter' }).click();
  for (let i = 0; i < 24; i++)
    await page.getByRole('radio', { name: `4 of 5 for question ${i + 1}`, exact: true }).check();
  await page.getByRole('button', { name: 'Next chapter' }).click();
  await page.getByLabel('My broad age range').check();
  await page.getByLabel('My district (never').check();
  await page.getByLabel('Only interests we have').check();
  await page.getByLabel('Our questionnaire similarity').check();
  await page.getByRole('button', { name: 'Save my profile' }).click();
  await expect(page.locator('.notice[role=status]').filter({ hasText: 'saved' })).toBeVisible();
}
test.afterAll(async () => {
  for (const id of ids) {
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) throw Error(error.message);
  }
  for (const id of venueIds) await db.from('partner_venues').delete().eq('id', id);
});
test('Public pages, theme, mobile navigation and Sri Lankan location selectors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('love story');
  await expect(page.getByRole('link', { name: 'Find my mystery match' }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Use light theme' }).click();
  for (const path of [
    '/how-it-works',
    '/about',
    '/pricing',
    '/faq',
    '/safety',
    '/contact',
    '/privacy',
    '/terms',
    '/refunds',
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'The experience' })
    .click();
  await expect(page).toHaveURL(/how-it-works/);
  await page.goto('/');
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto('/signup');
  await page.getByLabel('Province').selectOption('Southern');
  await page.getByLabel('District').selectOption('Matara');
  await expect(page.getByLabel('City or town')).toHaveValue('Matara');
  await expect(page.getByText('Sri Lanka-only waitlist', { exact: false }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
test('Registration validates adults and verifies actual email before sign-in', async ({ page }) => {
  const email = `e2e-${randomUUID()}@example.com`;
  await page.goto('/signup');
  await page.getByLabel('First name', { exact: true }).fill('Fictional');
  await page.getByLabel('Date of birth').fill('2020-01-01');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Create a password').fill(password);
  await page.getByLabel('Sri Lankan mobile number', { exact: true }).fill('0771234567');
  await page.getByLabel('Gender identity').selectOption('Woman');
  await page.getByLabel('I am 18+').check();
  await page.getByLabel('I agree to the').check();
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.locator('.notice.error')).toContainText('18 or older');
  await page.getByLabel('Date of birth').fill('1997-01-01');
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.locator('.notice[role=status]')).toContainText('Check your email');
  const list = await ok(db.auth.admin.listUsers());
  const user = list.users.find((u) => u.email === email);
  expect(user).toBeDefined();
  ids.push(user!.id);
  const unverified = createClient(url, key, { auth: { persistSession: false } });
  expect((await unverified.auth.signInWithPassword({ email, password })).error).not.toBeNull();
  const { properties } = await ok(db.auth.admin.generateLink({ type: 'signup', email, password }));
  await page.goto(`/auth/callback?token_hash=${properties!.hashed_token}&type=signup`);
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: /Hello/ })).toBeVisible();
});
test('Complete questionnaire → admin review → mutual acceptance → booking → private feedback', async ({
  browser,
}) => {
  const a = await person(),
    b = await person('Man'),
    admin = await person();
  await ok(db.from('user_roles').insert({ user_id: admin.id, role: 'admin' }));
  const ctxA = await browser.newContext(),
    ctxB = await browser.newContext(),
    ctxAdmin = await browser.newContext();
  const pa = await ctxA.newPage(),
    pb = await ctxB.newPage(),
    pm = await ctxAdmin.newPage();
  await login(pa, a.email);
  await questionnaire(pa, 'Man');
  await login(pb, b.email);
  await questionnaire(pb, 'Woman');
  await pa.goto('/admin');
  await expect(pa).toHaveURL(/dashboard/);
  await login(pm, admin.email);
  await pm.goto('/admin');
  for (const p of [a, b]) {
    const row = pm.getByRole('row').filter({ hasText: p.id });
    await row
      .getByRole('textbox', { name: 'Residency review method' })
      .fill('Fictional e2e residency review, no documents retained.');
    await row.getByRole('button', { name: 'Approve eligibility' }).click();
    await expect(pm.locator('.notice[role=status]')).toContainText('saved');
  }
  await pm.getByRole('button', { name: 'Find compatible pairs' }).click();
  let recommendationId = '';
  await expect
    .poll(async () => {
      const { data } = await db
        .from('matching_recommendations')
        .select('id')
        .in('user_a', [a.id, b.id])
        .in('user_b', [a.id, b.id])
        .maybeSingle();
      recommendationId = data?.id ?? '';
      return recommendationId;
    })
    .not.toBe('');
  await pm
    .getByTestId('recommendation-' + recommendationId)
    .getByRole('button', { name: 'Approve & invite both' })
    .click();
  await pa.goto('/dashboard');
  await expect(pa.getByText('Questionnaire similarity · 100%')).toBeVisible();
  await pa.getByRole('button', { name: 'Accept my mystery date' }).click();
  await expect(pa.getByText('You’ve accepted.')).toBeVisible();
  await expect(pa.getByRole('link', { name: 'Plan our first date' })).toHaveCount(0);
  await pb.goto('/dashboard');
  await pb.getByRole('button', { name: 'Accept my mystery date' }).click();
  await pa.reload();
  await expect(pa.getByRole('link', { name: 'Plan our first date' })).toBeVisible();
  const v = await ok(
    db
      .from('partner_venues')
      .insert({
        name: 'Fictional E2E café',
        district: 'Colombo',
        city: 'Colombo',
        address: 'Test-only fictional public venue',
        contact: 'No real reservation contact',
        vetted: true,
        active: true,
      })
      .select('id')
      .single(),
  );
  venueIds.push(v.id);
  await pa.getByRole('link', { name: 'Plan our first date' }).click();
  await pa.getByLabel('Available venue').selectOption(v.id);
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  await pa.getByLabel('Preferred date', { exact: true }).fill(date);
  await pa.getByLabel('Preferred time').fill('17:30');
  await pa.getByLabel('I understand the package').check();
  await pa.getByRole('button', { name: 'Request my date' }).click();
  await expect(pa).toHaveURL(/dashboard/);
  await expect(pa.getByText('Venue confirmation pending', { exact: true })).toBeVisible();
  await pa.getByRole('link', { name: 'Payment & receipt' }).click();
  await expect(pa.getByText('PAYMENTS UNAVAILABLE', { exact: false })).toBeVisible();
  await expect(pa.getByRole('button', { name: 'Awaiting merchant setup' })).toBeDisabled();
  const [booking] = await ok(db.from('date_bookings').select('*').eq('user_id', a.id));
  await pm.goto('/admin');
  const row = pm.getByRole('row').filter({ hasText: 'Fictional E2E café' });
  await row
    .getByRole('textbox', { name: 'Confirmation or reference' })
    .fill('FICTIONAL-E2E-RESERVATION');
  await row.getByRole('button', { name: 'Confirm reservation' }).click();
  execFileSync(
    'docker',
    [
      'exec',
      'bdc-db',
      'psql',
      '-U',
      'postgres',
      '-c',
      `update public.date_bookings set date_at=now()-interval '1 day' where id='${booking.id}';`,
    ],
    { stdio: 'pipe' },
  );
  await pm.reload();
  await pm
    .getByRole('row')
    .filter({ hasText: 'Fictional E2E café' })
    .getByRole('button', { name: 'Mark completed' })
    .click();
  await pa.goto('/dashboard');
  await pa.getByLabel('I enjoyed the date').check();
  await pa.getByLabel('The venue was comfortable').check();
  await pa.getByLabel('I felt safe').check();
  await pa.getByLabel('I would like another date').check();
  await pa.getByRole('button', { name: 'Save private feedback' }).click();
  await expect(pa.locator('.notice[role=status]')).toContainText('saved');
  await expect(pa.getByText(b.email, { exact: true })).toHaveCount(0);
  await pa.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
  await pm.screenshot({ path: 'test-results/admin.png', fullPage: true });
  await ctxA.close();
  await ctxB.close();
  await ctxAdmin.close();
});

test('Account deletion requires the current password and removes the private account', async ({
  page,
}) => {
  const member = await person();
  await login(page, member.email);
  await page.getByText('Delete my account permanently', { exact: true }).click();
  await page.getByLabel('Current password', { exact: true }).fill(password);
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await page.getByRole('button', { name: 'Delete my account', exact: true }).click();
  await expect(page).toHaveURL(/deleted=1/);
  const { data, error } = await db.from('profiles').select('id').eq('id', member.id);
  expect(error).toBeNull();
  expect(data).toEqual([]);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
  ids.splice(ids.indexOf(member.id), 1);
});
