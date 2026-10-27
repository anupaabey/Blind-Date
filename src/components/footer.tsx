import Link from 'next/link';
import { ArrowUpRight, Sparkles, Heart } from 'lucide-react';
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link href="/" className="brand">
              <Sparkles />
              <span>
                blind date<span className="brand-club">CLUB · SRI LANKA</span>
              </span>
            </Link>
            <p>
              A little less swiping.
              <br />A little more serendipity.
            </p>
          </div>
          <div>
            <span className="eyebrow">THE CLUB</span>
            <Link href="/about">Our story</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Date packages</Link>
          </div>
          <div>
            <span className="eyebrow">HERE FOR YOU</span>
            <Link href="/safety">Dating safety</Link>
            <Link href="/faq">Questions & answers</Link>
            <Link href="/contact">
              Get in touch <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="footer-note">
            <span className="pill">
              <span className="status-dot" /> EXCLUSIVELY SRI LANKA
            </span>
            <p>
              For adults 18+ currently living in Sri Lanka.
              <br />
              Thoughtfully starting in Colombo.
            </p>
            <span className="tiny">English · සිංහල & தமிழ் coming later</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Blind Date Club. Made with <Heart size={12} /> in Sri
            Lanka.
          </span>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refunds">Refund policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
