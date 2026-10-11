import { GradeCardFetchResult } from '@/types/ignou';
import { parseGradeCardHtml } from '@/lib/ignou-grade-card-parser';

export const OFFICIAL_PORTAL_URL = 'https://gradecard.ignou.ac.in/';

/**
 * Retrieves official grade card data.
 * Tries direct browser access, then seamlessly routes through the local Next.js API
 * route handler (/api/gradecard) to bypass browser CORS restrictions without relying on
 * unverified third-party public proxies.
 */
export async function fetchOfficialGradeCard(
  enrollmentNumber: string,
  programmeCode: string
): Promise<GradeCardFetchResult> {
  const cleanEnr = enrollmentNumber.trim();
  const cleanProg = programmeCode.trim().toUpperCase();

  // Primary: Use local server-side API route to communicate with IGNOU ASP.NET portal
  try {
    const apiRes = await fetch('/api/gradecard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrollmentNumber: cleanEnr,
        programmeCode: cleanProg,
      }),
    });

    if (apiRes.ok) {
      const data: GradeCardFetchResult = await apiRes.json();
      return data;
    } else {
      const errData = await apiRes.json().catch(() => null);
      if (errData && errData.error) {
        return {
          success: false,
          source: 'official_fetch',
          error: errData.error,
          courses: [],
        };
      }
    }
  } catch {
    // If running in an environment without the local API route, fallback to direct fetch inspection
  }

  // Secondary fallback: Direct browser fetch with explicit error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(OFFICIAL_PORTAL_URL, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        source: 'official_fetch',
        error: `Official portal returned HTTP status ${response.status}.`,
        courses: [],
      };
    }

    const htmlText = await response.text();
    const parsed = parseGradeCardHtml(htmlText);

    if (parsed.courses.length === 0) {
      return {
        success: false,
        source: 'official_fetch',
        error: `No course marks records were found for Enrolment No. ${cleanEnr} (${cleanProg}).`,
        courses: [],
      };
    }

    return {
      success: true,
      source: 'official_fetch',
      enrollmentNumber: parsed.enrollmentNumber || cleanEnr,
      programmeCode: parsed.programmeCode || cleanProg,
      studentName: parsed.studentName,
      courses: parsed.courses,
      rawHtml: htmlText,
    };
  } catch {
    clearTimeout(timeoutId);

    return {
      success: false,
      source: 'official_fetch',
      corsBlocked: true,
      error: 'Unable to connect to the IGNOU portal.',
      details:
        'Please try again or use the import options below to paste your grade card table.',
      courses: [],
    };
  }
}
