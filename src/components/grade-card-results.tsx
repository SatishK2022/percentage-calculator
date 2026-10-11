'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OverallCalculationResult } from '@/types/ignou';
import {
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

interface GradeCardResultsProps {
  result: OverallCalculationResult;
  onReset: () => void;
}

export function GradeCardResults({ result, onReset }: GradeCardResultsProps) {
  const {
    enrollmentNumber,
    studentName,
    programmeCode,
    programmeRule,
    isEstimate,
    estimateReason,
    totalCoursesCount,
    completedCoursesCount,
    pendingCoursesCount,
    failedCoursesCount,
    totalCreditsCompleted,
    totalCreditsEnrolled,
    overallPercentage,
    creditWeightedPercentage,
    rawAggregatePercentage,
    division,
    status,
    calculatedAt,
  } = result;

  return (
    <div className="space-y-6">
      {/* Top Banner & Metadata */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-xl sm:text-2xl">Academic Performance Summary</CardTitle>

            {/* Actions */}
            <div className="no-print flex items-center gap-2 self-start sm:self-auto">
              <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw className="size-3.5 -ml-1 mr-1" aria-hidden="true" />
                New Check
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-card-edge pt-4 text-xs">
            <div>
              <span className="text-neutral-500 font-mono text-[11px] block uppercase">Enrolment Number</span>
              <span className="font-semibold text-foreground text-sm font-mono">
                {enrollmentNumber || 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 font-mono text-[11px] block uppercase">Student Name</span>
              <span className="font-semibold text-foreground text-sm">
                {studentName || 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 font-mono text-[11px] block uppercase">Programme Code</span>
              <span className="font-semibold text-foreground text-sm font-mono">
                {programmeCode}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Percentage Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-mono uppercase text-[11px]">Overall Percentage</span>
              <Award className="size-4 text-amber-500 dark:text-orange-300" aria-hidden="true" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {overallPercentage !== null ? `${overallPercentage}%` : 'N/A'}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500 leading-tight">
            {division || 'Calculation pending final course assessments'}
          </p>
        </Card>

        {/* Completed Courses */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-mono uppercase text-[11px]">Completed Courses</span>
              <CheckCircle className="size-4 text-emerald-500" aria-hidden="true" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-montserrat text-3xl font-bold tracking-tight text-foreground">
                {completedCoursesCount}
              </span>
              <span className="text-xs text-neutral-500">of {totalCoursesCount} total</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${totalCoursesCount > 0 ? (completedCoursesCount / totalCoursesCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </Card>

        {/* Pending Courses */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-mono uppercase text-[11px]">Pending / Incomplete</span>
              <Clock className="size-4 text-amber-500" aria-hidden="true" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-montserrat text-3xl font-bold tracking-tight text-foreground">
                {pendingCoursesCount}
              </span>
              {failedCoursesCount > 0 && (
                <span className="text-xs text-rose-500">({failedCoursesCount} below pass mark)</span>
              )}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            {pendingCoursesCount === 0 ? 'All courses evaluated' : 'Awaiting component evaluation'}
          </p>
        </Card>

        {/* Credits Completed */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-mono uppercase text-[11px]">Credits Completed</span>
              <BookOpen className="size-4 text-neutral-400" aria-hidden="true" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-montserrat text-3xl font-bold tracking-tight text-foreground">
                {totalCreditsCompleted}
              </span>
              <span className="text-xs text-neutral-500">of {totalCreditsEnrolled} enrolled</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            Weighted credit points applied
          </p>
        </Card>
      </div>
    </div>
  );
}
