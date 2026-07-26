'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { navLinks } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-70 transition-colors duration-500',
        scrolled ? 'bg-void-950/80 backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <div className="padding-x flex items-center justify-between py-5">
        <Link
          href="/#top"
          className="font-title text-sm tracking-[0.2em] text-paper-500 uppercase"
        >
          Lokesh Ram Chand
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.url}
              className="text-sm text-paper-200 transition-colors hover:text-amber-400"
              data-cursor="hover"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <a
          href="#contact"
          className="hidden rounded-full border border-paper-500/20 px-4 py-2 text-xs tracking-wide text-paper-300 transition-colors hover:border-amber-400 hover:text-amber-400 md:inline-block"
          data-cursor="hover"
        >
          Available for work
        </a>
      </div>
    </header>
  );
}
