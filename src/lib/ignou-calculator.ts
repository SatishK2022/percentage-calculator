import {
  CourseRawRecord,
  CourseEvaluation,
  OverallCalculationResult,
  ProgrammeRule,
  AssessmentWeightage,
} from '@/types/ignou';
import { getProgrammeRule } from '@/config/ignou-programme-rules';

/**
 * Calculates a single course's weighted marks and completion status
 * according to the programme's evaluation scheme.
 */
export function evaluateCourse(course: CourseRawRecord, rule: ProgrammeRule): CourseEvaluation {
  const code = course.courseCode.toUpperCase().replace(/\s+/g, '');
  const cleanCode = code.replace(/[-\s]/g, '');

  // Determine weightage: check specific course overrides or default
  const weightage: AssessmentWeightage =
    rule.courseSpecificWeightages?.[code] ||
    rule.courseSpecificWeightages?.[cleanCode] ||
    rule.defaultAssessmentWeightage;

  const assignmentMax = course.assignmentMaxMarks || rule.defaultMaxMarks.assignment || 100;
  const theoryMax = course.theoryMaxMarks || rule.defaultMaxMarks.theory || 100;

  // Determine credits
  const credits =
    course.credits ||
    rule.courseCredits?.[code] ||
    rule.courseCredits?.[cleanCode] ||
    rule.defaultCreditsPerCourse ||
    4;

  const rawStatus = (course.rawStatus || '').toUpperCase().trim();
  const hasRawCompleted = rawStatus === 'COMPLETED' || rawStatus === 'PASS';
  const hasRawFailed = rawStatus === 'NOT COMPLETED' || rawStatus === 'FAIL';

  // Check assessment presence
  const hasAssignment = course.assignmentMarks !== null && course.assignmentMarks !== undefined;
  const hasTheory = course.theoryMarks !== null && course.theoryMarks !== undefined;
  const hasPractical = course.practicalMarks !== null && course.practicalMarks !== undefined;
  const hasProject = course.projectMarks !== null && course.projectMarks !== undefined;

  // Normalize marks to percentage / 100-scale
  const asgnScore = hasAssignment ? (course.assignmentMarks! / assignmentMax) * 100 : null;
  const theoryScore = hasTheory ? (course.theoryMarks! / theoryMax) * 100 : null;
  const practicalScore = hasPractical ? (course.practicalMarks! / 100) * 100 : null;
  const projectScore = hasProject ? (course.projectMarks! / 100) * 100 : null;

  // Separate pass check criteria
  const isAsgnPassed = asgnScore !== null ? asgnScore >= rule.passMarks.assignmentPercent : null;
  const isTheoryPassed = theoryScore !== null ? theoryScore >= rule.passMarks.theoryPercent : null;

  let courseScore: number | null = null;
  let calculationExplanation = '';
  let isCompleted = false;
  let isFailed = false;
  let isPending = false;
  let statusText = 'Pending';

  // Project course evaluation (e.g. BCSP-064)
  if (hasProject) {
    courseScore = projectScore;
    isCompleted = (projectScore || 0) >= rule.passMarks.overallPercent;
    isFailed = !isCompleted;
    calculationExplanation = `Project Assessment: ${projectScore?.toFixed(1)}% (Min pass: ${rule.passMarks.overallPercent}%)`;
    statusText = isCompleted ? 'Completed' : 'Failed';
  }
  // Pure Practical course where practical is recorded in theory or practical slot
  else if (hasPractical && !hasTheory && !hasAssignment) {
    courseScore = practicalScore;
    isCompleted = (practicalScore || 0) >= rule.passMarks.theoryPercent;
    isFailed = !isCompleted;
    calculationExplanation = `Practical Assessment: ${practicalScore?.toFixed(1)}%`;
    statusText = isCompleted ? 'Completed' : 'Failed';
  }
  // Standard Continuous Assessment + Term-End Examination (or Lab Practical)
  else if (hasAssignment && (hasTheory || hasPractical)) {
    const termEndVal = hasTheory ? theoryScore! : practicalScore!;
    const termEndLabel = hasTheory ? 'TEE' : 'Lab Practical';

    // Apply component weightage
    courseScore = asgnScore! * weightage.assignment + termEndVal * weightage.theory;

    const bothPassed = isAsgnPassed === true && termEndVal >= rule.passMarks.theoryPercent;

    if (bothPassed || hasRawCompleted) {
      isCompleted = true;
      statusText = 'Completed';
    } else {
      isFailed = true;
      statusText = 'Not Completed (Pass criteria not met)';
    }

    const asgnPctLabel = Math.round(weightage.assignment * 100);
    const teePctLabel = Math.round(weightage.theory * 100);
    calculationExplanation = `(${asgnScore?.toFixed(1)} × ${asgnPctLabel}%) + (${termEndVal.toFixed(1)} [${termEndLabel}] × ${teePctLabel}%) = ${courseScore.toFixed(2)}`;
  }
  // Only one assessment component is published
  else if (hasAssignment || hasTheory || hasPractical) {
    isPending = true;
    statusText = 'Pending (Awaiting other component marks)';
    if (hasAssignment) {
      calculationExplanation = `Assignment: ${asgnScore?.toFixed(1)}/100 (TEE marks awaiting publication)`;
    } else {
      calculationExplanation = `TEE: ${theoryScore?.toFixed(1)}/100 (Assignment marks awaiting publication)`;
    }
  }
  // No marks available at all
  else {
    isPending = true;
    statusText = hasRawCompleted ? 'Completed' : 'Pending';
    calculationExplanation = 'Marks not yet published';
  }

  // If official grade card explicitly says COMPLETED and we have a score, respect it
  if (hasRawCompleted && courseScore !== null) {
    isCompleted = true;
    isFailed = false;
    statusText = 'Completed';
  } else if (hasRawFailed && !isCompleted) {
    isFailed = true;
    statusText = 'Not Completed';
  }

  const coursePercentage = courseScore !== null ? Number(courseScore.toFixed(rule.roundingDecimals)) : null;

  return {
    courseCode: code,
    courseTitle: course.courseTitle,
    assignmentMarks: course.assignmentMarks ?? null,
    theoryMarks: course.theoryMarks ?? null,
    practicalMarks: course.practicalMarks ?? null,
    projectMarks: course.projectMarks ?? null,
    assignmentMaxMarks: assignmentMax,
    theoryMaxMarks: theoryMax,
    credits,
    courseScore: courseScore !== null ? Number(courseScore.toFixed(rule.roundingDecimals)) : null,
    coursePercentage,
    isCompleted,
    isFailed,
    isPending,
    statusText,
    weightageUsed: weightage,
    calculationExplanation,
  };
}

/**
 * Calculates overall statistics, credit-weighted average, and percentage
 * from a list of student course records.
 */
export function calculateOverallPercentage(
  courses: CourseRawRecord[],
  programmeCode: string,
  studentName?: string,
  enrollmentNumber?: string
): OverallCalculationResult {
  const rule = getProgrammeRule(programmeCode);
  const evaluations = courses.map((c) => evaluateCourse(c, rule));

  const totalCoursesCount = evaluations.length;
  const completedCourses = evaluations.filter((e) => e.isCompleted && e.courseScore !== null);
  const completedCoursesCount = completedCourses.length;
  const failedCoursesCount = evaluations.filter((e) => e.isFailed).length;
  const pendingCoursesCount = evaluations.filter((e) => e.isPending).length;

  const totalCreditsEnrolled = evaluations.reduce((acc, curr) => acc + curr.credits, 0);
  const totalCreditsCompleted = completedCourses.reduce((acc, curr) => acc + curr.credits, 0);

  let creditWeightedPercentage: number | null = null;
  let rawAggregatePercentage: number | null = null;
  let overallPercentage: number | null = null;

  if (completedCourses.length > 0) {
    // 1. Credit-weighted calculation
    const weightedPointsSum = completedCourses.reduce(
      (acc, curr) => acc + (curr.courseScore || 0) * curr.credits,
      0
    );
    const divisorCredits = totalCreditsCompleted > 0 ? totalCreditsCompleted : 1;
    creditWeightedPercentage = Number((weightedPointsSum / divisorCredits).toFixed(rule.roundingDecimals));

    // 2. Raw aggregate percentage across completed courses
    const scoresSum = completedCourses.reduce((acc, curr) => acc + (curr.courseScore || 0), 0);
    rawAggregatePercentage = Number((scoresSum / completedCourses.length).toFixed(rule.roundingDecimals));

    // Select primary overall percentage based on official programme rule
    if (rule.aggregationMethod === 'credit_weighted') {
      overallPercentage = creditWeightedPercentage;
    } else {
      overallPercentage = rawAggregatePercentage;
    }
  }

  // Calculate division if courses are completed
  let division: string | undefined;
  if (overallPercentage !== null) {
    if (completedCoursesCount === totalCoursesCount && totalCoursesCount > 0) {
      if (overallPercentage >= 60) {
        division = 'First Division';
      } else if (overallPercentage >= 50) {
        division = 'Second Division';
      } else if (overallPercentage >= rule.passMarks.overallPercent) {
        division = 'Third / Pass Division';
      } else {
        division = 'Unsuccessful';
      }
    } else {
      division = 'In Progress (Partial evaluation)';
    }
  }

  const isEstimate = !rule.isVerified;
  const estimateReason = isEstimate
    ? `Specific programme evaluation ordinance for ${rule.programmeCode} has not been individually certified. Applied the standard IGNOU 30:70 assessment weightage.`
    : undefined;

  let methodologyDescription = '';
  if (rule.aggregationMethod === 'credit_weighted') {
    methodologyDescription = `Credit-weighted average: Sum of (Course Score × Course Credits) ÷ Total Completed Credits (${totalCreditsCompleted} credits). Evaluated using ${rule.defaultAssessmentWeightage.assignment * 100}% Assignment + ${rule.defaultAssessmentWeightage.theory * 100}% Term-End Examination weightage.`;
  } else {
    methodologyDescription = `Raw aggregate average: Sum of Course Scores ÷ Total Completed Courses (${completedCoursesCount} courses). Evaluated using 30% Assignment + 70% Term-End Examination weightage.`;
  }

  const status: OverallCalculationResult['status'] =
    completedCoursesCount === totalCoursesCount && totalCoursesCount > 0
      ? 'COMPLETED'
      : totalCoursesCount > 0
      ? 'IN_PROGRESS'
      : 'UNRESOLVED';

  return {
    enrollmentNumber,
    studentName,
    programmeCode: rule.programmeCode,
    programmeRule: rule,
    isEstimate,
    estimateReason,
    totalCoursesCount,
    completedCoursesCount,
    pendingCoursesCount,
    failedCoursesCount,
    totalCreditsEnrolled,
    totalCreditsCompleted,
    totalMarksObtained: completedCourses.length > 0 ? Number(completedCourses.reduce((a, b) => a + (b.courseScore || 0), 0).toFixed(1)) : null,
    totalMaxMarks: completedCourses.length > 0 ? completedCourses.length * 100 : null,
    rawAggregatePercentage,
    creditWeightedPercentage,
    overallPercentage,
    evaluations,
    division,
    status,
    methodologyDescription,
    calculatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  };
}
