import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends React.ComponentProps<'span'> {
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'special';
}

export function Chip({ className, tone = 'default', children, ...props }: ChipProps) {
  const toneClasses = {
    default:
      'border-neutral-300 text-neutral-700 dark:border-white/15 dark:text-neutral-300',
    success:
      'border-emerald-600/40 text-emerald-600 dark:border-emerald-400/30 dark:text-emerald-400',
    warning:
      'border-amber-600/40 text-amber-700 dark:border-amber-400/30 dark:text-amber-400',
    danger:
      'border-rose-600/40 text-rose-600 dark:border-rose-400/30 dark:text-rose-400',
    special:
      'border-purple-600/40 text-purple-600 dark:border-purple-400/30 dark:text-purple-400',
  }[tone];

  return (
    <span
      data-slot="chip"
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium tracking-tight transition-colors',
        toneClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
