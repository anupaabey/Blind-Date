'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X, Moon, Sun, Sparkles } from 'lucide-react';
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const enabled = localStorage.getItem('bdc-theme') === 'dark';
    setDark(enabled);
    document.documentElement.dataset.theme = enabled ? 'dark' : 'light';
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('bdc-theme', next ? 'dark' : 'light');
  }
  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand" aria-label="Blind Date Club home">
          <span className="brand-mark">
            <Sparkles size={23} />
          </span>
          <span>
            blind date<span className="brand-club">CLUB · SRI LANKA</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className={open ? 'nav-links nav-open' : 'nav-links'}>
          <Link href="/how-it-works" onClick={() => setOpen(false)}>
            The experience
          </Link>
          <Link href="/pricing" onClick={() => setOpen(false)}>
            Date packages
          </Link>
          <Link href="/safety" onClick={() => setOpen(false)}>
            Your safety
          </Link>
          <Link href="/about" onClick={() => setOpen(false)}>
            Our story
          </Link>
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button"
            onClick={toggle}
            aria-label={dark ? 'Use light theme' : 'Use dark theme'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/login" className="login-link">
            Log in
          </Link>
          <Link href="/signup" className="button button-primary button-sm">
            Join the club <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-button mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
