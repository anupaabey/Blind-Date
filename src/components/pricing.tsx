import Link from 'next/link';
import { Check, ArrowUpRight, Sparkles } from 'lucide-react';
import { configured, publicCatalog } from '@/lib/supabase/server';
export const packages = [
  {
    id: 'standard',
    name: 'Standard Date',
    price: '2,500',
    label: 'A beautiful beginning',
    features: [
      'Thoughtful compatibility matching',
      'A private, mutual invitation',
      'Your first date, coordinated',
    ],
  },
  {
    id: 'curated',
    name: 'Curated Date',
    price: '4,500',
    label: 'A little more personal',
    features: [
      'Personalized match curation',
      'Venue coordination in Colombo',
      'A thoughtful icebreaker activity',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Mystery Date',
    price: '7,500',
    label: 'Let us make it special',
    features: [
      'Dedicated personalized matchmaking',
      'Premium venue coordination',
      'A custom-planned date experience',
    ],
  },
];
export async function Pricing() {
  let shown = packages;
  if (configured()) {
    const db = publicCatalog();
    const { data, error } = await db
      .from('date_packages')
      .select('id,name,price_lkr,active')
      .order('price_lkr');
    if (error)
      return (
        <div className="notice">
          Package pricing is temporarily unavailable. Please check back before making a booking.
        </div>
      );
    shown = packages
      .filter((p) => data?.some((x) => x.id === p.id && x.active))
      .map((p) => {
        const live = data!.find((x) => x.id === p.id)!;
        return {
          ...p,
          name: live.name,
          price: new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(
            live.price_lkr,
          ),
        };
      });
  }
  return (
    <div className="pricing-grid">
      {shown.map((p) => (
        <article
          className={'price-card ' + (p.id === 'curated' ? 'price-featured' : '')}
          key={p.id}
        >
          {p.id === 'curated' && (
            <span className="price-ribbon">
              <Sparkles size={13} /> THE CURATED EXPERIENCE
            </span>
          )}
          <span className="eyebrow">{p.label}</span>
          <h3>{p.name}</h3>
          <p className="price">
            <small>LKR</small> {p.price}
            <span>/ person</span>
          </p>
          <div className="divider" />
          <ul>
            {p.features.map((f) => (
              <li key={f}>
                <Check size={16} />
                {f}
              </li>
            ))}
          </ul>
          <Link
            className={'button ' + (p.id === 'curated' ? 'button-primary' : 'button-outline')}
            href={'/signup?package=' + p.id}
          >
            Choose your experience <ArrowUpRight size={16} />
          </Link>
          <p className="tiny">Food, drinks and venue charges are additional.</p>
        </article>
      ))}
    </div>
  );
}
