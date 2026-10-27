import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { rpcAction, packageAction, logout } from '@/app/actions';
import { VenueForm } from '@/components/forms';
import { ageOn, money } from '@/lib/validation';
import { colombo } from '@/lib/time';
import { districts } from '@/lib/locations';
import type {
  Applicant,
  Recommendation,
  Invitation,
  Decision,
  Booking,
  Venue,
  Payment,
  Package,
  Report,
  Audit,
  Contact,
} from '@/lib/admin-types';
export const metadata = { title: 'Club management' };
function Operation({
  operation,
  id,
  label,
  note = false,
}: {
  operation: string;
  id: string;
  label: string;
  note?: boolean;
}) {
  return (
    <form action={rpcAction} className="flex flex-wrap gap-2 items-center">
      <input type="hidden" name="operation" value={'admin:' + operation} />
      <input type="hidden" name="id" value={id} />
      {note && (
        <input
          name="note"
          required
          minLength={operation === 'verify' ? 10 : 5}
          maxLength={500}
          placeholder={
            operation === 'verify' ? 'Residency review method' : 'Confirmation / gateway reference'
          }
          aria-label={
            operation === 'verify' ? 'Residency review method' : 'Confirmation or reference'
          }
        />
      )}
      <button className="button button-outline button-sm">{label}</button>
    </form>
  );
}
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    q?: string;
    district?: string;
    status?: string;
    min?: string;
    max?: string;
  }>;
}) {
  const { db } = await requireAdmin();
  const params = await searchParams;
  const results = await Promise.all([
    db.rpc('admin_applicants'),
    db.from('matching_recommendations').select('*').order('score', { ascending: false }),
    db.from('match_invitations').select('*'),
    db.from('match_decisions').select('*'),
    db
      .from('date_bookings')
      .select('*,partner_venues(name,city),date_packages(name)')
      .order('date_at'),
    db.from('partner_venues').select('*').order('name'),
    db.from('payments').select('*').order('created_at', { ascending: false }),
    db.from('safety_reports').select('*').order('created_at', { ascending: false }),
    db.from('date_packages').select('*').order('price_lkr'),
    db.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
    db.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(30),
  ]);
  const fail = results.find((r) => r.error);
  if (fail?.error) throw Error(fail.error.message);
  const [
    users,
    recommendations,
    invitations,
    decisions,
    bookings,
    venues,
    payments,
    reports,
    packages,
    logs,
    contacts,
  ] = results.map((r) => r.data ?? []) as [
    Applicant[],
    Recommendation[],
    Invitation[],
    Decision[],
    Booking[],
    Venue[],
    Payment[],
    Report[],
    Package[],
    Audit[],
    Contact[],
  ];
  const byId = new Map(users.map((u) => [u.id, u]));
  const name = (id: string) => {
    const u = byId.get(id);
    return u ? u.first_name + (u.is_demo ? ' · DEMO' : '') : 'Deleted member';
  };
  const filtered = users.filter(
    (u) =>
      (!params.q ||
        (u.first_name + ' ' + u.display_name).toLowerCase().includes(params.q.toLowerCase())) &&
      (!params.district || u.district === params.district) &&
      (!params.status || u.status === params.status) &&
      (!params.min || ageOn(u.dob) >= Number(params.min)) &&
      (!params.max || ageOn(u.dob) <= Number(params.max)),
  );
  const currentMonth = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const revenue = payments
    .filter(
      (p) =>
        p.mode === 'live' &&
        p.status === 'paid' &&
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Colombo',
          year: 'numeric',
          month: '2-digit',
        }).format(new Date(p.created_at)) === currentMonth,
    )
    .reduce((s, p) => s + Number(p.amount_lkr), 0);
  return (
    <div className="container dashboard">
      <div className="dashboard-top">
        <div>
          <span className="eyebrow">BEHIND EVERY GOOD CONNECTION</span>
          <h1>
            The club, <em>thoughtfully managed.</em>
          </h1>
          <p>
            Private administrative workspace. All actions are authorized in the database and
            recorded in the audit log.
          </p>
        </div>
        <div className="dashboard-actions">
          <Link href="/dashboard" className="button button-outline button-sm">
            My dashboard
          </Link>
          <form action={logout}>
            <button className="text-link">Log out</button>
          </form>
        </div>
      </div>
      {params.message && (
        <div className="notice" role="status">
          {params.message}
        </div>
      )}
      <nav className="admin-nav" aria-label="Admin sections">
        {[
          'Overview',
          'Applicants',
          'Matches',
          'Bookings',
          'Venues',
          'Finance',
          'Safety',
          'Messages',
          'Audit',
        ].map((s) => (
          <a key={s} href={'#' + s.toLowerCase()}>
            {s}
          </a>
        ))}
      </nav>
      <section id="overview">
        <div className="stat-grid">
          {[
            ['Registered members', users.filter((u) => !u.is_demo).length],
            ['Eligible members', users.filter((u) => u.status === 'eligible' && !u.is_demo).length],
            ['Pending residency review', users.filter((u) => u.status === 'pending').length],
            ['Live revenue · this month', money(revenue)],
            ['Suggested pairs', recommendations.filter((r) => r.status === 'suggested').length],
            ['Mutually accepted', invitations.filter((i) => i.status === 'accepted').length],
            [
              'Upcoming confirmed dates',
              bookings.filter((b) => b.status === 'confirmed' && new Date(b.date_at) > new Date())
                .length,
            ],
            ['Open safety reports', reports.filter((r) => r.status === 'open').length],
          ].map(([l, v]) => (
            <div className="stat-card" key={l}>
              <span>{l}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <details className="panel">
          <summary className="cursor-pointer">
            Registration distribution · Sri Lankan districts
          </summary>
          <div className="chip-grid">
            {districts.map((d) => (
              <span className="badge" key={d}>
                {d} · {users.filter((u) => u.district === d && !u.is_demo).length}
              </span>
            ))}
          </div>
          <p>
            Demo accounts are excluded from member and live revenue totals. Compatibility scores
            compare questionnaires; they are not a scientific prediction of romantic outcomes.
          </p>
        </details>
      </section>
      <section className="panel admin-section" id="applicants">
        <div className="section-title">
          <h2>Applicant review.</h2>
          <span className="badge">{filtered.length} applicants</span>
        </div>
        <form className="admin-filters">
          <input
            name="q"
            placeholder="Search by name"
            defaultValue={params.q}
            aria-label="Search applicants"
          />
          <select
            name="district"
            defaultValue={params.district ?? ''}
            aria-label="Filter by district"
          >
            <option value="">All Sri Lankan districts</option>
            {districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select name="status" defaultValue={params.status ?? ''} aria-label="Filter by status">
            <option value="">All statuses</option>
            {['pending', 'eligible', 'waitlist', 'suspended'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="number"
            name="min"
            min={18}
            max={100}
            placeholder="Min age"
            defaultValue={params.min}
            aria-label="Minimum age"
          />
          <input
            type="number"
            name="max"
            min={18}
            max={100}
            placeholder="Max age"
            defaultValue={params.max}
            aria-label="Maximum age"
          />
          <button className="button button-outline button-sm">Filter</button>
        </form>
        <p className="form-hint">
          Confirm current Sri Lankan residency through a proportionate review. A +94 phone number,
          nationality or an IP address alone is insufficient. Record the method, never identity
          document numbers. Verified email is required before approval.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Location & age</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    {name(u.id)}
                    <p>{u.gender}</p>
                    <p>{u.email}</p>
                    <p>
                      Email {u.email_verified ? 'verified' : 'not verified'} · Phone{' '}
                      {u.phone_verified ? 'verified' : 'not verified'}
                    </p>
                    <p>{u.answer_count}/24 questionnaire answers</p>
                    <p className="tiny">{u.id}</p>
                  </td>
                  <td>
                    {u.city}, {u.district}
                    <p>{ageOn(u.dob)} · Sri Lanka</p>
                  </td>
                  <td>
                    <span className="badge">{u.status}</span>
                  </td>
                  <td>
                    <div className="stack gap-2!">
                      {u.status !== 'suspended' && (
                        <Operation operation="verify" id={u.id} label="Approve eligibility" note />
                      )}
                      {u.status !== 'suspended' && (
                        <Operation operation="suspend" id={u.id} label="Suspend account" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel admin-section" id="matches">
        <div className="section-title">
          <div>
            <h2>Thoughtful pairings.</h2>
            <p>Values 35% · interests 25% · lifestyle 20% · personality 20%</p>
          </div>
          <form action={rpcAction}>
            <input type="hidden" name="operation" value="admin:generate" />
            <button className="button button-primary button-sm">Find compatible pairs</button>
          </form>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Compatibility</th>
                <th>Invitation & consent</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => {
                const invitation = invitations.find((i) => i.recommendation_id === r.id);
                return (
                  <tr key={r.id} data-testid={'recommendation-' + r.id}>
                    <td>
                      {name(r.user_a)}
                      <br />& {name(r.user_b)}
                      <p>
                        {byId.get(r.user_a)?.district} ↔ {byId.get(r.user_b)?.district}
                      </p>
                    </td>
                    <td>
                      {r.score}%
                      <p>
                        {Object.entries(r.breakdown ?? {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                      <p>Points contributed to score, not percentages per category.</p>
                    </td>
                    <td>
                      {invitation ? (
                        <>
                          <span className="badge">
                            {invitation.status === 'invited' &&
                            new Date(invitation.expires_at) < new Date()
                              ? 'expired'
                              : invitation.status}
                          </span>
                          <p>
                            {
                              decisions.filter(
                                (d) => d.invitation_id === invitation.id && d.accepted,
                              ).length
                            }
                            /2 independent acceptances
                          </p>
                          <p>Expires {colombo(invitation.expires_at)}</p>
                        </>
                      ) : (
                        <span className="badge">{r.status}</span>
                      )}
                    </td>
                    <td>
                      {r.status === 'suggested' && (
                        <div className="stack gap-2!">
                          <form action={rpcAction}>
                            <input type="hidden" name="operation" value="admin:approve" />
                            <input type="hidden" name="id" value={r.id} />
                            <label className="field">
                              <span>Invitation hours (1–168)</span>
                              <input
                                type="number"
                                name="hours"
                                min={1}
                                max={168}
                                defaultValue={72}
                              />
                            </label>
                            <button className="button button-primary button-sm">
                              Approve & invite both
                            </button>
                          </form>
                          <Operation operation="reject" id={r.id} label="Reject pairing" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <details className="details-form">
          <summary>Create a manual recommendation</summary>
          <p className="form-hint">
            Manual pairings must pass the same adult, residency, mutual preference, distance,
            dealbreaker and safety rules. They still require review and independent acceptance.
          </p>
          <form action={rpcAction}>
            <input type="hidden" name="operation" value="admin:manual" />
            <div className="form-grid">
              {['a', 'b'].map((k) => (
                <label className="field" key={k}>
                  <span>Member {k.toUpperCase()}</span>
                  <select name={k}>
                    {users
                      .filter((u) => u.status === 'eligible')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {name(u.id)}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            </div>
            <button className="button button-outline button-sm">Create recommendation</button>
          </form>
        </details>
      </section>
      <section className="panel admin-section" id="bookings">
        <h2>The date calendar.</h2>
        <p className="form-hint">
          Times use Asia/Colombo. Confirm only after an actual venue reservation. Completing a date
          requires its confirmed time to have passed.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Member & venue</th>
                <th>Status</th>
                <th>Coordinate</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{colombo(b.date_at)}</td>
                  <td>
                    {name(b.user_id)}
                    <p>
                      {b.partner_venues?.name} · {b.partner_venues?.city}
                    </p>
                    <p>{b.date_packages?.name}</p>
                  </td>
                  <td>
                    <span className="badge">{b.status}</span>
                  </td>
                  <td>
                    {b.status === 'requested' && (
                      <Operation
                        operation="confirm_booking"
                        id={b.id}
                        label="Confirm reservation"
                        note
                      />
                    )}
                    {b.status === 'confirmed' && (
                      <Operation operation="complete_booking" id={b.id} label="Mark completed" />
                    )}
                    {b.note && <p>{b.note}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel admin-section" id="venues">
        <h2>Places for connection.</h2>
        <p>
          Only vetted, active Sri Lankan venues in an active district can receive booking requests.
          Real venue partnerships must be established before activation.
        </p>
        <div className="info-grid mt-6">
          {venues.map((v) => (
            <details key={v.id} className="panel">
              <summary className="cursor-pointer">
                {v.name}
                {v.is_demo ? ' · DEMO' : ''}
                <p>
                  {v.city}, {v.district} · {v.active ? 'Active' : 'Inactive'}
                </p>
              </summary>
              <div className="mt-5">
                <VenueForm venue={v} />
              </div>
            </details>
          ))}
        </div>
        <details className="details-form">
          <summary>Add a Sri Lankan venue</summary>
          <div className="mt-5 max-w-xl">
            <VenueForm />
          </div>
        </details>
      </section>
      <section className="panel admin-section" id="finance">
        <h2>Money, with clarity.</h2>
        <p className="form-hint">
          All prices and transactions are LKR. Sandbox payments are test records and are excluded
          from live revenue. Process refunds in the actual merchant gateway first, then record the
          gateway reference here.
        </p>
        <div className="info-grid">
          {packages.map((p) => (
            <form action={packageAction} key={p.id} className="panel">
              <h3>{p.name}</h3>
              <input type="hidden" name="package" value={p.id} />
              <label className="field">
                <span>LKR per person</span>
                <input
                  type="number"
                  name="amount"
                  defaultValue={p.price_lkr}
                  min={1}
                  max={1000000}
                  step="0.01"
                  required
                />
              </label>
              <label className="check-label">
                <input name="active" type="checkbox" defaultChecked={p.active} />
                Available for new bookings
              </label>
              <button className="button button-outline button-sm">Save package</button>
            </form>
          ))}
        </div>
        <div className="table-wrap mt-5">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Gateway & refund</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.user_id ? name(p.user_id) : 'Deleted member'}
                    <p>{colombo(p.created_at)}</p>
                  </td>
                  <td>
                    {money(p.amount_lkr)}
                    <p>{p.mode === 'sandbox' ? 'SANDBOX TEST' : 'LIVE'}</p>
                  </td>
                  <td>
                    <span className="badge">{p.status}</span>
                  </td>
                  <td>
                    <p>{p.provider_id ?? 'No verified callback'}</p>
                    {p.status === 'refund_requested' && (
                      <Operation
                        operation="refund"
                        id={p.id}
                        label="Record completed refund"
                        note
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel admin-section" id="safety">
        <h2>Safety comes first.</h2>
        {!reports.length ? (
          <p>No safety reports have been submitted.</p>
        ) : (
          reports.map((r) => (
            <article className="booking-row" key={r.id}>
              <span className="badge">{r.status}</span>
              <p className="mt-3">
                Reporter: {r.user_id ? name(r.user_id) : 'Deleted member'} · Reported:{' '}
                {r.reported_id ? name(r.reported_id) : 'Not specified'}
              </p>
              <p>{r.reason}</p>
              <div className="inline-actions">
                {r.reported_id && (
                  <Operation
                    operation="suspend"
                    id={r.reported_id}
                    label="Suspend reported account"
                  />
                )}
                {r.status !== 'resolved' && (
                  <Operation operation="resolve_report" id={r.id} label="Resolve report" />
                )}
              </div>
            </article>
          ))
        )}
      </section>
      <section className="panel admin-section" id="messages">
        <h2>Messages to the club.</h2>
        {!contacts.length ? (
          <p>No contact messages yet.</p>
        ) : (
          contacts.map((c) => (
            <article className="booking-row" key={c.id}>
              <h4>{c.name}</h4>
              <p>
                {c.email} · {colombo(c.created_at)}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{c.message}</p>
            </article>
          ))
        )}
      </section>
      <section className="panel admin-section" id="audit">
        <h2>A record of care.</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action & target</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{colombo(l.created_at)}</td>
                  <td>{name(l.admin_id)}</td>
                  <td>
                    {l.action}
                    <p>{l.target_id}</p>
                  </td>
                  <td>{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
