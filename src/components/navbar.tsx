'use client';

import * as React from 'react';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { ExternalLink } from 'lucide-react';
import { OFFICIAL_PORTAL_URL } from '@/lib/ignou-grade-card';
import { Logo } from '@/components/logo';

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[backdrop-filter,background,border] duration-300 ${
        scrolled
          ? 'border-b border-card-edge bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-12">
        {/* Brand */}
        <Logo />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a
            href={OFFICIAL_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-brand dark:text-neutral-400 dark:hover:text-brand transition-colors"
          >
            Official Portal
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
}
