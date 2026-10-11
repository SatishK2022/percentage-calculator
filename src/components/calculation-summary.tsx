'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { OverallCalculationResult } from '@/types/ignou';
import { BookOpen, HelpCircle, Shield, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { OFFICIAL_PORTAL_URL } from '@/lib/ignou-grade-card';

interface CalculationSummaryProps {
  result: OverallCalculationResult;
}

export function CalculationSummary({ result }: CalculationSummaryProps) {
  const { programmeRule, isEstimate, methodologyDescription } = result;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formula & Evaluation Methodology */}
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-amber-500 dark:text-orange-300" aria-hidden="true" />
            <CardTitle className="text-base">Evaluation Methodology</CardTitle>
          </div>
          <CardDescription>
            Official IGNOU weightage ratios and credit aggregation policy.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="rounded-lg border border-card-edge bg-card-fill p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Standard Assessment Ratio:</span>
              <Chip tone="default">
                {programmeRule.defaultAssessmentWeightage.assignment * 100}% Assignment +{' '}
                {programmeRule.defaultAssessmentWeightage.theory * 100}% TEE
              </Chip>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {methodologyDescription}
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-foreground block">Key Evaluation Principles:</span>
            <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-400 list-disc list-inside">
              <li>
                <strong>Separate Passing Requirement:</strong> Students must secure at least{' '}
                {programmeRule.passMarks.assignmentPercent}% in Assignments and{' '}
                {programmeRule.passMarks.theoryPercent}% in Term-End Examinations separately.
              </li>
              <li>
                <strong>Credit-Weighting:</strong> Higher credit courses (e.g. 6 or 8 credits) contribute proportionately more to your aggregate percentage.
              </li>
              <li>
                <strong>No Inferred Marks:</strong> Blank or unavailable examination scores are never calculated as zero.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Official Rule Verification & Source */}
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-emerald-500" aria-hidden="true" />
              <CardTitle className="text-base">Rule Verification Status</CardTitle>
            </div>
            <Chip tone={isEstimate ? 'warning' : 'success'}>
              {isEstimate ? 'Estimated Formula' : 'Official Verified'}
            </Chip>
          </div>
          <CardDescription>
            Regulatory handbook references and curriculum version metadata.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          <div className="space-y-1">
            <span className="text-neutral-500 font-mono text-[11px] block uppercase">Official Reference</span>
            <span className="font-medium text-foreground">
              {programmeRule.officialSourceReference}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-mono text-[11px] block uppercase">Applicable Curriculum</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              {programmeRule.applicableCurriculum}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-mono text-[11px] block uppercase">Verification Date</span>
            <span className="font-mono text-neutral-600 dark:text-neutral-400">
              {programmeRule.verificationDate}
            </span>
          </div>

          {programmeRule.notes && (
            <div className="rounded border border-card-edge p-2.5 text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {programmeRule.notes}
            </div>
          )}

          <div className="pt-2 border-t border-card-edge flex items-center justify-between">
            <span className="text-[11px] text-neutral-500">
              Need to check official published grade cards?
            </span>
            <a
              href={OFFICIAL_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-neutral-700 hover:text-brand dark:text-neutral-300 dark:hover:text-brand transition-colors"
            >
              Visit gradecard.ignou.ac.in
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
