import { requireUser } from '@/lib/auth';
import { BookingForm } from '@/components/forms';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
export const metadata = { title: 'Plan your first date' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string }>;
}) {
  const { db } = await requireUser();
  const { invitation } = await searchParams;
  const { data: invitations, error } = await db.rpc('my_invitations');
  if (error) throw Error(error.message);
  const valid =
    Array.isArray(invitations) &&
    invitations.some((i) => i.id === invitation && i.status === 'accepted');
  if (!valid)
    return (
      <div className="container section">
        <h2>A mutual yes comes first.</h2>
        <p className="mt-5">
          Both people must independently accept an invitation before requesting a date.
        </p>
        <Link className="text-link" href="/dashboard">
          Return to your dashboard
        </Link>
      </div>
    );
  const { data: venues, error: e } = await db
    .from('partner_venues')
    .select('id,name,city,district,is_demo')
    .eq('active', true)
    .eq('vetted', true)
    .eq('district', 'Colombo');
  if (e) throw Error(e.message);
  const { data: packages, error: pe } = await db
    .from('date_packages')
    .select('id,name,price_lkr')
    .eq('active', true)
    .order('price_lkr');
  if (pe) throw Error(pe.message);
  return (
    <div className="container content-page">
      <div className="page-heading">
        <span className="eyebrow">TWO YESES. ONE LOVELY POSSIBILITY.</span>
        <h1>
          Let’s make <em>a plan.</em>
        </h1>
        <p>
          Tell us your preferences. Our team will coordinate availability and confirm your
          reservation.
        </p>
      </div>
      <div className="booking-layout">
        <div className="panel">
          <BookingForm invitation={invitation!} venues={venues ?? []} packages={packages ?? []} />
        </div>
        <aside className="panel h-fit">
          <ShieldCheck size={25} />
          <h3 className="mt-4">Good plans. Safe places.</h3>
          <p>
            All dates take place at vetted public venues in Sri Lanka. Colombo is our initial launch
            district.
          </p>
          <div className="divider" />
          <p>
            Your preferred time is a request. Only our team can mark a venue reservation as
            confirmed after contacting the venue.
          </p>
          <Link className="text-link" href="/refunds">
            Cancellation & refund policy
          </Link>
        </aside>
      </div>
    </div>
  );
}
