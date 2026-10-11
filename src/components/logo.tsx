'use client';

import * as React from 'react';

interface LogoProps {
  showText?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-card-edge bg-card-fill transition-colors hover:border-card-edge-hover ${className}`}
      aria-hidden="true"
    >
      <svg
        className="size-5"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Academic Mortarboard Top Cap */}
        <path
          d="M16 6L4 12L16 18L28 12L16 6Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground"
        />
        {/* Lower Academic Base / Graduation Shield */}
        <path
          d="M8.5 14.5V20C8.5 22.5 11.5 25 16 25C20.5 25 23.5 22.5 23.5 20V14.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground/70"
        />
        {/* Tassel line */}
        <path
          d="M28 12.5V19.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-foreground/50"
        />
        {/* Signature Amber Accent Node (Tassel tip / Percentage dot) */}
        <circle
          cx="28"
          cy="20.5"
          r="1.75"
          className="fill-orange-500 dark:fill-orange-400"
        />
      </svg>
    </div>
  );
}

export function Logo({ showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark />
      {showText && (
        <span className="font-brand text-lg font-bold tracking-tight text-foreground">
          IGNOU <span className="font-normal text-neutral-400">Calculator</span>
        </span>
      )}
    </div>
  );
}
