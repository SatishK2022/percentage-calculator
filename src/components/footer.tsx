import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { OFFICIAL_PORTAL_URL } from '@/lib/ignou-grade-card';

export function Footer() {
  return (
    <footer className="relative mt-20 px-6 font-montserrat text-xs text-neutral-500 sm:px-12 before:absolute before:top-0 before:left-1/2 before:h-px before:w-full before:max-w-[1440px] before:-translate-x-1/2 before:bg-amber-600 before:opacity-10 before:[mask-image:linear-gradient(90deg,transparent_0%,black_40%,black_60%,transparent_100%)] dark:before:bg-orange-300 pb-12 pt-8">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">
            IGNOU Percentage Calculator
          </p>
          <p className="text-[11px] text-neutral-500">
            Calculated using official IGNOU evaluation and credit rules.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px]">
          <a
            href={OFFICIAL_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-brand transition-colors"
          >
            Official IGNOU Portal <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
