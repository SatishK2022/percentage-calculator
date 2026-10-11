import { z } from 'zod';

/**
 * Standard IGNOU Enrollment numbers:
 * - Traditional IGNOU enrolments are 9 digits.
 * - Enrolments starting from July 2020 admission session are 10 digits.
 * - Whitespace should always be trimmed.
 */
export const enrollmentSchema = z
  .string()
  .trim()
  .min(1, 'Enrollment number is required.')
  .regex(/^[0-9]{9,10}$/, 'IGNOU Enrollment number must be 9 or 10 numeric digits.');

export const programmeCodeSchema = z
  .string()
  .trim()
  .min(2, 'Programme code must be at least 2 characters.')
  .max(15, 'Programme code cannot exceed 15 characters.')
  .transform((val) => val.toUpperCase().replace(/\s+/g, ''));

export const searchFormSchema = z.object({
  enrollmentNumber: enrollmentSchema,
  programmeCode: programmeCodeSchema,
});

export type SearchFormData = z.infer<typeof searchFormSchema>;

export const courseEntrySchema = z.object({
  courseCode: z
    .string()
    .trim()
    .min(2, 'Course code is required')
    .transform((val) => val.toUpperCase()),
  courseTitle: z.string().trim().optional(),
  assignmentMarks: z
    .number()
    .nullable()
    .refine((val) => val === null || (val >= 0 && val <= 100), {
      message: 'Assignment marks must be between 0 and 100.',
    }),
  theoryMarks: z
    .number()
    .nullable()
    .refine((val) => val === null || (val >= 0 && val <= 100), {
      message: 'Theory marks must be between 0 and 100.',
    }),
  practicalMarks: z
    .number()
    .nullable()
    .refine((val) => val === null || (val >= 0 && val <= 100), {
      message: 'Practical marks must be between 0 and 100.',
    })
    .optional(),
  credits: z.number().min(1, 'Credits must be at least 1').max(32, 'Credits must be valid').default(4),
  rawStatus: z.string().optional(),
});

export type CourseEntryInput = z.infer<typeof courseEntrySchema>;

export function normalizeEnrollment(input: string): string {
  return input.trim().replace(/[^0-9]/g, '');
}

export function normalizeProgrammeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
