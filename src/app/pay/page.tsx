import { requireUser } from '@/lib/auth';
import { checkoutHash, gatewayConfigured } from '@/lib/payments';
import { redirect } from 'next/navigation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { db, user } = await requireUser();
  const { payment } = await searchParams;
  if (!gatewayConfigured()) redirect('/dashboard');
  const { data: p } = await db
    .from('payments')
    .select('*')
    .eq('id', payment ?? '')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();
  const { data: profile } = await db
    .from('profiles')
    .select('first_name,phone,city')
    .eq('id', user.id)
    .single();
  if (!p || !profile) redirect('/dashboard');
  const site = process.env.SITE_URL!;
  const fields = {
    merchant_id: process.env.PAYHERE_MERCHANT_ID!,
    return_url: site + '/dashboard?message=Payment+submitted.+Awaiting+server+verification.',
    cancel_url: site + '/dashboard?message=Checkout+cancelled.',
    notify_url: site + '/api/payments/payhere',
    order_id: p.id,
    items: 'Blind Date Club coordination fee',
    currency: 'LKR',
    amount: Number(p.amount_lkr).toFixed(2),
    first_name: profile.first_name,
    last_name: 'Member',
    email: user.email!,
    phone: profile.phone,
    address: profile.city,
    city: profile.city,
    country: 'Sri Lanka',
    hash: checkoutHash(
      process.env.PAYHERE_MERCHANT_ID!,
      p.id,
      Number(p.amount_lkr).toFixed(2),
      process.env.PAYHERE_MERCHANT_SECRET!,
    ),
  };
  return (
    <div className="container section">
      <div className="panel prose">
        <h2>{p.mode === 'sandbox' ? 'Sandbox test checkout' : 'Secure PayHere checkout'}</h2>
        <p className="mt-4">
          Your card details are handled by PayHere. We never receive or store them. A successful
          return page is not proof of payment; only a verified server callback updates your receipt.
        </p>
        <form
          method="post"
          action={
            p.mode === 'sandbox'
              ? 'https://sandbox.payhere.lk/pay/checkout'
              : 'https://www.payhere.lk/pay/checkout'
          }
        >
          {Object.entries(fields).map(([k, v]) => (
            <input type="hidden" key={k} name={k} value={v} />
          ))}
          <button className="button button-primary mt-5">
            Open {p.mode === 'sandbox' ? 'test ' : ''}payment page
          </button>
        </form>
      </div>
    </div>
  );
}
