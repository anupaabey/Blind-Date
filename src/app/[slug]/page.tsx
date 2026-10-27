import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight,
  ShieldCheck,
  Heart,
  MapPin,
  LockKeyhole,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { Pricing } from '@/components/pricing';
import { ContactForm } from '@/components/forms';
const pages: Record<string, { title: string; eyebrow: string; description: string }> = {
  'how-it-works': {
    title: 'A little mystery. A lot of intention.',
    eyebrow: 'THE BLIND DATE CLUB EXPERIENCE',
    description:
      'We find your match. We plan your date. You just show up. Here’s what happens between your first hello and your first date.',
  },
  about: {
    title: 'Connection, a little closer to home.',
    eyebrow: 'OUR STORY',
    description:
      'Blind Date Club is being built for people currently living in Sri Lanka who would rather meet with intention than spend another evening swiping.',
  },
  pricing: {
    title: 'Your first date. Thoughtfully curated.',
    eyebrow: 'DATE PACKAGES · LKR ONLY',
    description:
      'One coordination fee per person. No subscription. Food, drinks and venue charges are additional and agreed separately before payment.',
  },
  faq: {
    title: 'A little curious? You’re in good company.',
    eyebrow: 'QUESTIONS & ANSWERS',
    description:
      'Everything you might be wondering before you leave a little room for possibility.',
  },
  safety: {
    title: 'Your comfort always comes first.',
    eyebrow: 'DATING SAFETY',
    description:
      'A little mystery should never mean uncertainty about your safety. Take things at your own pace, and trust your instincts.',
  },
  contact: {
    title: 'Let’s start a conversation.',
    eyebrow: 'SAY HELLO',
    description:
      'Questions, accessibility needs, a missing Sri Lankan town, or a venue partnership? Our team would love to hear from you.',
  },
  privacy: {
    title: 'Your story belongs to you.',
    eyebrow: 'PRIVACY POLICY · DRAFT',
    description:
      'A transparent explanation of the information needed for our Sri Lanka-only matchmaking service, how it is used, and the choices you control.',
  },
  terms: {
    title: 'A thoughtful experience, on clear terms.',
    eyebrow: 'TERMS & CONDITIONS · DRAFT',
    description:
      'The terms below are proposed operating terms and must be professionally reviewed before a public launch.',
  },
  refunds: {
    title: 'When plans need to change.',
    eyebrow: 'REFUND POLICY · DRAFT',
    description:
      'Our proposed cancellation and refund approach. This policy requires legal and merchant review before live payments are enabled.',
  },
};
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: pages[slug]?.eyebrow ?? 'Not found' };
}
const faqs = [
  [
    'Who can join?',
    'Adults 18+ currently residing in Sri Lanka, irrespective of nationality or ethnicity. You need a valid email, a Sri Lankan mobile number, a listed Sri Lankan town and an affirmative residency declaration. The team separately reviews eligibility.',
  ],
  [
    'Which districts are available?',
    'Registration supports all 25 Sri Lankan districts. Bookings initially operate in Colombo only. Other districts join a clearly labeled Sri Lanka-only waitlist. We do not offer international dates.',
  ],
  [
    'Can I use my account while traveling?',
    'Yes. Temporarily being overseas does not lock you out. Dates still take place exclusively in Sri Lanka and current residency eligibility continues to apply. Tell our team if your residence changes.',
  ],
  [
    'How does compatibility work?',
    'First, mutual age and gender preferences, adult status, residency review, intentions, location and distance preferences, dealbreakers and safety exclusions must pass. We compare your actual questionnaire responses using values 35%, interests 25%, lifestyle 20%, and personality and communication 20%. A team member reviews suggestions. Scores are not a scientific prediction of romantic success.',
  ],
  [
    'When will I see a name or photograph?',
    'Invitations contain only consented anonymous highlights. Full names, photos, exact towns, contact details and private answers remain hidden. After a completed date, first names and emails are exchanged only if both participants independently say they felt safe, want another date and consent to exchange.',
  ],
  [
    'What happens if one person declines?',
    'The invitation closes. We do not disclose their private reason or feedback. An invitation can also expire after the time shown in your dashboard.',
  ],
  [
    'Does paying guarantee a match or a relationship?',
    'No. Packages cover the coordination services described at checkout. We cannot guarantee mutual acceptance, romantic chemistry or a relationship. A payment does not itself confirm a venue booking.',
  ],
  [
    'Are food and drinks included?',
    'No. Our fee covers matchmaking and coordination. Food, drinks and any venue charges are additional. Confirm those costs with the team before payment.',
  ],
  [
    'Can I reschedule or cancel?',
    'Yes, use your dashboard while a booking is requested or confirmed. Rescheduling returns it to pending venue coordination. Paid cancellations are marked for refund review; refunds are not automatically approved or completed. Read the draft refund policy.',
  ],
  [
    'How do I report a concern?',
    'Use “Report a concern or block this match” on an invitation in your dashboard. Blocking prevents further matching and closes that invitation; pending date requests are cancelled and paid transactions enter refund review. Contact us for other concerns. In an emergency in Sri Lanka, call 119.',
  ],
  [
    'Is phone verification required?',
    'Sri Lankan mobile numbers are validated and stored in +94 format. An SMS OTP can be verified where a provider is configured. Email verification and a separate human residency review are required for matching. A phone number alone does not prove residence.',
  ],
  [
    'Are the sample stories real?',
    'We do not publish invented success stories or member counts. The illustrative match on our home page is a design example, not a real member or a compatibility claim. Fictional test accounts are labeled DEMO and separated from real matching.',
  ],
];
const draft = (
  <div className="legal-draft">
    <strong>Draft for professional review · Updated 27 October 2026.</strong>
    <br />
    This document is not legal advice and is not a statement of verified legal compliance. Obtain
    Sri Lankan legal review under the Personal Data Protection Act and relevant amendments, consumer
    protection obligations, payment-provider rules and any applicable commencement requirements
    before launch. The operating legal entity, contact address, retention schedule and dispute
    process must be finalized.
  </div>
);
export default async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <div className="container content-page">
      <div className="page-heading">
        <span className="eyebrow">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      {slug === 'pricing' && (
        <>
          <Pricing />
          <p className="section-note">
            Live payments require an approved Sri Lankan merchant account. Until configured,
            checkout is unavailable. Sandbox transactions are always identified as test payments.
          </p>
          <div className="notice mt-8">
            Bookings require mutual acceptance and an available vetted Sri Lankan venue. A
            reservation is confirmed only after our team coordinates it with the venue.
          </div>
        </>
      )}
      {slug === 'how-it-works' && (
        <>
          <div className="info-grid">
            {[
              [
                '01',
                'Your story first',
                'Create an account, verify your email and declare your current Sri Lankan residence. Tell us your preferences and answer 24 carefully written compatibility questions.',
              ],
              [
                '02',
                'A thoughtful introduction',
                'We apply hard mutual eligibility and safety rules, compare your questionnaire answers, and have a person review the pairing. Only consented anonymous highlights appear in your invitation.',
              ],
              [
                '03',
                'A yes from both of you',
                'Independently accept your invitation before it expires. Neither person’s identity, contact details or private answers are revealed. Both must accept before booking unlocks.',
              ],
              [
                '04',
                'A date with a little intention',
                'Choose an available vetted public Colombo venue, package and preferred time. We coordinate the request. Only a human administrator can confirm a venue reservation.',
              ],
              [
                '05',
                'A secure payment',
                'Review LKR pricing and additional venue costs. Payment is handled by the configured gateway. A verified server callback creates the payment receipt; a return page never marks a payment successful.',
              ],
              [
                '06',
                'Your next chapter, your choice',
                'After your completed date, share private feedback. First names and account emails are exchanged only after both people feel safe, want another date and independently consent.',
              ],
            ].map(([n, t, b]) => (
              <article className="panel" key={n}>
                <span className="eyebrow">CHAPTER {n}</span>
                <h3 className="mt-4">{t}</h3>
                <p>{b}</p>
              </article>
            ))}
          </div>
          <Link className="button button-primary mt-8" href="/signup">
            Let’s begin <ArrowUpRight size={16} />
          </Link>
        </>
      )}
      {slug === 'about' && (
        <div className="prose">
          <h2>More presence. A little less scrolling.</h2>
          <p>
            We believe meeting someone new can feel more personal than browsing a catalogue of
            faces. Blind Date Club puts your values, interests and preferences at the beginning of
            the story.
          </p>
          <p>
            Our experience is intentionally local: for adults currently residing in Sri Lanka,
            beginning in Colombo and designed to grow across all 25 districts. Residency, rather
            than citizenship, ethnicity, name or language, determines eligibility.
          </p>
          <h2>Human judgment, supported by thoughtful tools.</h2>
          <p>
            Questionnaire similarity helps us suggest pairs. It never replaces your choice, our
            eligibility review, or the simple fact that a connection has to be discovered in person.
            We make no promises of chemistry or a relationship.
          </p>
          <h2>A club built around consent.</h2>
          <p>
            No public member directory. No automatic photo reveals. No private feedback sent to
            another member. Every step is designed to give you space to choose what feels right.
          </p>
          <div className="notice">
            We’re preparing our first Colombo experiences. Real venue partnerships and live payment
            availability must be confirmed before dates are sold. Illustrations and demo accounts
            are clearly labeled.
          </div>
          <Link className="text-link" href="/signup">
            Find your kind of possibility <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
      {slug === 'faq' && (
        <div className="faq-list max-w-3xl">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      )}
      {slug === 'safety' && (
        <>
          <div className="notice">
            If you are in immediate danger in Sri Lanka, call Police Emergency 119. For emergency
            ambulance assistance, call 1990. The club is not an emergency response service.
          </div>
          <div className="info-grid">
            {[
              [
                ShieldCheck,
                'Meet in public',
                'Choose a vetted, public venue and remain in public spaces. Staff may be nearby, but venue vetting does not guarantee safety.',
              ],
              [
                MapPin,
                'Keep someone in the loop',
                'Tell a trusted person where you are going and when you expect to return. Arrange your own transport and keep control of your journey home.',
              ],
              [
                LockKeyhole,
                'Share slowly',
                'Keep your home address, financial information, passwords, identity documents and intimate information private. Never send money to a match.',
              ],
              [
                Heart,
                'Your boundaries are enough',
                'A date or payment never creates an obligation to stay, share contact details, drink, be physically intimate or meet again. You can leave at any time.',
              ],
              [
                Coffee,
                'Stay aware',
                'Watch your drinks and belongings. Avoid feeling pressured to consume alcohol. If something feels wrong, leave and seek assistance.',
              ],
              [
                Sparkles,
                'Tell us about a concern',
                'Report or block through your invitation. Reports are reviewed privately. Blocking prevents future pairing, closes the invitation and cancels pending dates; it is not a substitute for emergency support.',
              ],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <article className="panel" key={title as string}>
                  <I className="text-[var(--primary)] mb-5" size={24} />
                  <h3>{title as string}</h3>
                  <p>{body as string}</p>
                </article>
              );
            })}
          </div>
          <div className="prose">
            <h2>Our safety approach</h2>
            <p>
              Adults only, verified email, proportionate residency review, private profiles, mutual
              preferences, human-reviewed invitations, independent consent, public venues, private
              feedback and an auditable reporting process. We minimize identity-document collection
              and do not use geolocation as proof of residence.
            </p>
            <p>
              We cannot verify every statement or guarantee anyone’s behavior. Please keep your own
              safety plan. If a concern relates to someone outside your current invitations, send
              our team a message.
            </p>
            <Link className="text-link" href="/contact">
              Contact our team <ArrowUpRight size={16} />
            </Link>
          </div>
        </>
      )}
      {slug === 'contact' && (
        <div className="booking-layout">
          <div className="panel">
            <ContactForm />
          </div>
          <aside className="panel h-fit">
            <h3>Here for a good beginning.</h3>
            <p>
              Use this form for registration help, accessibility, venue enquiries and privacy
              requests. Messages are saved privately for our administrators.
            </p>
            <div className="divider" />
            <p>
              Already have an account? Report an invitation directly in your dashboard so our team
              can review the right context.
            </p>
            <Link className="text-link" href="/dashboard">
              Go to my dashboard
            </Link>
            <p className="form-hint">
              Do not use this form for emergencies. We do not promise an immediate response.
            </p>
          </aside>
        </div>
      )}
      {['privacy', 'terms', 'refunds'].includes(slug) && (
        <div className="prose">
          {draft}
          {slug === 'privacy' && (
            <>
              <h2>1. Information we collect</h2>
              <p>
                Account email, first and display names, hashed authentication credentials managed by
                Supabase Auth, date of birth, gender identity, normalized Sri Lankan mobile number,
                district and town, residence declaration, dating preferences, interests,
                compatibility answers and your consent choices. Optional occupation and introduction
                are not required. Booking, payment references, support messages, private feedback,
                blocks and safety reports are stored when you use those features. We do not store
                card credentials.
              </p>
              <h2>2. Why we use it</h2>
              <p>
                To verify adult and residency eligibility, provide secure accounts, recommend
                mutually compatible Sri Lankan matches, obtain independent decisions, coordinate
                bookings, verify LKR payments, send transactional updates and investigate safety
                concerns. Dating preferences and answers can be sensitive. We seek explicit consent
                and limit their use to the service. We do not infer citizenship or ethnicity from
                your information.
              </p>
              <h2>3. What another member can see</h2>
              <p>
                No public profiles or member directory. Invitations show only the broad age range,
                district, shared interests and score you choose to share. Full name, photographs,
                exact town, private answers and contact details are hidden. After a completed date,
                only your first name and account email can be exchanged, and only if both members
                independently report feeling safe, want another date and explicitly consent. Your
                private rejection or feedback is never disclosed.
              </p>
              <h2>4. Service providers and international processing</h2>
              <p>
                The planned providers are Supabase for authentication, PostgreSQL and private
                storage; Vercel for hosting; a configured email provider for transactional messages;
                and an approved Sri Lankan payment gateway such as PayHere. Providers may process
                data outside Sri Lanka even though matching and dates are Sri Lanka-only. A
                deployment-specific assessment of processing locations, transfer safeguards,
                contracts and legally required disclosures must be completed before launch. No
                marketing emails are enabled by default.
              </p>
              <h2>5. Retention and your choices</h2>
              <p>
                Manage anonymous sharing in your profile and request deletion in your dashboard by
                confirming your password. Deletion removes the authentication account, profile,
                answers, invitations, bookings and private media. Minimal de-linked safety and admin
                audit records may remain. Financial amount, currency, gateway and order references
                are retained without a profile or booking link after account deletion. Retained
                report context may contain information provided by members; an operator must review
                redaction and retention obligations. Final retention periods and legal obligations
                must be reviewed before accepting real money. Contact our team for access,
                correction, export, withdrawal, restriction or complaints. The final retention
                periods, legal basis, responsible entity and any required data protection contact
                must be published before launch.
              </p>
              <h2>6. Security and cookies</h2>
              <p>
                We use row level security, server authorization, private media, secure session
                cookies in production, minimized anonymous invitation data and admin audit trails.
                Essential cookies keep you signed in. Local storage remembers your light or dark
                theme. No advertising or third-party tracking cookies are included. No system can
                promise absolute security. Do not upload sensitive identity documents.
              </p>
              <h2>7. Adults and residency</h2>
              <p>
                The service accepts only adults aged 18+ currently residing in Sri Lanka. Users may
                access accounts while temporarily traveling. Dates remain restricted to approved Sri
                Lankan venues. Contact us if your residence changes or you believe an ineligible
                account exists.
              </p>
            </>
          )}
          {slug === 'terms' && (
            <>
              <h2>1. Eligibility and truthful information</h2>
              <p>
                You must be 18 or older and currently reside in Sri Lanka. Registration, location,
                contact information, preferences and declarations must be accurate. Nationality or
                ethnicity is not an eligibility criterion. We review residency proportionately and
                may pause an account when eligibility cannot be confirmed. Travel abroad does not
                itself remove account access; it never permits an overseas date.
              </p>
              <h2>2. What the service provides</h2>
              <p>
                We compare questionnaire responses, review recommendations, seek independent
                acceptance and coordinate dates at vetted public Sri Lankan venues. Questionnaire
                scores describe similarity, not scientific proof or a guarantee of compatibility,
                safety, a match, a date or a relationship. A booking request is not a reservation
                until an administrator confirms coordination with the venue.
              </p>
              <h2>3. Pricing and payments</h2>
              <p>
                All coordination fees use LKR and are charged per person. Food, drinks and venue
                charges are additional unless expressly stated and agreed. Card details are handled
                by the gateway. Test-mode payments are labeled; they do not represent actual funds.
                Gateway approval, legally reviewed terms and an operating entity are required before
                accepting live payments.
              </p>
              <h2>4. Respect, consent and prohibited conduct</h2>
              <p>
                No harassment, coercion, discrimination, impersonation, scams, sexual exploitation,
                threats, stalking, disclosure of another member’s private information or attempts to
                evade blocks or suspension. Consent to a match or payment is never consent to
                intimacy, contact exchange or another date. You may decline, leave, report or block.
                Serious concerns can lead to suspension and referral to appropriate authorities
                where required.
              </p>
              <h2>5. Privacy and account control</h2>
              <p>
                Read our Privacy Policy. Keep your password private and report compromised access.
                You may edit your questionnaire and sharing choices, request support, and delete
                your account. Admins can access only the information needed to operate and review
                the service; actions are audited.
              </p>
              <h2>6. Changes, cancellation and disputes</h2>
              <p>
                Use the dashboard to request rescheduling or cancellation and read the Refund
                Policy. We will disclose material changes to fees or service terms before they
                apply. Applicable Sri Lankan consumer rights are not waived. The legal operator,
                service address, complaint escalation, governing law and dispute process require
                professional review and must be completed before public launch.
              </p>
            </>
          )}
          {slug === 'refunds' && (
            <>
              <h2>1. What a coordination fee covers</h2>
              <p>
                Packages pay for the described matchmaking and date-coordination services. Meals,
                drinks and venue fees are additional. Those providers’ separate charges and
                cancellation conditions must be disclosed before the user agrees or pays.
              </p>
              <h2>2. Before a venue confirms</h2>
              <p>
                You can cancel a requested booking in your dashboard. Paid transactions are marked
                “refund requested” for review. Our proposed policy is to refund an unused
                coordination fee where a date cannot be coordinated, subject to final legal and
                merchant terms. No automatic deduction or promise of a processed refund is made in
                this MVP.
              </p>
              <h2>3. After a venue confirms</h2>
              <p>
                You may request a different time or cancel. Rescheduling returns a reservation to
                pending coordination. Any genuine nonrecoverable third-party charges must have been
                disclosed and agreed before payment and assessed under applicable consumer law. The
                operator must finalize notice windows, charges and no-show terms before launch; the
                current app does not impose a cancellation fee.
              </p>
              <h2>4. Safety-related cancellations</h2>
              <p>
                Contact the team or report through the dashboard. Blocking closes the invitation and
                cancels pending or confirmed date requests. Paid transactions enter private refund
                review. Safety reporting must not require a member to attend a date or disclose
                their report to the other participant.
              </p>
              <h2>5. How a refund is recorded</h2>
              <p>
                Cancellation and a “refund requested” label do not return funds. The operator must
                actually process the refund in the merchant gateway, verify the outcome, then record
                its reference. Original payment method, gateway processing times and notification
                details must be communicated for each real refund. Sandbox test records do not
                involve real money.
              </p>
              <h2>6. Get help</h2>
              <p>
                Send a private support request with your order reference. Never send full card
                details. Final response targets, escalation steps, statutory rights, business
                contact details and dispute procedures must be reviewed and published before live
                checkout.
              </p>
              <Link className="text-link" href="/contact">
                Contact the club team <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
