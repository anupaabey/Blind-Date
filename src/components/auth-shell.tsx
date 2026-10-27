import { ShieldCheck, MapPin, Heart } from 'lucide-react';
export function AuthShell({
  children,
  title = 'A little mystery.\nA real possibility.',
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <span className="eyebrow">YOUR STORY DESERVES A BEAUTIFUL BEGINNING</span>
        <h1>
          {title.split('\n').map((s, i) => (
            <span key={s}>
              {i > 0 && <br />}
              {i > 0 ? <em>{s}</em> : s}
            </span>
          ))}
        </h1>
        <p>
          We find your match. We plan your date.
          <br />
          You just show up, as yourself.
        </p>
        <div className="auth-points">
          <span>
            <ShieldCheck size={17} /> Private, thoughtful, and consent-led
          </span>
          <span>
            <MapPin size={17} /> Exclusively Sri Lanka · starting in Colombo
          </span>
          <span>
            <Heart size={17} /> Real people. Reviewed connections.
          </span>
        </div>
      </aside>
      <div className="auth-main">{children}</div>
    </div>
  );
}
