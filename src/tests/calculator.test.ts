import { describe, it, expect } from 'vitest';
import { calculateOverallPercentage, evaluateCourse } from '@/lib/ignou-calculator';
import { getProgrammeRule } from '@/config/ignou-programme-rules';
import { CourseRawRecord } from '@/types/ignou';

describe('IGNOU Percentage Calculator Engine', () => {
  it('applies 30:70 ratio for standard BCA courses', () => {
    const rule = getProgrammeRule('BCA');
    const course: CourseRawRecord = {
      courseCode: 'BCS-011', // Standard 30:70 course
      assignmentMarks: 80,
      theoryMarks: 60,
    };
    const evalResult = evaluateCourse(course, rule);

    // 80 * 0.30 + 60 * 0.70 = 24 + 42 = 66.0
    expect(evalResult.courseScore).toBe(66);
    expect(evalResult.isCompleted).toBe(true);
    expect(evalResult.isFailed).toBe(false);
  });

  it('applies 25:75 ratio for verified specific BCA courses (like BCS-012)', () => {
    const rule = getProgrammeRule('BCA');
    const course: CourseRawRecord = {
      courseCode: 'BCS-012', // 25:75 specific course
      assignmentMarks: 80,
      theoryMarks: 60,
    };
    const evalResult = evaluateCourse(course, rule);

    // 80 * 0.25 + 60 * 0.75 = 20 + 45 = 65.0
    expect(evalResult.courseScore).toBe(65);
    expect(evalResult.weightageUsed.assignment).toBe(0.25);
    expect(evalResult.weightageUsed.theory).toBe(0.75);
  });

  it('enforces separate passing criteria (e.g. min 40% for BCA)', () => {
    const rule = getProgrammeRule('BCA');
    // Failed TEE (< 40 marks), though assignment is high
    const failedTee: CourseRawRecord = {
      courseCode: 'BCS-011',
      assignmentMarks: 80,
      theoryMarks: 35,
    };
    const evalFailed = evaluateCourse(failedTee, rule);
    expect(evalFailed.isCompleted).toBe(false);
    expect(evalFailed.isFailed).toBe(true);

    // Failed Assignment (< 40 marks), though TEE is high
    const failedAsgn: CourseRawRecord = {
      courseCode: 'BCS-011',
      assignmentMarks: 32,
      theoryMarks: 75,
    };
    const evalFailedAsgn = evaluateCourse(failedAsgn, rule);
    expect(evalFailedAsgn.isCompleted).toBe(false);
    expect(evalFailedAsgn.isFailed).toBe(true);
  });

  it('does NOT treat pending marks as 0, flags as pending', () => {
    const rule = getProgrammeRule('BCA');
    const pendingCourse: CourseRawRecord = {
      courseCode: 'BCS-031',
      assignmentMarks: 75,
      theoryMarks: null,
    };
    const evalResult = evaluateCourse(pendingCourse, rule);
    expect(evalResult.isPending).toBe(true);
    expect(evalResult.isCompleted).toBe(false);
    expect(evalResult.courseScore).toBeNull();
  });

  it('computes credit-weighted overall percentage accurately for CBCS programmes', () => {
    const courses: CourseRawRecord[] = [
      {
        courseCode: 'BEGAE-182',
        assignmentMarks: 80, // score: 80*0.3 + 70*0.7 = 24 + 49 = 73
        theoryMarks: 70,
        credits: 4,
      },
      {
        courseCode: 'BHIC-131',
        assignmentMarks: 60, // score: 60*0.3 + 50*0.7 = 18 + 35 = 53
        theoryMarks: 50,
        credits: 6,
      },
    ];

    const result = calculateOverallPercentage(courses, 'BAG');
    expect(result.completedCoursesCount).toBe(2);
    expect(result.pendingCoursesCount).toBe(0);

    // Weighted calculation:
    // (73 * 4 + 53 * 6) / (4 + 6) = (292 + 318) / 10 = 610 / 10 = 61.0%
    expect(result.creditWeightedPercentage).toBe(61);
    expect(result.overallPercentage).toBe(61);
    expect(result.division).toBe('First Division');
  });

  it('computes raw aggregate average for legacy BDP programmes', () => {
    const courses: CourseRawRecord[] = [
      {
        courseCode: 'FEG-02',
        assignmentMarks: 70, // 70*0.3 + 60*0.7 = 21 + 42 = 63
        theoryMarks: 60,
      },
      {
        courseCode: 'BECE-015',
        assignmentMarks: 80, // 80*0.3 + 70*0.7 = 24 + 49 = 73
        theoryMarks: 70,
      },
    ];

    const result = calculateOverallPercentage(courses, 'BA');
    expect(result.programmeRule.aggregationMethod).toBe('raw_aggregate');
    // Raw average: (63 + 73) / 2 = 68.0
    expect(result.overallPercentage).toBe(68);
  });

  it('labels unverified programmes as estimates with clear reason', () => {
    const courses: CourseRawRecord[] = [
      {
        courseCode: 'XYZ-101',
        assignmentMarks: 70,
        theoryMarks: 60,
      },
    ];
    const result = calculateOverallPercentage(courses, 'CUSTOM_PROG');
    expect(result.isEstimate).toBe(true);
    expect(result.estimateReason).toBeDefined();
    expect(result.programmeRule.isVerified).toBe(false);
  });

  it('correctly evaluates MCA_NEW with 30:70 theory and 30:70 lab courses using course-specific credits', () => {
    const courses: CourseRawRecord[] = [
      {
        courseCode: 'MCS211', // 4 credits theory: 74*0.3 + 40*0.7 = 22.2 + 28 = 50.2
        assignmentMarks: 74,
        theoryMarks: 40,
      },
      {
        courseCode: 'MCSL216', // 2 credits lab: 71*0.3 + 80*0.7 = 21.3 + 56 = 77.3
        assignmentMarks: 71,
        practicalMarks: 80,
      },
      {
        courseCode: 'MCS225', // Pending course: no theory marks yet
        assignmentMarks: 80,
        theoryMarks: null,
      },
    ];

    const result = calculateOverallPercentage(courses, 'MCA_NEW');
    expect(result.completedCoursesCount).toBe(2);
    expect(result.pendingCoursesCount).toBe(1);
    expect(result.totalCreditsCompleted).toBe(6); // 4 + 2

    // (50.2 * 4 + 77.3 * 2) / 6 = (200.8 + 154.6) / 6 = 355.4 / 6 = 59.2333... -> 59.23
    expect(result.creditWeightedPercentage).toBe(59.23);
    expect(result.overallPercentage).toBe(59.23);
  });
});
