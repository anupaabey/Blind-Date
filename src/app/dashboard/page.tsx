import Link from 'next/link';
import { Sparkles, ShieldCheck, LockKeyhole, ArrowUpRight, Calendar, Heart } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { logout, rpcAction } from '@/app/actions';
import { DeleteAccount, PhoneForm, ResidenceForm } from '@/components/forms';
import { money } from '@/lib/validation';
import { colombo } from '@/lib/time';
type Invitation = {
  id: string;
  status: string;
  expires_at: string;
  my_decision: boolean | null;
  score: number | null;
  age_range: string | null;
  district: string | null;
  interests: string[];
};
export const metadata = { title: 'Your club' };
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { db, user } = await requireUser();
  const { message } = await searchParams;
  const [p, a, inv, bookings, payments, notifications, connections, admin, feedback] =
    await Promise.all([
      db.from('profiles').select('*').eq('id', user.id).single(),
      db
        .from('questionnaire_answers')
        .select('question_id', { count: 'exact' })
        .eq('user_id', user.id),
      db.rpc('my_invitations'),
      db
        .from('date_bookings')
        .select('*,partner_venues(name,city,address,is_demo),date_packages(name,price_lkr)')
        .eq('user_id', user.id)
        .order('date_at'),
      db
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      db
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8),
      db.rpc('my_connections'),
      db.rpc('is_admin'),
      db.from('date_feedback').select('booking_id').eq('user_id', user.id),
    ]);
  const failure = [p, a, inv, bookings, payments, notifications, connections, admin, feedback].find(
    (r) => r.error,
  );
  if (failure?.error) throw Error(failure.error.message);
  const profile = p.data;
  const invitations = (inv.data ?? []) as Invitation[];
  const count = a.count ?? 0;
  const complete = Math.round((count / 24) * 100);
  return (
    <div className="container dashboard">
      <div className="dashboard-top">
        <div>
          <span className="eyebrow">YOUR LITTLE CORNER OF THE CLUB</span>
          <h1>
            Hello, <em>{profile.display_name}.</em>
          </h1>
          <p>Good things take a little intention. Here’s where your story stands.</p>
        </div>
        <div className="dashboard-actions">
          {admin.data && (
            <Link className="button button-outline button-sm" href="/admin">
              Admin dashboard
            </Link>
          )}
          <Link className="button button-outline button-sm" href="/onboarding">
            Edit my profile
          </Link>
          <form action={logout}>
            <button className="text-link">Log out</button>
          </form>
        </div>
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {profile.is_demo && (
        <div className="notice">
          FICTIONAL DEMO ACCOUNT · All profiles, invitations and venues in this account are test
          data. They are not real members or venue partnerships.
        </div>
      )}
      <div className="dashboard-grid">
        <div className="stack">
          <section className="panel">
            <div className="status-line">
              <h2 className="mb-0!">A story in progress.</h2>
              <span className={'badge ' + (profile.status === 'eligible' ? 'green' : '')}>
                {!profile.matching_enabled
                  ? 'Matching paused'
                  : profile.status === 'eligible'
                    ? 'Eligibility approved'
                    : profile.status === 'waitlist'
                      ? 'Sri Lanka waitlist'
                      : profile.status === 'suspended'
                        ? 'Account suspended'
                        : 'Eligibility review pending'}
              </span>
            </div>
            <p>
              {profile.status === 'waitlist'
                ? `You’re on our ${profile.district} waitlist. We’ll notify you when local booking coverage opens. Our initial launch is Colombo.`
                : profile.status === 'eligible'
                  ? 'Your residency has been reviewed. Completed profiles can be considered for privately reviewed matches.'
                  : profile.status === 'suspended'
                    ? 'Your account is restricted while our team reviews a safety or eligibility issue. Please contact support.'
                    : 'Confirm your email, complete your personality questionnaire, and await a human residency review. We never infer residency from your name or phone number.'}
            </p>
            <div className="mini-progress" aria-label={`Questionnaire ${complete}% complete`}>
              <span style={{ width: complete + '%' }} />
            </div>
            <div className="status-line">
              <span className="tiny">Personality questionnaire · {count}/24 answers</span>
              <Link href="/onboarding" className="text-link">
                {count === 24 ? 'Review my answers' : 'Continue my profile'}{' '}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>
          <section className="panel">
            <span className="eyebrow">A LITTLE POSSIBILITY</span>
            <h2 className="mt-3">Your mystery invitations.</h2>
            {!invitations.length ? (
              <div className="empty-state">
                <Sparkles size={31} />
                <h3>Some things are worth the wait.</h3>
                <p>
                  When a compatible pairing passes human review, your anonymous invitation will
                  appear here. There are no public member profiles to browse.
                </p>
              </div>
            ) : (
              invitations.map((i) => (
                <article className="match-card" key={i.id}>
                  <div className="status-line">
                    <span className="eyebrow">WE FOUND SOMEONE SPECIAL FOR YOU</span>
                    <span className="badge">{i.status}</span>
                  </div>
                  <h3>
                    A connection worth <em>exploring.</em>
                  </h3>
                  <div className="booking-meta">
                    {i.age_range && <span>Age range · {i.age_range}</span>}
                    {i.district && <span>{i.district}, Sri Lanka</span>}
                    {i.score !== null && <span>Questionnaire similarity · {i.score}%</span>}
                  </div>
                  {i.interests.length > 0 && (
                    <div className="interest-tags">
                      {i.interests.map((v) => (
                        <span key={v}>{v}</span>
                      ))}
                    </div>
                  )}
                  <p className="form-hint">
                    Only independently consented anonymous highlights are shown. Similarity compares
                    questionnaire answers; it does not predict romantic success.
                  </p>
                  {i.status === 'invited' && (
                    <>
                      <p className="tiny">
                        Invitation expires {colombo(i.expires_at)} · Sri Lanka time
                      </p>
                      {i.my_decision === null ? (
                        <div className="inline-actions">
                          <form action={rpcAction}>
                            <input type="hidden" name="operation" value="accept" />
                            <input type="hidden" name="id" value={i.id} />
                            <button className="button button-primary button-sm">
                              Accept my mystery date <Heart size={14} />
                            </button>
                          </form>
                          <form action={rpcAction}>
                            <input type="hidden" name="operation" value="decline" />
                            <input type="hidden" name="id" value={i.id} />
                            <button className="button button-outline button-sm">
                              Not interested
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="notice mt-4">
                          You’ve accepted. The next step unlocks only if both of you independently
                          accept.
                        </div>
                      )}
                    </>
                  )}
                  {i.status === 'accepted' && (
                    <Link
                      className="button button-primary button-sm"
                      href={'/booking?invitation=' + i.id}
                    >
                      Plan our first date <Calendar size={14} />
                    </Link>
                  )}
                  <details className="details-form">
                    <summary>Report a concern or block this match</summary>
                    <form action={rpcAction}>
                      <input type="hidden" name="operation" value="report" />
                      <input type="hidden" name="id" value={i.id} />
                      <label className="field">
                        <span>Tell our safety team what happened</span>
                        <textarea name="reason" minLength={5} maxLength={2000} required />
                      </label>
                      <label className="check-label">
                        <input type="checkbox" name="block" defaultChecked />
                        Block this member and close this invitation.
                      </label>
                      <button className="button button-outline button-sm">
                        Submit private report
                      </button>
                    </form>
                  </details>
                </article>
              ))
            )}
          </section>
          <section className="panel">
            <h2>Your dates.</h2>
            {!bookings.data?.length ? (
              <p>
                Your upcoming date requests and past dates will appear here after mutual acceptance.
              </p>
            ) : (
              bookings.data.map((b) => (
                <article className="booking-row" key={b.id}>
                  <span className="badge">
                    {b.status === 'requested' ? 'Venue confirmation pending' : b.status}
                  </span>
                  <h3>{b.date_packages?.name}</h3>
                  <p>
                    {b.partner_venues?.name}{' '}
                    {b.partner_venues?.is_demo ? '· Fictional demo venue' : ''}
                  </p>
                  <div className="booking-meta">
                    <span>{colombo(b.date_at)} · Sri Lanka time</span>
                    <span>{b.partner_venues?.city}, Sri Lanka</span>
                    <span>{money(b.date_packages?.price_lkr ?? 0)} / person</span>
                  </div>
                  {b.status === 'confirmed' && (
                    <div className="notice">
                      Venue: {b.partner_venues?.address}. {b.note} Tell a trusted person your plans
                      and arrange your own transport.
                    </div>
                  )}
                  {['requested', 'confirmed'].includes(b.status) && (
                    <>
                      <div className="inline-actions">
                        <Link
                          href={'/checkout?booking=' + b.id}
                          className="button button-outline button-sm"
                        >
                          Payment & receipt
                        </Link>
                        <form action={rpcAction}>
                          <input type="hidden" name="operation" value="cancel" />
                          <input type="hidden" name="id" value={b.id} />
                          <button className="button button-outline button-sm">
                            Cancel request
                          </button>
                        </form>
                      </div>
                      <details className="details-form">
                        <summary>Request a different time</summary>
                        <form action={rpcAction}>
                          <input type="hidden" name="operation" value="reschedule" />
                          <input type="hidden" name="id" value={b.id} />
                          <div className="form-grid">
                            <label className="field">
                              <span>New date</span>
                              <input type="date" name="date" required />
                            </label>
                            <label className="field">
                              <span>Sri Lanka time</span>
                              <input type="time" name="time" min="08:00" max="21:59" required />
                            </label>
                          </div>
                          <button className="button button-outline button-sm">
                            Request rescheduling
                          </button>
                        </form>
                      </details>
                    </>
                  )}
                  {b.status === 'completed' &&
                    !feedback.data?.some((f) => f.booking_id === b.id) && (
                      <details className="details-form" open>
                        <summary>Your private after-date feedback</summary>
                        <form action={rpcAction}>
                          <input type="hidden" name="operation" value="feedback" />
                          <input type="hidden" name="id" value={b.id} />
                          <p className="form-hint">
                            Your answers stay private to you and our team. An unchecked box means
                            no.
                          </p>
                          <div className="feedback-grid">
                            {[
                              ['enjoyed', 'I enjoyed the date'],
                              ['comfortable', 'The venue was comfortable'],
                              ['safe', 'I felt safe'],
                              ['another', 'I would like another date'],
                              ['recommend', 'I would recommend the service'],
                            ].map(([key, label]) => (
                              <label className="check-label" key={key}>
                                <input type="checkbox" name={key} />
                                {label}
                              </label>
                            ))}
                          </div>
                          <label className="field">
                            <span>Anything else? · private</span>
                            <textarea name="note" maxLength={1000} />
                          </label>
                          <label className="check-label">
                            <input type="checkbox" name="exchange_consent" />I independently consent
                            to sharing my first name and account email, only if we both felt safe,
                            want another date, and consent to exchange.
                          </label>
                          <button className="button button-primary button-sm">
                            Save private feedback
                          </button>
                        </form>
                      </details>
                    )}
                </article>
              ))
            )}
          </section>
          {connections.data?.length > 0 && (
            <section className="panel">
              <h2>A connection, by mutual choice.</h2>
              <p>
                You both independently agreed to exchange your first names and emails after your
                date.
              </p>
              {connections.data.map(
                (c: { invitation: string; first_name: string; email: string }) => (
                  <div className="notice mt-4" key={c.invitation}>
                    {c.first_name} · <a href={'mailto:' + c.email}>{c.email}</a>
                  </div>
                ),
              )}
            </section>
          )}
          <section className="panel">
            <h2>Payments & receipts.</h2>
            {!payments.data?.length ? (
              <p>No transactions yet. We never store your card details.</p>
            ) : (
              payments.data.map((t) => (
                <div className="booking-row" key={t.id}>
                  <span className="badge">
                    {t.mode === 'sandbox' ? 'TEST MODE · ' : ''}
                    {t.status}
                  </span>
                  <p className="mt-3">
                    {money(t.amount_lkr)} · {colombo(t.created_at)}
                  </p>
                  <p className="tiny">Receipt / order: {t.id}</p>
                  {t.provider_id && <p className="tiny">Gateway reference: {t.provider_id}</p>}
                  {t.status === 'refund_requested' && (
                    <p className="form-hint">
                      Your refund awaits review and actual gateway processing. It has not been
                      completed.
                    </p>
                  )}
                </div>
              ))
            )}
          </section>
        </div>
        <aside className="stack">
          <section className="panel">
            <ShieldCheck className="mb-4" size={24} />
            <h3>Your peace of mind.</h3>
            <p>
              No public profiles. Your photo, exact location and contact information stay private.
              Every date needs a yes from both of you.
            </p>
            <Link className="text-link" href="/safety">
              Read the safety guide <ArrowUpRight size={14} />
            </Link>
          </section>
          <section className="panel">
            <h3>Little updates.</h3>
            {notifications.data?.map((n) => (
              <div className="notification" key={n.id}>
                {n.message}
                <time>{colombo(n.created_at)}</time>
              </div>
            ))}
            <p className="form-hint">
              These in-app updates are real. Email delivery depends on configured providers.
            </p>
          </section>
          <section className="panel">
            <h3>Your account.</h3>
            <p>{profile.district}, Sri Lanka</p>
            <p>Email: {user.email_confirmed_at ? 'Verified' : 'Confirmation needed'}</p>
            <p>Phone: {user.phone_confirmed_at ? 'Verified' : 'Not verified'}</p>
            <PhoneForm />
            <ResidenceForm />
            {!profile.matching_enabled && (
              <form action={rpcAction} className="details-form">
                <input type="hidden" name="operation" value="resume" />
                <label className="check-label">
                  <input type="checkbox" name="resident" required />I currently reside in Sri Lanka
                  and want to request a fresh eligibility review.
                </label>
                <button className="button button-outline button-sm">
                  Request to resume matching
                </button>
              </form>
            )}
            <details className="details-form">
              <summary>Pause matching</summary>
              <form action={rpcAction}>
                <input type="hidden" name="operation" value="pause" />
                <p className="form-hint">
                  Pausing closes active invitations, cancels active bookings and marks paid dates
                  for refund review. Contact our team for a fresh eligibility review to resume. Use
                  this if you no longer reside in Sri Lanka or need a break.
                </p>
                <button className="button button-outline button-sm">Pause matching now</button>
              </form>
            </details>
            <Link className="text-link" href="/onboarding">
              Privacy & sharing settings <LockKeyhole size={13} />
            </Link>
            <DeleteAccount />
          </section>
        </aside>
      </div>
    </div>
  );
}
