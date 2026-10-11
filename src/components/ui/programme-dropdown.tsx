'use client';

import * as React from 'react';
import { ChevronDown, Check, Search as SearchIcon } from 'lucide-react';
import { COMMON_PROGRAMMES } from '@/config/ignou-programme-rules';

interface ProgrammeDropdownProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function ProgrammeDropdown({ value, onChange, disabled }: ProgrammeDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedProgramme = COMMON_PROGRAMMES.find((p) => p.code === value);

  const filteredProgrammes = COMMON_PROGRAMMES.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const isCustomCode =
    searchQuery.trim().length > 0 &&
    !COMMON_PROGRAMMES.some((p) => p.code.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Dropdown Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex h-10 w-full items-center justify-between rounded-lg border border-card-edge bg-card-fill px-3 py-2 text-sm text-foreground transition-all duration-200 hover:border-card-edge-hover focus:outline-none focus:ring-1 focus:ring-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen ? 'border-card-edge-hover ring-1 ring-amber-500/30' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="font-mono font-semibold text-foreground text-xs uppercase px-1.5 py-0.5 rounded bg-neutral-200/50 dark:bg-white/10">
            {value || 'Select'}
          </span>
          <span className="truncate text-xs text-neutral-600 dark:text-neutral-400">
            {selectedProgramme ? selectedProgramme.name : 'Custom Programme Code'}
          </span>
        </div>
        <ChevronDown
          className={`size-4 text-neutral-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* ChaiUI Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[280px] rounded-lg border border-gray-400/20 bg-background/95 p-1.5 backdrop-blur-lg dark:border-orange-50/10 shadow-none animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Search Box */}
          <div className="relative mb-1.5 px-1 pt-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programme or type code..."
              className="h-8 w-full rounded-md border border-card-edge bg-card-fill pl-8 pr-3 text-xs text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 font-sans"
            />
          </div>

          {/* List Options */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
            {/* Custom option when user types unlisted code */}
            {isCustomCode && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim().toUpperCase())}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md text-left transition-colors bg-amber-500/10 text-amber-700 dark:text-orange-200 hover:bg-amber-500/20 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{searchQuery.trim().toUpperCase()}</span>
                  <span className="text-[11px] text-neutral-500">(Use Custom Code)</span>
                </div>
                <Check className="size-3.5 opacity-0" aria-hidden="true" />
              </button>
            )}

            {filteredProgrammes.length === 0 && !isCustomCode && (
              <div className="px-3 py-4 text-center text-xs text-neutral-500">
                No programmes match &quot;{searchQuery}&quot;
              </div>
            )}

            {filteredProgrammes.map((p) => {
              const isSelected = value === p.code;
              return (
                <button
                  type="button"
                  key={p.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(p.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-800/80 text-foreground font-medium'
                      : 'text-neutral-700 hover:text-brand hover:bg-neutral-100/70 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{p.code}</span>
                      <span className="text-[10px] text-neutral-500">{p.category}</span>
                    </div>
                    <span className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                      {p.name}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="size-3.5 text-amber-600 dark:text-orange-300 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
