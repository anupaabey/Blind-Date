import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !service) throw Error('Configure an isolated test Supabase project first.');
if (
  !['127.0.0.1', 'localhost'].includes(new URL(url).hostname) &&
  process.env.ALLOW_REMOTE_DB_TESTS !== 'yes'
)
  throw Error(
    'Tests create and remove fixtures. Use local services or explicitly authorize an isolated remote test project.',
  );
const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
  anon = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const password = randomUUID() + '!Password';
const ids = [];
const venueIds = [];
const paymentIds = [];
const success = async (p) => {
  const r = await p;
  assert.equal(r.error, null, r.error?.message);
  return r.data;
};
const denied = async (p) => {
  const r = await p;
  assert.ok(r.error, 'Expected rejection');
};
const metadata = (overrides = {}) => ({
  first_name: 'Fictional',
  phone: '+94771234567',
  dob: '1995-01-01',
  gender: 'Woman',
  country: 'LK',
  resident: true,
  consent: true,
  district: 'Colombo',
  city: 'Colombo',
  ...overrides,
});
async function person(overrides = {}) {
  const email = `bdc-test-${randomUUID()}@example.com`;
  const { user } = await success(
    db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata(overrides),
    }),
  );
  ids.push(user.id);
  const client = anon();
  await success(client.auth.signInWithPassword({ email, password }));
  return { id: user.id, email, client };
}
const payload = (overrides = {}) => ({
  display_name: 'Fictional tester',
  occupation: 'Test fixture',
  introduction: 'Fictional test data, not a real member.',
  genders: ['Man'],
  age_min: 18,
  age_max: 45,
  goal: 'Long-term relationship',
  districts: ['Colombo'],
  travel: true,
  nearby: false,
  max_km: 30,
  smoking: 'Never',
  drinking: 'Never',
  no_smoking: false,
  no_drinking: false,
  interests: ['Coffee', 'Books'],
  experience: 'Coffee',
  share_age: true,
  share_district: true,
  share_interests: true,
  share_score: true,
  answers: Array(24).fill(4),
  ...overrides,
});
let admin, a, b, c, rid, inv, bid;
async function cleanup() {
  for (const id of paymentIds) await db.from('payments').delete().eq('id', id);
  await db.from('admin_activity_logs').delete().in('admin_id', ids);
  await db.from('safety_reports').delete().in('user_id', ids);
  for (const id of ids) await success(db.auth.admin.deleteUser(id));
  for (const id of venueIds) await db.from('partner_venues').delete().eq('id', id);
}
try {
  await test('Direct Auth requests reject foreign locations, minors and false declarations', async () => {
    for (const meta of [
      metadata({ country: 'US' }),
      metadata({ city: 'London' }),
      metadata({ dob: '2020-01-01' }),
      metadata({ resident: false }),
      metadata({ consent: false }),
      metadata({ phone: '+447712345678' }),
    ]) {
      const r = await db.auth.admin.createUser({
        email: `invalid-${randomUUID()}@example.com`,
        password,
        email_confirm: true,
        user_metadata: meta,
      });
      assert.ok(r.error);
      if (r.data?.user) ids.push(r.data.user.id);
    }
  });
  await test('Create eligible fixtures and restricted admin role', async () => {
    admin = await person();
    a = await person();
    b = await person({ gender: 'Man' });
    c = await person({ district: 'Galle', city: 'Galle' });
    await success(db.from('user_roles').insert({ user_id: admin.id, role: 'admin' }));
    assert.equal(await success(admin.client.rpc('is_admin')), true);
    assert.equal(await success(a.client.rpc('is_admin')), false);
    await denied(a.client.from('user_roles').insert({ user_id: a.id, role: 'admin' }));
    assert.equal(
      (await success(c.client.from('profiles').select('status').eq('id', c.id)))[0].status,
      'waitlist',
    );
  });
  await test('RLS isolates profiles, answers, role changes and private media', async () => {
    assert.deepEqual(await success(a.client.from('profiles').select('*').eq('id', b.id)), []);
    await denied(a.client.from('profiles').update({ status: 'eligible' }).eq('id', a.id));
    await denied(a.client.rpc('generate_recommendations'));
    await success(a.client.rpc('save_questionnaire', { payload: payload() }));
    await success(b.client.rpc('save_questionnaire', { payload: payload({ genders: ['Woman'] }) }));
    assert.deepEqual(
      await success(a.client.from('questionnaire_answers').select('*').eq('user_id', b.id)),
      [],
    );
    const file = await a.client.storage
      .from('private-media')
      .upload(`${b.id}/forbidden.txt`, new Blob(['private'], { type: 'text/plain' }));
    assert.ok(file.error);
    assert.deepEqual(await success(a.client.rpc('my_invitations')), []);
  });
  await test('Residency approval and completed questionnaires gate suggestions', async () => {
    await success(admin.client.rpc('generate_recommendations'));
    assert.equal(
      (await success(admin.client.from('matching_recommendations').select('*'))).filter((r) =>
        [r.user_a, r.user_b].includes(a.id),
      ).length,
      0,
    );
    for (const p of [a, b])
      await success(
        admin.client.rpc('admin_action', {
          operation: 'verify',
          target: p.id,
          note: 'Fictional local test residency review; no documents collected.',
        }),
      );
    await success(admin.client.rpc('generate_recommendations'));
    const recs = await success(admin.client.from('matching_recommendations').select('*'));
    const r = recs.find(
      (r) => [r.user_a, r.user_b].includes(a.id) && [r.user_a, r.user_b].includes(b.id),
    );
    assert.ok(r);
    rid = r.id;
    assert.equal(r.score, 100);
    assert.equal(Number(r.breakdown.values), 35);
  });
  await test('Mutual preferences, distance and dealbreakers exclude ineligible recommendations', async () => {
    await success(b.client.rpc('save_questionnaire', { payload: payload({ genders: ['Man'] }) }));
    await denied(admin.client.rpc('review_recommendation', { recommendation: rid, approve: true }));
    await success(
      b.client.rpc('save_questionnaire', {
        payload: payload({ genders: ['Woman'], smoking: 'Regularly' }),
      }),
    );
    await success(a.client.rpc('save_questionnaire', { payload: payload({ no_smoking: true }) }));
    await denied(admin.client.rpc('review_recommendation', { recommendation: rid, approve: true }));
    await success(b.client.rpc('save_questionnaire', { payload: payload({ genders: ['Woman'] }) }));
    await success(a.client.rpc('save_questionnaire', { payload: payload() }));
  });
  await test('Only admin can invite, and anonymous highlights honor consent', async () => {
    await denied(a.client.rpc('review_recommendation', { recommendation: rid, approve: true }));
    await success(
      admin.client.rpc('review_recommendation', { recommendation: rid, approve: true }),
    );
    const invites = await success(a.client.rpc('my_invitations'));
    assert.equal(invites.length, 1);
    inv = invites[0].id;
    const serialized = JSON.stringify(invites);
    assert.ok(!serialized.includes(b.email));
    assert.ok(!serialized.includes(b.id));
    assert.ok(!serialized.includes('+9477'));
    await success(
      b.client.rpc('save_questionnaire', {
        payload: payload({
          genders: ['Woman'],
          share_age: false,
          share_district: false,
          share_interests: false,
          share_score: false,
        }),
      }),
    );
    const [i] = await success(a.client.rpc('my_invitations'));
    assert.equal(i.score, null);
    assert.equal(i.age_range, null);
    assert.equal(i.district, null);
    assert.deepEqual(i.interests, []);
  });
  await test('Booking requires two independent yes decisions and a vetted Sri Lankan venue', async () => {
    const v = await success(
      db
        .from('partner_venues')
        .insert({
          name: 'FICTIONAL test café',
          district: 'Colombo',
          city: 'Colombo',
          address: 'Fictional public test venue',
          contact: 'test fixture',
          active: true,
          vetted: true,
        })
        .select('id')
        .single(),
    );
    venueIds.push(v.id);
    const date = new Date(Date.now() + 3 * 86400000);
    date.setUTCHours(12, 0, 0, 0);
    const args = {
      invitation: inv,
      venue: v.id,
      package: 'standard',
      date_time: date.toISOString(),
    };
    await denied(a.client.rpc('request_booking', args));
    await success(a.client.rpc('decide_invitation', { invitation: inv, accept: true }));
    await denied(a.client.rpc('request_booking', args));
    await denied(c.client.rpc('decide_invitation', { invitation: inv, accept: true }));
    await success(b.client.rpc('decide_invitation', { invitation: inv, accept: true }));
    bid = await success(a.client.rpc('request_booking', args));
    await denied(
      db.from('partner_venues').insert({
        name: 'Foreign venue',
        country: 'GB',
        district: 'London',
        city: 'London',
        address: 'London',
        contact: 'none',
      }),
    );
    await denied(a.client.rpc('request_booking', { ...args, venue: randomUUID() }));
  });
  await test('Only admin confirms venues; payments require server verification and exact LKR amounts', async () => {
    await denied(
      a.client.rpc('admin_action', {
        operation: 'confirm_booking',
        target: bid,
        note: 'Fake confirmation',
      }),
    );
    await success(
      admin.client.rpc('admin_action', {
        operation: 'confirm_booking',
        target: bid,
        note: 'Fictional test reservation reference TEST-ONLY',
      }),
    );
    const p = await success(
      a.client.rpc('create_checkout', { booking: bid, payment_mode: 'sandbox' }),
    );
    paymentIds.push(p.order_id);
    assert.equal(Number(p.amount), 2500);
    await denied(
      a.client.rpc('record_payment', {
        order_id: p.order_id,
        provider: 'fake',
        amount: 2500,
        currency_code: 'LKR',
        successful: true,
      }),
    );
    await denied(
      db.rpc('record_payment', {
        order_id: p.order_id,
        provider: 'fake',
        amount: 1,
        currency_code: 'LKR',
        successful: true,
      }),
    );
    await denied(
      db.rpc('record_payment', {
        order_id: p.order_id,
        provider: 'fake',
        amount: 2500,
        currency_code: 'USD',
        successful: true,
      }),
    );
    const confirm = {
      order_id: p.order_id,
      provider: 'FICTIONAL-TEST-' + randomUUID(),
      amount: 2500,
      currency_code: 'LKR',
      successful: true,
    };
    await success(db.rpc('record_payment', confirm));
    await success(db.rpc('record_payment', confirm));
    assert.equal(
      (await success(a.client.from('payments').select('status').eq('id', p.order_id)))[0].status,
      'paid',
    );
    assert.deepEqual(await success(b.client.from('payments').select('*').eq('id', p.order_id)), []);
  });
  await test('Feedback waits for a completed date; contact exchange needs both independent consents', async () => {
    const feedback = {
      enjoyed: true,
      comfortable: true,
      safe: true,
      another: true,
      recommend: true,
      exchange_consent: true,
      note: 'Fictional test.',
    };
    await denied(a.client.rpc('submit_feedback', { booking: bid, payload: feedback }));
    if (['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
      execFileSync(
        'docker',
        [
          'exec',
          'bdc-db',
          'psql',
          '-U',
          'postgres',
          '-v',
          'ON_ERROR_STOP=1',
          '-c',
          `update public.date_bookings set date_at=now()-interval '1 day' where id='${bid}';`,
        ],
        { stdio: 'pipe' },
      );
    await success(admin.client.rpc('admin_action', { operation: 'complete_booking', target: bid }));
    await success(a.client.rpc('submit_feedback', { booking: bid, payload: feedback }));
    assert.deepEqual(await success(a.client.rpc('my_connections')), []);
    const b2 = await success(
      db
        .from('date_bookings')
        .insert({
          invitation_id: inv,
          user_id: b.id,
          venue_id: venueIds[0],
          package_id: 'standard',
          date_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
        })
        .select('id')
        .single(),
    );
    await success(
      b.client.rpc('submit_feedback', {
        booking: b2.id,
        payload: { ...feedback, exchange_consent: false },
      }),
    );
    assert.deepEqual(await success(a.client.rpc('my_connections')), []);
    assert.deepEqual(
      await success(a.client.from('date_feedback').select('*').eq('user_id', b.id)),
      [],
    );
    await success(
      db.from('date_feedback').update({ exchange_consent: true }).eq('booking_id', b2.id),
    );
    const contacts = await success(a.client.rpc('my_connections'));
    assert.equal(contacts[0].email, b.email);
  });
  await test('Reporting, blocking and suspension close invitations and exclude future matching', async () => {
    await success(
      a.client.rpc('report_match', {
        invitation: inv,
        reason: 'Fictional test safety report',
        block: true,
      }),
    );
    assert.deepEqual(await success(a.client.rpc('my_invitations')), []);
    assert.deepEqual(await success(a.client.rpc('my_connections')), []);
    await denied(admin.client.rpc('manual_pair', { a: a.id, b: b.id }));
    await success(admin.client.rpc('admin_action', { operation: 'suspend', target: b.id }));
    assert.equal(
      (await success(admin.client.from('profiles').select('status').eq('id', b.id)))[0].status,
      'suspended',
    );
    const reports = await success(
      admin.client.from('safety_reports').select('*').eq('user_id', a.id),
    );
    assert.equal(reports.length, 1);
    assert.deepEqual(
      await success(b.client.from('safety_reports').select('*').eq('user_id', a.id)),
      [],
    );
  });

  await test('Private Storage allows an owner image but forbids cross-member signed downloads', async () => {
    const path = `${a.id}/${randomUUID()}.png`;
    const bytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/1XkAAAAASUVORK5CYII=',
      'base64',
    );
    await success(
      a.client.storage.from('private-media').upload(path, bytes, { contentType: 'image/png' }),
    );
    const signed = await success(a.client.storage.from('private-media').createSignedUrl(path, 60));
    const response = await fetch(signed.signedUrl);
    assert.equal(response.status, 200);
    assert.equal((await response.arrayBuffer()).byteLength, bytes.byteLength);
    await denied(b.client.storage.from('private-media').createSignedUrl(path, 60));
    await success(a.client.storage.from('private-media').remove([path]));
  });
  await test('Expired invitations, location changes and matching opt-out cannot bypass review', async () => {
    const d = await person(),
      e = await person({ gender: 'Man' });
    await success(d.client.rpc('save_questionnaire', { payload: payload() }));
    await success(e.client.rpc('save_questionnaire', { payload: payload({ genders: ['Woman'] }) }));
    for (const p of [d, e])
      await success(
        admin.client.rpc('admin_action', {
          operation: 'verify',
          target: p.id,
          note: 'Fictional test residency review for expiration and consent.',
        }),
      );
    const r = await success(admin.client.rpc('manual_pair', { a: d.id, b: e.id }));
    await success(
      admin.client.rpc('review_recommendation', { recommendation: r, approve: true, hours: 1 }),
    );
    const [i] = await success(d.client.rpc('my_invitations'));
    await success(
      db
        .from('match_invitations')
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq('id', i.id),
    );
    await denied(d.client.rpc('decide_invitation', { invitation: i.id, accept: true }));
    await denied(
      d.client.rpc('update_residence', { district_name: 'London', city_name: 'London' }),
    );
    await success(d.client.rpc('update_residence', { district_name: 'Galle', city_name: 'Galle' }));
    assert.equal(
      (await success(d.client.from('profiles').select('status').eq('id', d.id)))[0].status,
      'waitlist',
    );
    await success(e.client.rpc('pause_matching'));
    await success(
      admin.client.rpc('admin_action', {
        operation: 'verify',
        target: e.id,
        note: 'Fictional eligibility review must not override member pause.',
      }),
    );
    assert.equal(
      (await success(e.client.from('profiles').select('matching_enabled').eq('id', e.id)))[0]
        .matching_enabled,
      false,
    );
    await denied(e.client.rpc('resume_matching', { declaration: false }));
    await success(e.client.rpc('resume_matching', { declaration: true }));
    const [state] = await success(
      e.client.from('profiles').select('status,matching_enabled').eq('id', e.id),
    );
    assert.equal(state.matching_enabled, true);
    assert.equal(state.status, 'pending');
  });
} finally {
  await cleanup();
}
