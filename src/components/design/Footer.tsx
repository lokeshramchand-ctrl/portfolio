'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { navLinks, socialLinks, resourceLinks, siteConfig } from '@/lib/data';

function formatClock(timeZone?: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date());
}

function useClock(timeZone?: string) {
  // Empty on the server and on first client render so hydration matches;
  // the real, timezone-dependent value can only be known client-side.
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only value, cannot be computed during SSR/hydration
    setTime(formatClock(timeZone));
    const id = setInterval(() => setTime(formatClock(timeZone)), 1000 * 30);
    return () => clearInterval(id);
  }, [timeZone]);

  return time;
}

export default function Footer() {
  const localTime = useClock(siteConfig.timezone);
  const visitorTime = useClock();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-paper-500/10 bg-void-950">
      <div className="padding-x grid gap-12 py-16 md:grid-cols-4">
        <div>
          <p className="font-title text-lg text-paper-500">Lokesh Ram Chand</p>
          <p className="mt-3 max-w-xs text-sm text-paper-200">{siteConfig.locationCountry}</p>
          <p className="font-mono text-xs text-paper-100">{siteConfig.locationPlace}</p>
        </div>

        <div>
          <p className="text-xs tracking-widest text-paper-100 uppercase">Menu</p>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.url}
                  className="text-sm text-paper-300 transition-colors hover:text-amber-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-widest text-paper-100 uppercase">Elsewhere</p>
          <ul className="mt-4 space-y-2">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-paper-300 transition-colors hover:text-amber-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
            {resourceLinks
              .filter((r) => r.label === 'Resume')
              .map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-paper-300 transition-colors hover:text-amber-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-widest text-paper-100 uppercase">Local time</p>
          <p className="mt-4 font-mono text-sm text-paper-300">
            {localTime || '--:--'} <span className="text-paper-100">Lokesh</span>
          </p>
          <p className="mt-1 font-mono text-sm text-paper-300">
            {visitorTime || '--:--'} <span className="text-paper-100">You</span>
          </p>
        </div>
      </div>
      <div className="padding-x flex flex-col items-start justify-between gap-2 border-t border-paper-500/10 py-6 text-xs text-paper-100 md:flex-row md:items-center">
        <p>© {year} Lokesh Ram Chand — All rights reserved.</p>
        <a href={`mailto:${siteConfig.email}`} className="hover:text-amber-400">
          {siteConfig.email}
        </a>
      </div>
    </footer>
  );
}
