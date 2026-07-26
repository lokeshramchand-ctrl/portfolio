'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { navLinks, socialLinks } from '@/lib/data';
import { cn } from '@/lib/utils';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

function BurgerButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? 'Close menu' : 'Open menu'}
      className="relative z-70 flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
    >
      <span
        className={cn(
          'block h-px w-6 bg-paper-500 transition-transform duration-300',
          open && 'translate-y-[6.5px] rotate-45',
        )}
      />
      <span
        className={cn(
          'block h-px w-6 bg-paper-500 transition-transform duration-300',
          open && '-translate-y-[6.5px] -rotate-45',
        )}
      />
    </button>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (open) {
      document.documentElement.classList.add('overflow-hidden');
      window.__lenis?.stop();
      if (!prefersReducedMotion()) {
        const items = panel.querySelectorAll('[data-menu-item]');
        gsap.set(items, { autoAlpha: 0, y: 16 });
        gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
      }
    } else {
      document.documentElement.classList.remove('overflow-hidden');
      window.__lenis?.start();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      id="mobile-menu"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-60 flex flex-col justify-between bg-void-950 px-6 pt-28 pb-12 transition-opacity duration-300 md:hidden',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <nav aria-label="Mobile">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.label} data-menu-item>
              <Link
                href={link.url}
                onClick={onClose}
                className="font-title heading-3 block text-paper-500 transition-colors hover:text-amber-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div data-menu-item className="flex gap-6 border-t border-paper-500/10 pt-6">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-paper-300 hover:text-amber-400"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        (scrolled || open) && 'bg-void-950/80 backdrop-blur-md',
      )}
    >
      <div className="padding-x flex items-center justify-between py-5">
        <Link
          href="/#top"
          onClick={() => setOpen(false)}
          className="font-title text-sm tracking-[0.2em] text-paper-500 uppercase"
        >
          Lokesh Ram Chand
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
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
        <BurgerButton open={open} onClick={() => setOpen((v) => !v)} />
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
