'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ProgrammeDropdown } from '@/components/ui/programme-dropdown';
import { fetchOfficialGradeCard } from '@/lib/ignou-grade-card';
import { GradeCardFetchResult } from '@/types/ignou';
import { Search, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

interface EnrollmentFormProps {
  onFetchSuccess: (data: GradeCardFetchResult) => void;
  onReset: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export function EnrollmentForm({
  onFetchSuccess,
  onReset,
  isLoading,
  setIsLoading,
}: EnrollmentFormProps) {
  const [enrollmentNumber, setEnrollmentNumber] = React.useState('');
  const [programmeCode, setProgrammeCode] = React.useState('BCA');
  const [error, setError] = React.useState<string | null>(null);
  const [corsNotice, setCorsNotice] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCorsNotice(null);

    const cleanEnr = enrollmentNumber.trim();
    const cleanProg = programmeCode.trim().toUpperCase();

    if (!cleanEnr) {
      setError('Please enter your IGNOU enrollment number.');
      return;
    }

    if (!/^[0-9]{9,10}$/.test(cleanEnr)) {
      setError('Enrollment number should be 9 or 10 numeric digits.');
      return;
    }

    if (!cleanProg) {
      setError('Please select or specify your programme code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetchOfficialGradeCard(cleanEnr, cleanProg);

      if (result.success && result.courses.length > 0) {
        onFetchSuccess(result);
      } else if (result.corsBlocked) {
        setCorsNotice(result.details || result.error || 'Portal connection could not be established.');
      } else {
        setError(result.error || 'Unable to retrieve grade card data from official portal.');
      }
    } catch {
      setError('An unexpected error occurred while processing the request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEnrollmentNumber('');
    setProgrammeCode('BCA');
    setError(null);
    setCorsNotice(null);
    onReset();
  };

  const handleSelectQuickProg = (code: string) => {
    setProgrammeCode(code);
    setError(null);
    setCorsNotice(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Retrieve Official Grade Card</CardTitle>
        <CardDescription>
          Enter your enrolment number and programme code to fetch your grade card.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Enrollment Number */}
            <div className="space-y-1.5">
              <label htmlFor="enr-input" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Enrolment Number <span className="text-rose-500">*</span>
              </label>
              <Input
                id="enr-input"
                type="text"
                maxLength={10}
                placeholder="e.g. 195412345 or 2500888320"
                value={enrollmentNumber}
                onChange={(e) => {
                  setEnrollmentNumber(e.target.value.replace(/[^0-9]/g, ''));
                  setError(null);
                  setCorsNotice(null);
                }}
                disabled={isLoading}
                required
              />
              <p className="text-[11px] text-neutral-500">
                Supports standard 9-digit and 10-digit enrolment numbers.
              </p>
            </div>

            {/* Programme Dropdown (ChaiUI) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Programme Code <span className="text-rose-500">*</span>
              </label>
              <ProgrammeDropdown
                value={programmeCode}
                onChange={(code) => {
                  setProgrammeCode(code);
                  setError(null);
                  setCorsNotice(null);
                }}
                disabled={isLoading}
              />
              <p className="text-[11px] text-neutral-500">
                Select your programme or type to search from verified schemes.
              </p>
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium text-neutral-500">
              Quick Select:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['BCA', 'MCA_NEW', 'BAG', 'BCOMG', 'BSCG', 'MCA', 'MBA'].map((code) => (
                <button
                  type="button"
                  key={code}
                  onClick={() => handleSelectQuickProg(code)}
                  className={`cursor-pointer transition-colors ${
                    programmeCode === code ? 'opacity-100 font-semibold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Chip tone={programmeCode === code ? 'special' : 'default'}>
                    {code}
                  </Chip>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Connection Notice */}
          {corsNotice && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-neutral-800 dark:text-neutral-200 space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                <span>Unable to fetch automatically from portal</span>
              </div>
              <p className="leading-relaxed text-neutral-600 dark:text-neutral-300">
                {corsNotice}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="solid"
              disabled={isLoading}
              className="min-w-36"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin -ml-1 mr-2" aria-hidden="true" />
                  Connecting...
                </>
              ) : (
                <>
                  <Search className="size-4 -ml-1 mr-1.5" aria-hidden="true" />
                  Fetch Grade Card
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="size-3.5 -ml-1 mr-1.5" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
