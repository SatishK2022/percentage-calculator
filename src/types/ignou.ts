export type AggregationMethod =
  | 'credit_weighted'
  | 'raw_aggregate'
  | 'weighted_course_average'
  | 'programme_specific';

export interface AssessmentWeightage {
  assignment: number; // e.g. 0.30 (30%)
  theory: number;     // e.g. 0.70 (70%)
  practical?: number; // e.g. practical weightage if split
  project?: number;
}

export interface ProgrammeRule {
  programmeCode: string;
  programmeName: string;
  applicableCurriculum: string;
  defaultAssessmentWeightage: AssessmentWeightage;
  courseSpecificWeightages?: Record<string, AssessmentWeightage>;
  defaultMaxMarks: {
    assignment: number;
    theory: number;
    practical?: number;
  };
  passMarks: {
    assignmentPercent: number; // e.g. 40 or 35
    theoryPercent: number;     // e.g. 40 or 35
    overallPercent: number;    // e.g. 40 or 35
  };
  defaultCreditsPerCourse: number;
  courseCredits?: Record<string, number>;
  aggregationMethod: AggregationMethod;
  roundingDecimals: number;
  officialSourceReference: string;
  verificationDate: string;
  isVerified: boolean;
  notes?: string;
}

export interface CourseRawRecord {
  courseCode: string;
  courseTitle?: string;
  assignmentMarks?: number | null; // null if pending / not submitted / not applicable
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  labMarks?: (number | null)[]; // multiple lab components (LAB1, LAB2, etc.)
  projectMarks?: number | null;
  assignmentMaxMarks?: number;
  theoryMaxMarks?: number;
  practicalMaxMarks?: number;
  credits?: number;
  rawStatus?: string; // e.g. "COMPLETED", "NOT COMPLETED", "AB"
}

export interface CourseEvaluation {
  courseCode: string;
  courseTitle?: string;
  assignmentMarks: number | null;
  theoryMarks: number | null;
  practicalMarks: number | null;
  projectMarks: number | null;
  assignmentMaxMarks: number;
  theoryMaxMarks: number;
  credits: number;
  courseScore: number | null; // Weighted score out of 100
  coursePercentage: number | null;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
  statusText: string;
  weightageUsed: AssessmentWeightage;
  calculationExplanation: string;
}

export interface OverallCalculationResult {
  enrollmentNumber?: string;
  studentName?: string;
  programmeCode: string;
  programmeRule: ProgrammeRule;
  isEstimate: boolean;
  estimateReason?: string;
  totalCoursesCount: number;
  completedCoursesCount: number;
  pendingCoursesCount: number;
  failedCoursesCount: number;
  totalCreditsEnrolled: number;
  totalCreditsCompleted: number;
  totalMarksObtained: number | null;
  totalMaxMarks: number | null;
  rawAggregatePercentage: number | null;
  creditWeightedPercentage: number | null;
  overallPercentage: number | null;
  evaluations: CourseEvaluation[];
  division?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UNRESOLVED';
  methodologyDescription: string;
  calculatedAt: string;
}

export interface GradeCardFetchResult {
  success: boolean;
  source: 'official_fetch' | 'html_import' | 'pasted_text' | 'manual_entry';
  enrollmentNumber?: string;
  programmeCode?: string;
  studentName?: string;
  courses: CourseRawRecord[];
  rawHtml?: string;
  error?: string;
  corsBlocked?: boolean;
  captchaRequired?: boolean;
  maintenance?: boolean;
  details?: string;
}
