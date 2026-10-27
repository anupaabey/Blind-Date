import { requireUser } from '@/lib/auth';
import { gatewayConfigured } from '@/lib/payments';
import { money } from '@/lib/validation';
import { redirect } from 'next/navigation';
import Link from 'next/link';
async function start(f: FormData) {
  'use server';
  const { db } = await requireUser();
  if (!gatewayConfigured()) redirect('/dashboard?message=Payment+gateway+is+not+configured.');
  const { data, error } = await db.rpc('create_checkout', {
    booking: String(f.get('booking')),
    payment_mode: process.env.PAYHERE_MODE ?? 'sandbox',
  });
  if (error) redirect('/dashboard?message=' + encodeURIComponent(error.message));
  redirect('/pay?payment=' + data.order_id);
}
export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { db, user } = await requireUser();
  const { booking } = await searchParams;
  const { data: b } = await db
    .from('date_bookings')
    .select('*,date_packages(*)')
    .eq('id', booking ?? '')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!b) redirect('/dashboard');
  const { data: payments } = await db
    .from('payments')
    .select('*')
    .eq('booking_id', b.id)
    .eq('user_id', user.id);
  const paid = payments?.find((p) => p.status === 'paid');
  return (
    <div className="container content-page">
      <div className="page-heading">
        <span className="eyebrow">CLEAR PRICING. NO SURPRISES.</span>
        <h1>
          Your date, <em>thoughtfully planned.</em>
        </h1>
      </div>
      <div className="panel prose">
        <h2>{b.date_packages.name}</h2>
        <p>{money(b.date_packages.price_lkr)} per person · LKR only</p>
        <p>{b.date_packages.description}</p>
        {paid ? (
          <div className="receipt">
            {paid.mode === 'sandbox' ? 'TEST PAYMENT RECEIPT' : 'PAYMENT RECEIPT'}
            <br />
            Order: {paid.id}
            <br />
            Gateway: {paid.provider_id}
            <br />
            Amount: {money(paid.amount_lkr)}
            <br />
            Status: server-verified {paid.status}
          </div>
        ) : (
          <>
            <div className="notice">
              {gatewayConfigured()
                ? process.env.PAYHERE_MODE === 'live'
                  ? 'PayHere is configured for live payments.'
                  : 'PAYHERE SANDBOX · This is a test payment. No real payment is being requested.'
                : 'PAYMENTS UNAVAILABLE · A merchant account has not been connected. No payment can be made or confirmed.'}
            </div>
            <p>
              Our fee covers matching and coordination. Food, drinks and any venue charges are
              additional and paid separately to the venue. A payment does not confirm a venue
              reservation.
            </p>
            <form action={start}>
              <input type="hidden" name="booking" value={b.id} />
              <label className="check-label">
                <input type="checkbox" required />
                <span>
                  I understand the price, additional venue costs and{' '}
                  <Link className="underline" href="/refunds">
                    cancellation and refund policy
                  </Link>
                  .
                </span>
              </label>
              <button disabled={!gatewayConfigured()} className="button button-primary">
                {gatewayConfigured() ? 'Continue to PayHere' : 'Awaiting merchant setup'}
              </button>
            </form>
          </>
        )}
        <Link className="text-link" href="/dashboard">
          Back to my dashboard
        </Link>
      </div>
    </div>
  );
}
