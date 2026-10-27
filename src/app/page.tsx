import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Heart,
  Sparkles,
  MoveRight,
  LockKeyhole,
  Check,
  Quote,
  Coffee,
} from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { Pricing } from '@/components/pricing';
const steps = [
  [
    '01',
    'Tell us your story',
    'A little about you. What matters to you. The kind of connection you’re looking for.',
  ],
  [
    '02',
    'Leave a little to mystery',
    'We look for thoughtful compatibility. You both say yes, without revealing your identities.',
  ],
  [
    '03',
    'Just show up, be yourself',
    'We coordinate a date in a vetted, public Colombo venue. You bring the conversation.',
  ],
];
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <Reveal className="hero-copy">
            <div className="eyebrow hero-eyebrow">
              <span className="status-dot" /> A NEW WAY TO MEET, RIGHT HERE IN SRI LANKA
            </div>
            <h1>
              Your next
              <br />
              love story starts
              <br />
              with a <em>mystery.</em>
              <Sparkles className="headline-spark" />
            </h1>
            <p className="hero-description">
              Sri Lanka’s blind dating experience.
              <br />
              Forget endless swiping. Let us find your match
              <br className="desktop-break" /> and plan your first date.
            </p>
            <div className="hero-buttons">
              <Link href="/signup" className="button button-primary">
                Find my mystery match <ArrowUpRight size={18} />
              </Link>
              <Link href="/how-it-works" className="text-link">
                How it works <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-reassurance">
              <span>
                <ShieldCheck size={16} /> Private by design
              </span>
              <i />
              <span>
                <MapPin size={16} /> Starting in Colombo
              </span>
              <i />
              <span>18+ only</span>
            </div>
          </Reveal>
          <Reveal className="hero-art" delay={0.15}>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-image">
              <img
                src="/date-scene.svg"
                alt="Illustration of a quiet Colombo café at sunset, with two chairs and coffee for two"
                width="760"
                height="900"
                fetchPriority="high"
              />
              <div className="image-overlay" />
              <span className="image-topline">TWO COFFEES. ONE POSSIBILITY.</span>
              <div className="image-caption">
                <span>A table for two.</span>
                <em>A story yet to be written.</em>
              </div>
            </div>
            <div className="floating-note">
              <span className="note-icon">
                <Heart size={19} />
              </span>
              <div>
                <strong>A real connection.</strong>
                <span>Worth a little mystery.</span>
              </div>
              <Sparkles size={17} />
            </div>
            <div className="hero-stamp">
              <span>THOUGHTFULLY CURATED</span>
              <Sparkles size={27} />
              <span>EXCLUSIVELY SRI LANKA</span>
            </div>
            <span className="art-footnote">Illustration · A feeling of what’s to come</span>
          </Reveal>
        </div>
      </section>
      <div className="promise-strip">
        <div className="container">
          <span>We find your match.</span>
          <Sparkles />
          <span>We plan your date.</span>
          <Sparkles />
          <span>You just show up.</span>
          <Heart />
        </div>
      </div>
      <section className="section container">
        <Reveal className="section-intro">
          <div>
            <span className="eyebrow">A LITTLE INTENTION. A LITTLE SERENDIPITY.</span>
            <h2>
              Good connections shouldn’t
              <br />
              feel like <em>hard work.</em>
            </h2>
          </div>
          <p>
            Endless profiles aren’t for everyone.
            <br />
            We’re bringing a more thoughtful, human touch
            <br />
            to meeting someone new in Sri Lanka.
          </p>
        </Reveal>
        <div className="steps-grid">
          {steps.map(([n, title, body], i) => (
            <Reveal className="step-card" key={n} delay={i * 0.08}>
              <div className="step-top">
                <span>{n}</span>
                {i === 0 ? <Heart /> : i === 1 ? <Sparkles /> : <Coffee />}
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
              <Link href="/how-it-works" className="step-link" aria-label={'Read more: ' + title}>
                <ArrowUpRight size={20} />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="difference-section">
        <div className="container difference-grid">
          <Reveal className="mystery-card-wrap">
            <div className="mini-star">✧</div>
            <div className="mystery-card">
              <span className="eyebrow">A LITTLE GLIMPSE. NEVER THE WHOLE STORY.</span>
              <div className="mystery-avatar">
                <Sparkles size={37} />
              </div>
              <span className="pill">ILLUSTRATIVE MATCH · NOT A REAL MEMBER</span>
              <h3>
                Someone who gets
                <br />
                your kind of <em>Sunday.</em>
              </h3>
              <div className="interest-tags">
                <span>☕ Café conversations</span>
                <span>↗ Weekend adventures</span>
                <span>♡ Something meaningful</span>
              </div>
              <div className="mystery-card-bottom">
                <LockKeyhole size={16} /> Identities stay private until you both consent.
              </div>
            </div>
            <span className="script-note">a little intrigue looks good on you.</span>
          </Reveal>
          <Reveal className="difference-copy">
            <span className="eyebrow">LESS NOISE. MORE POSSIBILITY.</span>
            <h2>
              Meet the person.
              <br />
              Keep the <em>butterflies.</em>
            </h2>
            <p>
              Connection goes deeper than a photograph. We start with your values, interests and the
              things that make you, you.
            </p>
            <div className="feature-row">
              <ShieldCheck />
              <div>
                <h4>Private, from the very first hello</h4>
                <p>No public profiles. No contact details shared without independent consent.</p>
              </div>
            </div>
            <div className="feature-row">
              <Heart />
              <div>
                <h4>A yes, from both of you</h4>
                <p>
                  Every match is reviewed by a person. Nothing moves forward unless you both choose
                  it.
                </p>
              </div>
            </div>
            <div className="feature-row">
              <MapPin />
              <div>
                <h4>Local places. Thoughtful plans.</h4>
                <p>
                  Dates in vetted public venues, exclusively in Sri Lanka. Beginning in Colombo.
                </p>
              </div>
            </div>
            <Link href="/safety" className="text-link">
              Your comfort comes first <ArrowUpRight size={17} />
            </Link>
          </Reveal>
        </div>
      </section>
      <section className="section container" id="packages">
        <Reveal className="center-heading">
          <span className="eyebrow">CHOOSE YOUR KIND OF FIRST DATE</span>
          <h2>
            A little investment in
            <br />
            <em>a real possibility.</em>
          </h2>
          <p>Thoughtful experiences. Clear pricing. All in Sri Lankan rupees.</p>
        </Reveal>
        <Pricing />
        <p className="section-note">
          No subscription. No promise of romance. Just a thoughtfully coordinated opportunity to
          connect.
        </p>
      </section>
      <section className="quote-section">
        <Reveal className="container quote-content">
          <Quote size={28} />
          <blockquote>
            “What if the best part of your next date
            <br />
            is everything you don’t know yet?”
          </blockquote>
          <span className="eyebrow">A LITTLE MYSTERY. AN OPEN MIND. YOU.</span>
        </Reveal>
      </section>
      <section className="section container faq-section">
        <Reveal>
          <span className="eyebrow">IT’S OKAY TO BE A LITTLE CURIOUS</span>
          <h2>
            A few things you
            <br />
            might be <em>wondering.</em>
          </h2>
          <Link href="/faq" className="text-link">
            All your questions, answered <ArrowUpRight size={17} />
          </Link>
        </Reveal>
        <div className="faq-list">
          {[
            [
              'Is this really a blind date?',
              'Yes. You’ll receive anonymous, consented compatibility highlights, but no photos, full names or contact details. Both people independently accept before we coordinate a date.',
            ],
            [
              'Who can join the club?',
              'Adults aged 18+ currently residing in Sri Lanka. We review eligibility and residency; a +94 phone number alone does not prove residence. Colombo bookings launch first, with a Sri Lanka-only waitlist for other districts.',
            ],
            [
              'What if I’m a little nervous?',
              'That’s completely normal. Dates are coordinated at vetted public venues. Read our safety guide, tell a trusted friend about your plans, and leave whenever you feel uncomfortable.',
            ],
            [
              'Are food and drinks included?',
              'Our package price covers matchmaking and coordination. Food, drinks and venue charges are additional and must be agreed before payment.',
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="container cta-wrap">
        <Reveal className="cta">
          <Sparkles className="cta-spark" />
          <span className="eyebrow">YOUR NEXT CHAPTER IS STILL UNWRITTEN</span>
          <h2>
            Let’s leave a little
            <br />
            room for <em>serendipity.</em>
          </h2>
          <p>Someone new. Somewhere lovely. Something real.</p>
          <Link href="/signup" className="button button-cream">
            Find my mystery match <ArrowUpRight size={18} />
          </Link>
          <span className="tiny">Made for Sri Lanka. Starting in Colombo. Always 18+.</span>
        </Reveal>
      </section>
    </>
  );
}
