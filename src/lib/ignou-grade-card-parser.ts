import { CourseRawRecord, GradeCardFetchResult } from '@/types/ignou';

export interface ParsedGradeCardData {
  enrollmentNumber?: string;
  studentName?: string;
  programmeCode?: string;
  courses: CourseRawRecord[];
  warnings: string[];
}

/**
 * Normalizes text by removing non-breaking spaces and collapsing multiple spaces.
 */
function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses a numerical mark or returns null for non-numeric/missing marks.
 * Does NOT treat 0 as missing if "0" or "00" was explicitly entered,
 * but treats "-", "NA", "AB", "ABSENT", or empty cells as null.
 */
function parseMarkValue(val: string): number | null {
  const cleaned = cleanText(val).toUpperCase();
  if (
    !cleaned ||
    cleaned === '-' ||
    cleaned === '--' ||
    cleaned === 'NA' ||
    cleaned === 'N/A' ||
    cleaned === 'NULL' ||
    cleaned === 'AB' ||
    cleaned === 'ABSENT' ||
    cleaned === 'NOT COMPLETED' ||
    cleaned === 'COMPLETED'
  ) {
    return null;
  }

  // Extract valid floating point or integer number
  const match = cleaned.match(/^[0-9]+(\.[0-9]+)?$/);
  if (match) {
    const num = parseFloat(match[0]);
    return isNaN(num) ? null : num;
  }

  return null;
}

/**
 * Identifies column types by inspecting header text.
 */
interface ColumnMapping {
  courseCode: number;
  courseTitle: number;
  assignment: number;
  theory: number;
  practical: number;
  practicals: number[];
  project: number;
  status: number;
}

function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    courseCode: -1,
    courseTitle: -1,
    assignment: -1,
    theory: -1,
    practical: -1,
    practicals: [],
    project: -1,
    status: -1,
  };

  headers.forEach((h, idx) => {
    const text = h.toLowerCase().trim();

    if (text.includes('course code') || text.includes('subject code') || text === 'course' || text === 'sub') {
      if (mapping.courseCode === -1) mapping.courseCode = idx;
    } else if (text.includes('course title') || text.includes('subject name') || text.includes('title')) {
      if (mapping.courseTitle === -1) mapping.courseTitle = idx;
    } else if (
      text.includes('asgn') ||
      text.includes('assignment') ||
      text.includes('assign') ||
      text.includes('continuous') ||
      text.includes('tma')
    ) {
      if (mapping.assignment === -1) mapping.assignment = idx;
    } else if (
      text.includes('theory') ||
      text.includes('tee') ||
      text.includes('term end theory') ||
      (text.includes('term end') && !text.includes('practical') && !text.includes('lab'))
    ) {
      if (mapping.theory === -1) mapping.theory = idx;
    } else if (
      text.includes('practical') ||
      text.includes('lab') ||
      text.includes('viva') ||
      text.includes('tepe')
    ) {
      if (mapping.practical === -1) mapping.practical = idx;
      mapping.practicals.push(idx);
    } else if (text.includes('project') || text.includes('dissertation') || text.includes('proj')) {
      if (mapping.project === -1) mapping.project = idx;
    } else if (text.includes('status') || text.includes('remarks') || text.includes('result')) {
      if (mapping.status === -1) mapping.status = idx;
    }
  });

  return mapping;
}

/**
 * Parses grade card HTML using the browser's DOMParser.
 */
export function parseGradeCardHtml(htmlContent: string): ParsedGradeCardData {
  const warnings: string[] = [];
  const courses: CourseRawRecord[] = [];
  let enrollmentNumber: string | undefined;
  let studentName: string | undefined;
  let programmeCode: string | undefined;

  if (typeof window === 'undefined') {
    // If running in Node.js test environment without DOMParser, dynamic import jsdom if needed
    // or use a safe basic extractor
    return parseGradeCardInAnyEnvironment(htmlContent);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // 1. Extract student metadata if present in tables or spans
  const bodyText = doc.body ? doc.body.innerText || doc.body.textContent || '' : '';

  // 1. Look for specific ASP.NET label IDs for student info
  const aspName = doc.querySelector('[id*="lblDispname"], [id*="lblStudentName"]');
  if (aspName) {
    const raw = cleanText(aspName.textContent || '');
    if (raw && !raw.toUpperCase().includes('GRADE CARD')) {
      studentName = raw;
    }
  }

  const aspEnr = doc.querySelector('[id*="lblDispEnrolno" i], [id*="lblDispenrno" i]');
  if (aspEnr && /^[0-9]{9,10}$/.test(cleanText(aspEnr.textContent || ''))) {
    enrollmentNumber = cleanText(aspEnr.textContent || '');
  }

  const aspProg = doc.querySelector('[id*="lblDispProgCode" i], [id*="lblDispprog" i]');
  if (aspProg && aspProg.textContent?.trim()) {
    programmeCode = cleanText(aspProg.textContent).toUpperCase();
  }

  // Fallback to bodyText regex
  if (!enrollmentNumber) {
    const enrMatch = bodyText.match(/(?:Enrolment\s*No\.?|Enrollment\s*Number|Enrolment\s*Number)[:\s]+([0-9]{9,10})/i);
    if (enrMatch) {
      enrollmentNumber = enrMatch[1];
    }
  }

  if (!programmeCode) {
    const progMatch = bodyText.match(/(?:Program(?:me)?(?:\s*Code)?|Course)[:\s]+([A-Za-z0-9_]{2,12})/i);
    if (progMatch) {
      programmeCode = progMatch[1].toUpperCase();
    }
  }

  if (!studentName) {
    const nameMatch = bodyText.match(/(?:Student\s*Name|Name)[:\s]+([A-Za-z\s.]{3,50})(?:\n|\r|&nbsp;|<|$)/i);
    if (nameMatch) {
      const raw = cleanText(nameMatch[1]);
      if (!raw.toUpperCase().includes('GRADE CARD') && !raw.toUpperCase().includes('ENROLMENT')) {
        studentName = raw;
      }
    }
  }

  // 2. Find marks tables
  const tables = Array.from(doc.querySelectorAll('table'));
  let marksTable: HTMLTableElement | null = null;
  let mapping: ColumnMapping = {
    courseCode: -1,
    courseTitle: -1,
    assignment: -1,
    theory: -1,
    practical: -1,
    practicals: [],
    project: -1,
    status: -1,
  };

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) continue;

    // Check row 0 or 1 for headers
    for (let r = 0; r < Math.min(3, rows.length); r++) {
      const cells = Array.from(rows[r].querySelectorAll('th, td')).map((c) => cleanText(c.textContent));
      const testMapping = detectColumnMapping(cells);
      // Valid table must have a course code column and at least one assessment or status column
      if (
        testMapping.courseCode !== -1 &&
        (testMapping.assignment !== -1 || testMapping.theory !== -1 || testMapping.status !== -1)
      ) {
        marksTable = table;
        mapping = testMapping;
        break;
      }
    }
    if (marksTable) break;
  }

  if (!marksTable) {
    warnings.push('Could not locate a recognizable marks table with course codes.');
    // Try parsing plain text or unstructured rows
    return parseGradeCardText(bodyText);
  }

  const rows = Array.from(marksTable.querySelectorAll('tr'));
  // Find index where table data starts (after header row)
  let dataStartIndex = 1;
  for (let i = 0; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('th, td')).map((c) => cleanText(c.textContent));
    const testMapping = detectColumnMapping(cells);
    if (testMapping.courseCode !== -1) {
      dataStartIndex = i + 1;
      break;
    }
  }

  const courseCodesSeen = new Set<string>();

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i];
    const cells = Array.from(row.querySelectorAll('td')).map((c) => cleanText(c.textContent));
    if (cells.length === 0) continue;

    const rawCourse = mapping.courseCode !== -1 && mapping.courseCode < cells.length ? cells[mapping.courseCode] : '';
    // Check if course matches standard IGNOU course pattern (e.g. BCS-011, BCSL013, MCS011, FEG-02, BEGAE182, etc.)
    const courseCodeMatch = rawCourse.match(/^[A-Za-z]{2,5}[-\s]?[0-9]{2,4}[A-Za-z]?$/);
    if (!courseCodeMatch) {
      // Not a valid course row (could be subheader, total row or footer)
      continue;
    }

    const courseCode = rawCourse.toUpperCase().replace(/\s+/g, '');
    const courseTitle =
      mapping.courseTitle !== -1 && mapping.courseTitle < cells.length ? cells[mapping.courseTitle] : undefined;

    const assignmentMarks =
      mapping.assignment !== -1 && mapping.assignment < cells.length
        ? parseMarkValue(cells[mapping.assignment])
        : null;

    const theoryMarks =
      mapping.theory !== -1 && mapping.theory < cells.length ? parseMarkValue(cells[mapping.theory]) : null;

    let practicalMarks: number | null = null;
    const labMarks: (number | null)[] = [];

    if (mapping.practicals.length > 0) {
      const validScores: number[] = [];
      for (const pIdx of mapping.practicals) {
        if (pIdx < cells.length) {
          const parsedVal = parseMarkValue(cells[pIdx]);
          labMarks.push(parsedVal);
          if (parsedVal !== null) {
            validScores.push(parsedVal);
          }
        }
      }
      if (validScores.length > 0) {
        const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        practicalMarks = Number(avg.toFixed(2));
      }
    } else if (mapping.practical !== -1 && mapping.practical < cells.length) {
      practicalMarks = parseMarkValue(cells[mapping.practical]);
      if (practicalMarks !== null) labMarks.push(practicalMarks);
    }

    const projectMarks =
      mapping.project !== -1 && mapping.project < cells.length ? parseMarkValue(cells[mapping.project]) : null;

    const rawStatus = mapping.status !== -1 && mapping.status < cells.length ? cells[mapping.status] : '';

    if (courseCodesSeen.has(courseCode)) {
      warnings.push(`Course ${courseCode} appears multiple times in the grade card (duplicate or re-attempt).`);
    } else {
      courseCodesSeen.add(courseCode);
    }

    courses.push({
      courseCode,
      courseTitle: courseTitle || undefined,
      assignmentMarks,
      theoryMarks,
      practicalMarks,
      labMarks: labMarks.length > 0 ? labMarks : undefined,
      projectMarks,
      rawStatus: rawStatus || undefined,
    });
  }

  return {
    enrollmentNumber,
    studentName,
    programmeCode,
    courses,
    warnings,
  };
}

/**
 * Universal HTML parser that works seamlessly in browser (DOMParser) and Node.js/Vitest (regex/DOM).
 */
export function parseGradeCardInAnyEnvironment(htmlContent: string): ParsedGradeCardData {
  if (typeof DOMParser !== 'undefined') {
    return parseGradeCardHtml(htmlContent);
  }

  // Fallback regex-based parser for non-browser Node environments where DOMParser is not mocked
  const warnings: string[] = [];
  const courses: CourseRawRecord[] = [];

  let enrollmentNumber: string | undefined;
  let programmeCode: string | undefined;
  let studentName: string | undefined;

  // Match ASP.NET label IDs from official portal
  const aspNameMatch = htmlContent.match(/id="[^"]*lblDispname"[^>]*>([\s\S]*?)<\/span>/i);
  if (aspNameMatch) {
    const raw = cleanText(aspNameMatch[1].replace(/<[^>]+>/g, ''));
    if (raw && !raw.toUpperCase().includes('GRADE CARD')) {
      studentName = raw;
    }
  }

  const aspEnrMatch = htmlContent.match(/id="[^"]*lblDisp(?:Enrolno|enrno)"[^>]*>([\s\S]*?)<\/span>/i);
  if (aspEnrMatch) {
    const raw = cleanText(aspEnrMatch[1].replace(/<[^>]+>/g, ''));
    if (/^[0-9]{9,10}$/.test(raw)) {
      enrollmentNumber = raw;
    }
  }

  const aspProgMatch = htmlContent.match(/id="[^"]*lblDisp(?:ProgCode|prog)"[^>]*>([\s\S]*?)<\/span>/i);
  if (aspProgMatch) {
    const raw = cleanText(aspProgMatch[1].replace(/<[^>]+>/g, ''));
    if (raw) {
      programmeCode = raw.toUpperCase();
    }
  }

  // Regex fallbacks
  if (!enrollmentNumber) {
    const enrMatch = htmlContent.match(/(?:Enrolment|Enrollment)\s*(?:No\.?|Number)?[:\s]+([0-9]{9,10})/i);
    if (enrMatch) enrollmentNumber = enrMatch[1];
  }

  if (!programmeCode) {
    const progMatch = htmlContent.match(/(?:Program(?:me)?(?:\s*Code)?|Course)[:\s]+([A-Za-z0-9_]{2,12})/i);
    if (progMatch) programmeCode = progMatch[1].toUpperCase();
  }

  if (!studentName) {
    const nameMatch = htmlContent.match(/(?:Student\s*Name|Name)[:\s]*(?:<[^>]+>\s*)*([A-Za-z\s.]{3,50})(?:<|\n|\r)/i);
    if (nameMatch) {
      const raw = cleanText(nameMatch[1]);
      if (!raw.toUpperCase().includes('GRADE CARD') && !raw.toUpperCase().includes('ENROLMENT')) {
        studentName = raw;
      }
    }
  }

  // Extract table rows with regex: <tr>...<td>...</td>...</tr>
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  const tableRows: string[][] = [];

  while ((trMatch = trRegex.exec(htmlContent)) !== null) {
    const rowHtml = trMatch[1];
    const tdRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let tdMatch;
    const rowCells: string[] = [];
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const text = tdMatch[1].replace(/<[^>]+>/g, '').trim();
      rowCells.push(cleanText(text));
    }
    if (rowCells.length > 0) {
      tableRows.push(rowCells);
    }
  }

  let mapping: ColumnMapping = {
    courseCode: -1,
    courseTitle: -1,
    assignment: -1,
    theory: -1,
    practical: -1,
    practicals: [],
    project: -1,
    status: -1,
  };

  let dataStartIndex = 1;
  for (let i = 0; i < tableRows.length; i++) {
    const testMapping = detectColumnMapping(tableRows[i]);
    if (
      testMapping.courseCode !== -1 &&
      (testMapping.assignment !== -1 || testMapping.theory !== -1 || testMapping.status !== -1)
    ) {
      mapping = testMapping;
      dataStartIndex = i + 1;
      break;
    }
  }

  const seen = new Set<string>();
  for (let i = dataStartIndex; i < tableRows.length; i++) {
    const cells = tableRows[i];
    const rawCourse = mapping.courseCode !== -1 && mapping.courseCode < cells.length ? cells[mapping.courseCode] : '';
    const match = rawCourse.match(/^[A-Za-z]{2,5}[-\s]?[0-9]{2,4}[A-Za-z]?$/);
    if (!match) continue;

    const courseCode = rawCourse.toUpperCase().replace(/\s+/g, '');
    if (seen.has(courseCode)) {
      warnings.push(`Course ${courseCode} appears multiple times.`);
    } else {
      seen.add(courseCode);
    }

    courses.push({
      courseCode,
      courseTitle:
        mapping.courseTitle !== -1 && mapping.courseTitle < cells.length ? cells[mapping.courseTitle] : undefined,
      assignmentMarks:
        mapping.assignment !== -1 && mapping.assignment < cells.length
          ? parseMarkValue(cells[mapping.assignment])
          : null,
      theoryMarks:
        mapping.theory !== -1 && mapping.theory < cells.length ? parseMarkValue(cells[mapping.theory]) : null,
      practicalMarks: (() => {
        if (mapping.practicals.length > 0) {
          const validScores: number[] = [];
          for (const pIdx of mapping.practicals) {
            if (pIdx < cells.length) {
              const parsedVal = parseMarkValue(cells[pIdx]);
              if (parsedVal !== null) validScores.push(parsedVal);
            }
          }
          if (validScores.length > 0) {
            return Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2));
          }
        }
        return mapping.practical !== -1 && mapping.practical < cells.length
          ? parseMarkValue(cells[mapping.practical])
          : null;
      })(),
      projectMarks:
        mapping.project !== -1 && mapping.project < cells.length ? parseMarkValue(cells[mapping.project]) : null,
      rawStatus: mapping.status !== -1 && mapping.status < cells.length ? cells[mapping.status] : undefined,
    });
  }

  if (courses.length === 0) {
    warnings.push('No course marks found in the provided HTML.');
  }

  return {
    enrollmentNumber,
    studentName,
    programmeCode,
    courses,
    warnings,
  };
}

/**
 * Fallback parser for pasted text / clipboard data.
 * Supports lines copied from spreadsheet or webpage tables.
 */
export function parseGradeCardText(text: string): ParsedGradeCardData {
  const warnings: string[] = [];
  const courses: CourseRawRecord[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let enrollmentNumber: string | undefined;
  let programmeCode: string | undefined;

  for (const line of lines) {
    if (!enrollmentNumber) {
      const enrMatch = line.match(/(?:Enrolment|Enrollment)\s*(?:No|Number)?[:\s]+([0-9]{9,10})/i);
      if (enrMatch) enrollmentNumber = enrMatch[1];
    }
    if (!programmeCode) {
      const progMatch = line.match(/(?:Programme|Program)\s*(?:Code)?[:\s]+([A-Za-z0-9_]{2,10})/i);
      if (progMatch) programmeCode = progMatch[1].toUpperCase();
    }

    // Split on tabs or multiple spaces
    const parts = line.split(/\t+|\s{2,}/).map((p) => p.trim());
    if (parts.length < 2) continue;

    // Check if first column is course code
    const firstCol = parts[0].toUpperCase().replace(/\s+/g, '');
    const isCourse = firstCol.match(/^[A-Za-z]{2,5}[-\s]?[0-9]{2,4}[A-Za-z]?$/);
    if (!isCourse) continue;

    const courseCode = firstCol;
    let assignmentMarks: number | null = null;
    let theoryMarks: number | null = null;
    let practicalMarks: number | null = null;
    let rawStatus = '';

    // Collect marks and status from remaining columns
    const numValues: number[] = [];
    for (let i = 1; i < parts.length; i++) {
      const val = parts[i].toUpperCase();
      if (val.includes('COMPLETED') || val.includes('NOT COMPLETED') || val === 'PASS' || val === 'FAIL') {
        rawStatus = val;
      } else {
        const parsed = parseMarkValue(val);
        if (parsed !== null) {
          numValues.push(parsed);
        }
      }
    }

    // Assign marks based on count
    if (numValues.length === 1) {
      theoryMarks = numValues[0];
    } else if (numValues.length === 2) {
      assignmentMarks = numValues[0];
      theoryMarks = numValues[1];
    } else if (numValues.length >= 3) {
      assignmentMarks = numValues[0];
      practicalMarks = numValues[1];
      theoryMarks = numValues[2];
    }

    courses.push({
      courseCode,
      assignmentMarks,
      theoryMarks,
      practicalMarks,
      rawStatus: rawStatus || undefined,
    });
  }

  return {
    enrollmentNumber,
    programmeCode,
    courses,
    warnings,
  };
}
