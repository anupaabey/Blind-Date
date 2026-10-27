'use client';
import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowUpRight, ShieldCheck, LockKeyhole } from 'lucide-react';
import { provinces, citiesFor, districts } from '@/lib/locations';
import { genders } from '@/lib/questions';
import {
  signUp,
  login,
  recover,
  resetPassword,
  sendPhoneOtp,
  verifyPhoneOtp,
  deleteAccount,
  bookDate,
  contactAction,
  venueAction,
  residenceAction,
} from '@/app/actions';
export function Submit({
  children = 'Continue',
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} className={className} type="submit">
      {pending ? 'One moment…' : children}
      {!pending && <ArrowUpRight size={16} />}
    </Button>
  );
}
export function FormMessage({ state }: { state: { error?: string; success?: string } }) {
  return state.error ? (
    <div className="notice error" role="alert">
      {state.error}
    </div>
  ) : state.success ? (
    <div className="notice success" role="status">
      {state.success}
    </div>
  ) : null;
}
export function LocationFields() {
  const [province, setProvince] = useState('Western');
  const [district, setDistrict] = useState('Colombo');
  const [city, setCity] = useState('Colombo');
  const ds = Object.keys(provinces[province as keyof typeof provinces]);
  return (
    <>
      <input type="hidden" name="country" value="LK" />
      <label className="field">
        <span>Country</span>
        <input value="Sri Lanka" readOnly aria-label="Country: Sri Lanka only" />
      </label>
      <label className="field">
        <span>Province</span>
        <select
          name="province"
          value={province}
          onChange={(e) => {
            const p = e.target.value;
            const d = Object.keys(provinces[p as keyof typeof provinces])[0];
            setProvince(p);
            setDistrict(d);
            setCity(citiesFor(d)[0]);
          }}
        >
          {Object.keys(provinces).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label className="field">
          <span>District</span>
          <select
            name="district"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setCity(citiesFor(e.target.value)[0]);
            }}
          >
            {ds.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>City or town</span>
          <select name="city" value={city} onChange={(e) => setCity(e.target.value)}>
            {citiesFor(district).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      {district !== 'Colombo' && (
        <div className="notice">
          You’re welcome here. {district} is on our Sri Lanka-only waitlist; bookings currently
          launch in Colombo.
        </div>
      )}
    </>
  );
}
export function SignupForm({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState(signUp, {});
  const [values, setValues] = useState({
    first_name: '',
    dob: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    resident: false,
    consent: false,
  });
  const bind = (key: 'first_name' | 'dob' | 'email' | 'password' | 'phone' | 'gender') => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
  });
  useEffect(() => {
    if (state.success) setValues((v) => ({ ...v, password: '' }));
  }, [state.success]);
  return (
    <form action={action}>
      <FormMessage state={state} />
      {!enabled && (
        <div className="notice">
          Registration is not open yet. Account services must be connected before you can join.
        </div>
      )}
      <div className="form-grid">
        <label className="field">
          <span>First name</span>
          <input
            name="first_name"
            {...bind('first_name')}
            autoComplete="given-name"
            placeholder="Your first name"
            required
            minLength={2}
            maxLength={60}
          />
        </label>
        <label className="field">
          <span>Date of birth · 18+ only</span>
          <input name="dob" {...bind('dob')} type="date" required autoComplete="bday" />
        </label>
      </div>
      <label className="field">
        <span>Email address</span>
        <input
          name="email"
          {...bind('email')}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="field">
        <span>Create a password</span>
        <input
          name="password"
          {...bind('password')}
          type="password"
          placeholder="At least 12 characters"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
        />
      </label>
      <div className="form-grid">
        <label className="field">
          <span>Sri Lankan mobile number</span>
          <input
            name="phone"
            {...bind('phone')}
            type="tel"
            autoComplete="tel"
            placeholder="+94 77 123 4567"
            required
          />
        </label>
        <label className="field">
          <span>Gender identity</span>
          <select name="gender" required {...bind('gender')}>
            <option value="" disabled>
              Select your identity
            </option>
            {genders.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      <LocationFields />
      <p className="form-hint">
        Our town list is curated. If your town is missing, contact us before applying; please don’t
        select an inaccurate address. Your exact location is never shown to a match.
      </p>
      <label className="check-label">
        <input
          type="checkbox"
          name="resident"
          required
          checked={values.resident}
          onChange={(e) => setValues((v) => ({ ...v, resident: e.target.checked }))}
        />
        <span>
          I am 18+ and currently reside in Sri Lanka. I understand residency is reviewed separately
          from my phone number.
        </span>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          name="consent"
          required
          checked={values.consent}
          onChange={(e) => setValues((v) => ({ ...v, consent: e.target.checked }))}
        />
        <span>
          I agree to the <Link href="/terms">Terms</Link> and{' '}
          <Link href="/privacy">Privacy Policy</Link>, and understand how my information is used for
          matchmaking.
        </span>
      </label>
      <fieldset disabled={!enabled} className="border-0 p-0">
        <Submit className="full-width">Create my account</Submit>
      </fieldset>
      <p className="form-bottom">
        Already in the club? <Link href="/login">Log in</Link>
      </p>
      <span className="privacy-label">
        <LockKeyhole size={13} /> Your profile is private. Always.
      </span>
    </form>
  );
}
export function LoginForm({ enabled = true }: { enabled?: boolean }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action}>
      <FormMessage state={state} />
      {!enabled && (
        <div className="notice">
          Account services haven’t been connected yet. Please check back when registration opens.
        </div>
      )}
      <label className="field">
        <span>Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
        />
      </label>
      <div className="text-right mb-5">
        <Link className="text-link" href="/forgot-password">
          Forgot your password?
        </Link>
      </div>
      <fieldset disabled={!enabled} className="border-0 p-0">
        <Submit className="full-width">Welcome back</Submit>
      </fieldset>
      <p className="form-bottom">
        Your story hasn’t started yet? <Link href="/signup">Join the club</Link>
      </p>
    </form>
  );
}
export function RecoveryForm({ reset = false }: { reset?: boolean }) {
  const [state, action] = useActionState(reset ? resetPassword : recover, {});
  return (
    <form action={action}>
      <FormMessage state={state} />
      <label className="field">
        <span>{reset ? 'New password' : 'Your email address'}</span>
        <input
          name={reset ? 'password' : 'email'}
          type={reset ? 'password' : 'email'}
          minLength={reset ? 12 : undefined}
          autoComplete={reset ? 'new-password' : 'email'}
          required
        />
      </label>
      <Submit>{reset ? 'Update password' : 'Send reset link'}</Submit>
    </form>
  );
}
export function PhoneForm() {
  const [state, action] = useActionState(sendPhoneOtp, {});
  const [verified, verify] = useActionState(verifyPhoneOtp, {});
  return (
    <details className="details-form">
      <summary>Verify my phone number</summary>
      <p className="form-hint">
        SMS works only when a provider is configured. No messages are sent otherwise. Phone
        verification does not establish residency.
      </p>
      <form action={action}>
        <FormMessage state={state} />
        <label className="field">
          <span>Registered Sri Lankan mobile number</span>
          <input name="phone" type="tel" required placeholder="+94771234567" />
        </label>
        <Submit>Send code</Submit>
      </form>
      <form action={verify}>
        <FormMessage state={verified} />
        <label className="field">
          <span>Registered phone</span>
          <input name="phone" type="tel" required />
        </label>
        <label className="field">
          <span>Verification code</span>
          <input
            name="token"
            inputMode="numeric"
            minLength={6}
            maxLength={6}
            required
            autoComplete="one-time-code"
          />
        </label>
        <Submit>Verify phone</Submit>
      </form>
    </details>
  );
}
export function DeleteAccount() {
  const [state, action] = useActionState(deleteAccount, {});
  return (
    <details className="details-form">
      <summary>Delete my account permanently</summary>
      <form action={action}>
        <FormMessage state={state} />
        <p className="form-hint">
          This permanently removes your profile, questionnaire, private media and match data.
          De-linked safety and audit records may be retained under the reviewed retention policy.
          This cannot be undone.
        </p>
        <label className="field">
          <span>Current password</span>
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <label className="field">
          <span>Type DELETE to confirm</span>
          <input name="confirmation" pattern="DELETE" required />
        </label>
        <Submit>Delete my account</Submit>
      </form>
    </details>
  );
}
export function BookingForm({
  invitation,
  venues,
  packages,
}: {
  invitation: string;
  packages: { id: string; name: string; price_lkr: number }[];
  venues: { id: string; name: string; city: string; district: string; is_demo: boolean }[];
}) {
  const [state, action] = useActionState(bookDate, {});
  return (
    <form action={action}>
      <FormMessage state={state} />
      <input type="hidden" name="invitation" value={invitation} />
      <label className="field">
        <span>District</span>
        <input value="Colombo, Sri Lanka · launch coverage" readOnly />
      </label>
      <label className="field">
        <span>Available venue</span>
        <select name="venue" required defaultValue="">
          <option value="" disabled>
            Select a vetted venue
          </option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.city}
              {v.is_demo ? ' (fictional demo venue)' : ''}
            </option>
          ))}
        </select>
      </label>
      {venues.length === 0 && (
        <div className="notice">
          There are no active vetted venues available yet. Please check back after our team adds a
          confirmed Sri Lankan partner.
        </div>
      )}
      <label className="field">
        <span>Your experience · per person</span>
        <select name="package">
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · LKR {Number(p.price_lkr).toLocaleString('en-LK')}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label className="field">
          <span>Preferred date</span>
          <input type="date" name="date" required />
        </label>
        <label className="field">
          <span>Preferred time · Sri Lanka</span>
          <input type="time" name="time" min="08:00" max="21:59" required />
        </label>
      </div>
      <p className="form-hint">
        Choose a date 24 hours–90 days ahead. All times are Asia/Colombo (UTC+05:30). Food, drinks
        and venue charges are additional. A request is not a confirmed reservation.
      </p>
      <label className="check-label">
        <input type="checkbox" required />
        <span>
          I understand the package covers matching and coordination. Additional venue costs must be
          agreed before payment.
        </span>
      </label>
      <fieldset disabled={!venues.length || !packages.length} className="border-0 p-0">
        <Submit>Request my date</Submit>
      </fieldset>
    </form>
  );
}
export function ContactForm() {
  const [state, action] = useActionState(contactAction, {});
  return (
    <form action={action}>
      <FormMessage state={state} />
      <label className="field">
        <span>Your name</span>
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
      </label>
      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        <span>How can we help?</span>
        <textarea name="message" required minLength={10} maxLength={3000} />
      </label>
      <div hidden aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="form-hint">
        Please don’t include sensitive identity documents, passwords or payment details. For an
        immediate emergency in Sri Lanka call 119.
      </p>
      <Submit>Send to the club team</Submit>
    </form>
  );
}
export function VenueForm({
  venue,
}: {
  venue?: {
    id: string;
    name: string;
    district: string;
    city: string;
    address: string;
    contact: string;
    active: boolean;
    vetted: boolean;
    is_demo: boolean;
  };
}) {
  const [state, action] = useActionState(venueAction, {});
  const [district, setDistrict] = useState(venue?.district ?? 'Colombo');
  return (
    <form action={action}>
      <FormMessage state={state} />
      <input type="hidden" name="id" value={venue?.id ?? ''} />
      <label className="field">
        <span>Venue name</span>
        <input name="name" required defaultValue={venue?.name} />
      </label>
      <div className="form-grid">
        <label className="field">
          <span>Sri Lankan district</span>
          <select name="district" value={district} onChange={(e) => setDistrict(e.target.value)}>
            {districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>City</span>
          <select name="city" defaultValue={venue?.city}>
            {citiesFor(district).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Public venue address</span>
        <input name="address" required defaultValue={venue?.address} />
      </label>
      <label className="field">
        <span>Reservation contact · admin only</span>
        <input name="contact" required defaultValue={venue?.contact} />
      </label>
      <label className="check-label">
        <input type="checkbox" name="vetted" defaultChecked={venue?.vetted} />I have vetted this
        public venue for safety and verified its location.
      </label>
      <label className="check-label">
        <input type="checkbox" name="active" defaultChecked={venue?.active} />
        Activate for bookings (district coverage must also be active).
      </label>
      {!venue && (
        <label className="check-label">
          <input type="checkbox" name="is_demo" />
          Fictional demo venue, visible to demo accounts only.
        </label>
      )}
      <Submit>Save venue</Submit>
    </form>
  );
}

export function ResidenceForm() {
  const [state, action] = useActionState(residenceAction, {});
  return (
    <details className="details-form">
      <summary>Update my Sri Lankan residence</summary>
      <form action={action}>
        <FormMessage state={state} />
        <p className="form-hint">
          A location change pauses matching for a fresh review and cancels active date requests.
          Paid dates enter refund review. For a permanent move overseas, pause matching and contact
          support instead.
        </p>
        <LocationFields />
        <label className="check-label">
          <input type="checkbox" required />I currently reside in the selected Sri Lankan town.
        </label>
        <Submit>Update residence</Submit>
      </form>
    </details>
  );
}
