'use client';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container section">
      <h2>We couldn’t load this chapter.</h2>
      <p className="mt-5">
        An account or database service may be temporarily unavailable. Your private information
        stays protected.
      </p>
      <button className="button button-primary mt-7" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
