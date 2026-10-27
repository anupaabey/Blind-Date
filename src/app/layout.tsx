import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Blind Date Club — A little mystery. A real connection.',
    template: '%s · Blind Date Club',
  },
  description:
    'We find your match. We plan your date. You just show up. A thoughtful blind dating experience for adults residing in Sri Lanka, starting in Colombo.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
