import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container section text-center">
      <span className="eyebrow">A LITTLE TOO MUCH MYSTERY</span>
      <h1 className="mt-5">This page wandered off.</h1>
      <p className="mt-5">Let’s get you back to a good beginning.</p>
      <Link className="button button-primary mt-7" href="/">
        Back to the club
      </Link>
    </div>
  );
}
