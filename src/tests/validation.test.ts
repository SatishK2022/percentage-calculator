import { describe, it, expect } from 'vitest';
import {
  enrollmentSchema,
  programmeCodeSchema,
  normalizeEnrollment,
  normalizeProgrammeCode,
  courseEntrySchema,
} from '@/lib/validation';

describe('Enrollment and Programme Validation', () => {
  it('accepts valid 9-digit IGNOU enrollment numbers', () => {
    const res = enrollmentSchema.safeParse('185432901');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('185432901');
    }
  });

  it('accepts valid 10-digit IGNOU enrollment numbers (July 2020+ batches)', () => {
    const res = enrollmentSchema.safeParse('2105678901');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('2105678901');
    }
  });

  it('trims leading and trailing whitespace from enrollment number', () => {
    const res = enrollmentSchema.safeParse('  185432901  ');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('185432901');
    }
  });

  it('rejects invalid letters, symbols, or invalid digit counts in enrollment', () => {
    expect(enrollmentSchema.safeParse('12345').success).toBe(false);
    expect(enrollmentSchema.safeParse('123456789012').success).toBe(false);
    expect(enrollmentSchema.safeParse('18543290A').success).toBe(false);
    expect(enrollmentSchema.safeParse('').success).toBe(false);
  });

  it('normalizes programme codes to uppercase without extra spaces', () => {
    expect(normalizeProgrammeCode(' bca ')).toBe('BCA');
    expect(normalizeProgrammeCode('mca_new ')).toBe('MCA_NEW');
    expect(normalizeProgrammeCode('b com g')).toBe('BCOMG');

    const res = programmeCodeSchema.safeParse(' bca ');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('BCA');
    }
  });

  it('validates course marks range 0 to 100 or null', () => {
    const valid = courseEntrySchema.safeParse({
      courseCode: 'MCS-011',
      assignmentMarks: 75,
      theoryMarks: 60,
      credits: 4,
    });
    expect(valid.success).toBe(true);

    const invalidMarks = courseEntrySchema.safeParse({
      courseCode: 'MCS-011',
      assignmentMarks: 110,
      theoryMarks: 50,
      credits: 4,
    });
    expect(invalidMarks.success).toBe(false);

    const negativeMarks = courseEntrySchema.safeParse({
      courseCode: 'MCS-011',
      assignmentMarks: -5,
      theoryMarks: 50,
      credits: 4,
    });
    expect(negativeMarks.success).toBe(false);

    const nullMarks = courseEntrySchema.safeParse({
      courseCode: 'MCS-011',
      assignmentMarks: null,
      theoryMarks: null,
      credits: 4,
    });
    expect(nullMarks.success).toBe(true);
  });
});
