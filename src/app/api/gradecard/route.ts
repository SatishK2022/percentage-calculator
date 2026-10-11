import { NextRequest, NextResponse } from 'next/server';
import { parseGradeCardInAnyEnvironment } from '@/lib/ignou-grade-card-parser';

function getGradeCardCategory(programmeCode: string): string {
  const code = programmeCode.toUpperCase().trim();
  if (
    ['BCA', 'MCA', 'MCA_NEW', 'MP', 'MPB', 'PGDCA', 'PGDCA_NEW', 'MBA', 'MBF'].includes(code)
  ) {
    return '1';
  }
  if (['BDP', 'BA', 'BCOM', 'BSC', 'ASSO'].includes(code)) {
    return '2';
  }
  if (['BAG', 'BCOMG', 'BSCG'].includes(code) || code.endsWith('G')) {
    return '4';
  }
  return '3'; // Other programmes
}

export async function POST(req: NextRequest) {
  try {
    const { enrollmentNumber, programmeCode } = await req.json();

    const cleanEnr = (enrollmentNumber || '').toString().trim();
    const cleanProg = (programmeCode || '').toString().trim().toUpperCase();

    if (!cleanEnr || !cleanProg) {
      return NextResponse.json(
        { success: false, error: 'Enrollment number and programme code are required.' },
        { status: 400 }
      );
    }

    const category = getGradeCardCategory(cleanProg);

    // Step 1: GET initial page to extract ASP.NET tokens
    const getRes = await fetch('https://gradecard.ignou.ac.in/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml',
      },
      cache: 'no-store',
    });

    if (!getRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Official portal unavailable (HTTP ${getRes.status}).`,
        },
        { status: 502 }
      );
    }

    const initialHtml = await getRes.text();
    let vs = initialHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/)?.[1] || '';
    let ev = initialHtml.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/)?.[1] || '';
    const vsg =
      initialHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/)?.[1] || 'C2EE9ABB';

    // Step 2: Trigger ASP.NET AJAX UpdatePanel to populate programme list and get updated ViewState
    const updateParams = new URLSearchParams();
    updateParams.set('ScriptManager1', 'UpdatePanel1|ddlGradecardfor');
    updateParams.set('__EVENTTARGET', 'ddlGradecardfor');
    updateParams.set('__EVENTARGUMENT', '');
    updateParams.set('__LASTFOCUS', '');
    updateParams.set('__VIEWSTATE', vs);
    updateParams.set('__VIEWSTATEGENERATOR', vsg);
    updateParams.set('__VIEWSTATEENCRYPTED', '');
    updateParams.set('__EVENTVALIDATION', ev);
    updateParams.set('ddlGradecardfor', category);
    updateParams.set('__ASYNCPOST', 'true');

    const updateRes = await fetch('https://gradecard.ignou.ac.in/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-MicrosoftAjax': 'Delta=true',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: updateParams.toString(),
      cache: 'no-store',
    });

    const deltaText = await updateRes.text();
    const vsMatch = deltaText.match(/\|hiddenField\|__VIEWSTATE\|([^|]+)\|/);
    const evMatch = deltaText.match(/\|hiddenField\|__EVENTVALIDATION\|([^|]+)\|/);
    if (vsMatch) vs = vsMatch[1];
    if (evMatch) ev = evMatch[1];

    // Step 3: Submit search form
    const searchParams = new URLSearchParams();
    searchParams.set('__EVENTTARGET', '');
    searchParams.set('__EVENTARGUMENT', '');
    searchParams.set('__LASTFOCUS', '');
    searchParams.set('__VIEWSTATE', vs);
    searchParams.set('__VIEWSTATEGENERATOR', vsg);
    searchParams.set('__VIEWSTATEENCRYPTED', '');
    searchParams.set('__EVENTVALIDATION', ev);
    searchParams.set('ddlGradecardfor', category);
    searchParams.set('ddlProgram', cleanProg);
    searchParams.set('txtEnrno', cleanEnr);
    searchParams.set('btnlogin', 'Search');

    const searchRes = await fetch('https://gradecard.ignou.ac.in/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://gradecard.ignou.ac.in/',
      },
      body: searchParams.toString(),
      cache: 'no-store',
    });

    const resultHtml = await searchRes.text();

    // Check for not found alert
    if (
      resultHtml.includes('not found') ||
      resultHtml.includes('Kindly try again') ||
      resultHtml.includes('This Enrolment No is not found')
    ) {
      return NextResponse.json({
        success: false,
        error: `Enrolment number ${cleanEnr} was not found for programme ${cleanProg} on the official IGNOU portal. Please verify your details or check if results have been updated.`,
      });
    }

    // Parse returned HTML
    const parsed = parseGradeCardInAnyEnvironment(resultHtml);

    if (parsed.courses.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No course marks records were found for Enrolment No. ${cleanEnr} (${cleanProg}). The grade card may not yet be published for this session.`,
        rawHtml: resultHtml,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'official_fetch',
      enrollmentNumber: parsed.enrollmentNumber || cleanEnr,
      programmeCode: parsed.programmeCode || cleanProg,
      studentName: parsed.studentName,
      courses: parsed.courses,
      rawHtml: resultHtml,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve grade card from official portal: ${msg}`,
      },
      { status: 500 }
    );
  }
}
