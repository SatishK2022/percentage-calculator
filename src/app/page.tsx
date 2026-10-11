'use client';

import * as React from 'react';
import { Navbar } from '@/components/navbar';
import { Backdrop } from '@/components/backdrop';
import { Footer } from '@/components/footer';
import { EnrollmentForm } from '@/components/enrollment-form';
import { GradeCardResults } from '@/components/grade-card-results';
import { CourseMarksTable } from '@/components/course-marks-table';
import { CalculationSummary } from '@/components/calculation-summary';
import { AnimatedBadge } from '@/components/ui/animated-badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { GradeCardFetchResult, OverallCalculationResult } from '@/types/ignou';
import { calculateOverallPercentage } from '@/lib/ignou-calculator';
import { VERIFIED_PROGRAMME_RULES } from '@/config/ignou-programme-rules';
import {
  BookOpen,
  Calculator,
  FileCheck,
  HelpCircle,
} from 'lucide-react';

export default function HomePage() {
  const [calculationResult, setCalculationResult] = React.useState<OverallCalculationResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentProgramme, setCurrentProgramme] = React.useState('BCA');

  const handleDataLoaded = (data: GradeCardFetchResult) => {
    const progCode = data.programmeCode || currentProgramme;
    setCurrentProgramme(progCode);

    const calculated = calculateOverallPercentage(
      data.courses,
      progCode,
      data.studentName,
      data.enrollmentNumber
    );
    setCalculationResult(calculated);
  };

  const handleReset = () => {
    setCalculationResult(null);
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background font-sans text-foreground">
      {/* Background hexagon glow */}
      <Backdrop />

      {/* Sticky header */}
      <Navbar />

      {/* Main Page Container */}
      <main className="mx-auto max-w-6xl px-6 py-8 sm:px-12 sm:py-12">
        {/* Hero Section */}
        <header className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto mb-10 sm:mb-14">
          <AnimatedBadge>Verified Evaluation Scheme</AnimatedBadge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
            IGNOU Percentage Calculator
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
            Calculate your official term-end percentage with{' '}
            <span className="highlight font-semibold">verified programme-specific evaluation rules</span>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-neutral-500 font-medium">Verified for:</span>
            {['BCA', 'MCA_NEW', 'BAG', 'BCOMG', 'BSCG', 'Legacy BDP', 'MA / MBA'].map((badge) => (
              <Chip key={badge} tone="default" className="text-[11px]">
                {badge}
              </Chip>
            ))}
          </div>
        </header>

        {/* Input & Retrieval Section */}
        <section aria-label="Retrieve Grade Card" className="space-y-6">
          <EnrollmentForm
            onFetchSuccess={handleDataLoaded}
            onReset={handleReset}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Results State */}
          {calculationResult && (
            <div className="space-y-6 pt-6">
              <GradeCardResults result={calculationResult} onReset={handleReset} />
              <CourseMarksTable evaluations={calculationResult.evaluations} />
              <CalculationSummary result={calculationResult} />
            </div>
          )}

          {/* Empty State / Educational Guidance (shown when no results yet) */}
          {!calculationResult && (
            <div className="mt-14 space-y-12">
              <section aria-labelledby="how-it-works" className="space-y-6 border-t border-card-edge pt-10">
                <div className="text-center space-y-1">
                  <h2 id="how-it-works" className="text-xl sm:text-2xl font-medium tracking-tight">
                    How IGNOU Calculates Your Percentage
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
                    Understanding continuous assessments, term-end examinations and credit weightages.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card className="p-5">
                    <div className="size-8 rounded-lg border border-card-edge bg-card-fill flex items-center justify-center mb-3">
                      <BookOpen className="size-4 text-amber-500 dark:text-orange-300" aria-hidden="true" />
                    </div>
                    <h3 className="font-montserrat text-sm font-semibold text-foreground mb-1">
                      Continuous vs Term-End
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Most IGNOU courses assign 30% weightage to continuous assessment assignments and 70% to written term-end examinations. Select BCA courses follow a 25:75 ratio.
                    </p>
                  </Card>

                  <Card className="p-5">
                    <div className="size-8 rounded-lg border border-card-edge bg-card-fill flex items-center justify-center mb-3">
                      <FileCheck className="size-4 text-emerald-500" aria-hidden="true" />
                    </div>
                    <h3 className="font-montserrat text-sm font-semibold text-foreground mb-1">
                      Separate Passing Rule
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      You must pass the assignment and term-end examination separately with minimum required marks (35% for undergraduate BA/BCOM/BSC, 40% for BCA/MCA/Masters).
                    </p>
                  </Card>

                  <Card className="p-5">
                    <div className="size-8 rounded-lg border border-card-edge bg-card-fill flex items-center justify-center mb-3">
                      <Calculator className="size-4 text-sky-400" aria-hidden="true" />
                    </div>
                    <h3 className="font-montserrat text-sm font-semibold text-foreground mb-1">
                      Credit-Weighted Aggregation
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Final percentages reflect each course credit weight. Pending or incomplete courses with missing term-end marks are never calculated as zero.
                    </p>
                  </Card>
                </div>
              </section>

              {/* Verified Programmes Grid */}
              <section aria-labelledby="verified-programmes">
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0 pb-3">
                    <CardTitle id="verified-programmes" className="text-base">Verified Programme Directory</CardTitle>
                    <CardDescription>
                      Evaluation formulas verified against official IGNOU Programme Handbooks.
                    </CardDescription>
                  </CardHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {Object.values(VERIFIED_PROGRAMME_RULES).map((rule) => (
                      <div
                        key={rule.programmeCode}
                        className="rounded-lg border border-card-edge bg-card-fill p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-foreground">{rule.programmeCode}</span>
                          <Chip tone="success" className="text-[10px]">Verified</Chip>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-1">
                          {rule.programmeName}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          {rule.defaultAssessmentWeightage.assignment * 100}:{rule.defaultAssessmentWeightage.theory * 100} Ratio • Min Pass: {rule.passMarks.overallPercent}%
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              {/* Frequently Asked Questions (SEO Search Intent) */}
              <section aria-labelledby="faq-heading" className="space-y-6 max-w-3xl mx-auto w-full">
                <div className="text-center space-y-1">
                  <h2 id="faq-heading" className="text-xl sm:text-2xl font-medium tracking-tight">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
                    Official evaluation rules, weightages, passing criteria, and division cutoffs.
                  </p>
                </div>

                <Accordion type="single" collapsible defaultValue="weightage" className="grid w-full gap-3">
                  <AccordionItem value="weightage">
                    <AccordionTrigger>What is the 30:70 weightage formula in IGNOU?</AccordionTrigger>
                    <AccordionContent>
                      Under the 30:70 evaluation formula, assignments contribute 30% and term-end examination (TEE) theory marks contribute 70% to your final course score. The formula is: (Assignment Marks × 0.30) + (Theory Marks × 0.70). For select BCA practical courses, a 25:75 ratio is applied.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cbcs-calculation">
                    <AccordionTrigger>How is percentage calculated for CBCS and MCA programmes?</AccordionTrigger>
                    <AccordionContent>
                      Programmes under the Choice Based Credit System (BAG, BCOMG, BSCG) and MCA_NEW use credit-weighted aggregation: sum of (Course Score × Course Credits) divided by total completed credits. Higher credit courses (e.g. 6 or 8 credits) have a proportionally higher impact on your final aggregate.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="passing-criteria">
                    <AccordionTrigger>What are the separate passing requirements for IGNOU courses?</AccordionTrigger>
                    <AccordionContent>
                      Students must pass continuous assignments and term-end examinations separately. The minimum passing threshold is 35% for undergraduate courses (BA, BCOM, BSC) and 40% for BCA, MCA, and Master degree programmes. Failing either component means the course status remains Not Completed.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="division-cutoffs">
                    <AccordionTrigger>What are the division cutoffs in IGNOU?</AccordionTrigger>
                    <AccordionContent>
                      Upon completing all required programme credits: 60% and above is awarded First Division; 50% to 59.99% is awarded Second Division; and passing marks up to 49.99% receive Third or Pass Division.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="pending-marks">
                    <AccordionTrigger>Are pending or incomplete courses counted as zero in my percentage?</AccordionTrigger>
                    <AccordionContent>
                      No. Courses awaiting practical, assignment, or term-end theory evaluation are marked as pending and excluded from your completed aggregate score so your calculated standing accurately reflects only completed coursework.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
