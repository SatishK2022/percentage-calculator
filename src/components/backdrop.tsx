import * as React from 'react';

export function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-1/2 -z-50 h-[800px] w-full max-w-[1440px] -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
    >
      {/* Subtle warm hexagon ambient glow */}
      <div className="absolute -top-[120px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-500/30 via-orange-500/10 to-transparent blur-3xl dark:from-amber-500/5 dark:via-orange-500/10" />
      <svg
        className="absolute top-0 left-1/2 h-full w-[1440px] -translate-x-1/2 opacity-25 dark:opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 1440 800"
      >
        <defs>
          <pattern id="hexagons" width="48" height="84" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path
              d="M24 0 L48 14 L48 42 L24 56 L0 42 L0 14 Z M24 84 L48 98 L48 126 L24 140 L0 126 L0 98 Z"
              stroke="currentColor"
              strokeWidth="0.75"
              fill="none"
              className="text-neutral-400 dark:text-neutral-600"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
    </div>
  );
}
