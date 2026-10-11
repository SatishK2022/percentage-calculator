'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { CourseEvaluation } from '@/types/ignou';

interface CourseMarksTableProps {
  evaluations: CourseEvaluation[];
}

export function CourseMarksTable({ evaluations }: CourseMarksTableProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Course-Wise Grade Card Breakdown</CardTitle>
        <CardDescription>
          Evaluation of continuous assessments, practicals, and term-end examinations.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-card-edge text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Course Code</th>
                <th className="pb-3 font-medium">Assignment</th>
                <th className="pb-3 font-medium">Theory (TEE)</th>
                <th className="pb-3 font-medium">Practical (Lab)</th>
                <th className="pb-3 font-medium">Credits</th>
                <th className="pb-3 font-medium">Course Score</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-edge">
              {evaluations.map((course, idx) => (
                <tr
                  key={`${course.courseCode}-${idx}`}
                  className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Course Code */}
                  <td className="py-3 font-mono font-semibold text-foreground">
                    {course.courseCode}
                    {course.courseTitle && (
                      <span className="block font-sans font-normal text-[11px] text-neutral-500">
                        {course.courseTitle}
                      </span>
                    )}
                  </td>

                  {/* Assignment Marks */}
                  <td className="py-3 font-mono">
                    {course.assignmentMarks !== null ? (
                      course.assignmentMarks
                    ) : (
                      <span className="text-neutral-400 italic">-</span>
                    )}
                  </td>

                  {/* Theory Marks */}
                  <td className="py-3 font-mono">
                    {course.theoryMarks !== null ? (
                      course.theoryMarks
                    ) : (
                      <span className="text-neutral-400 italic">-</span>
                    )}
                  </td>

                  {/* Practical (Lab) Marks */}
                  <td className="py-3 font-mono">
                    {course.practicalMarks !== null ? (
                      <span className="text-foreground">{course.practicalMarks}</span>
                    ) : (
                      <span className="text-neutral-400 italic">-</span>
                    )}
                  </td>

                  {/* Credits */}
                  <td className="py-3 font-mono text-neutral-600 dark:text-neutral-300">
                    {course.credits}
                  </td>

                  {/* Course Score */}
                  <td className="py-3 font-mono">
                    {course.courseScore !== null ? (
                      <span className="font-semibold text-foreground">
                        {course.courseScore.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-neutral-400 italic">Pending</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 text-right">
                    {course.isCompleted ? (
                      <Chip tone="success">Completed</Chip>
                    ) : course.isFailed ? (
                      <Chip tone="danger">Not Completed</Chip>
                    ) : (
                      <Chip tone="warning">Pending</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
