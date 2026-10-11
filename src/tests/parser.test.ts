import { describe, it, expect } from 'vitest';
import {
  parseGradeCardInAnyEnvironment,
  parseGradeCardText,
} from '@/lib/ignou-grade-card-parser';

describe('Grade Card HTML & Text Parser', () => {
  const sampleBcaHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <div id="student-info">
        <p>Enrolment Number: 195412345</p>
        <p>Student Name: RAHUL KUMAR</p>
        <p>Programme Code: BCA</p>
      </div>
      <table border="1" class="tbl-gradecard">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Assignment 1</th>
            <th>Term End Theory</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>BCS-011</td>
            <td>75</td>
            <td>64</td>
            <td>COMPLETED</td>
          </tr>
          <tr>
            <td>BCS-012</td>
            <td>80</td>
            <td>56</td>
            <td>COMPLETED</td>
          </tr>
          <tr>
            <td>BCSL-013</td>
            <td>85</td>
            <td>-</td>
            <td>NOT COMPLETED</td>
          </tr>
          <tr>
            <td>FEG-02</td>
            <td>NA</td>
            <td>AB</td>
            <td>NOT COMPLETED</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  it('correctly extracts student details and marks from HTML table', () => {
    const result = parseGradeCardInAnyEnvironment(sampleBcaHtml);

    expect(result.enrollmentNumber).toBe('195412345');
    expect(result.studentName).toContain('RAHUL KUMAR');
    expect(result.programmeCode).toBe('BCA');
    expect(result.courses.length).toBe(4);

    // BCS-011
    const bcs11 = result.courses.find((c) => c.courseCode === 'BCS-011');
    expect(bcs11).toBeDefined();
    expect(bcs11?.assignmentMarks).toBe(75);
    expect(bcs11?.theoryMarks).toBe(64);
    expect(bcs11?.rawStatus).toBe('COMPLETED');

    // BCSL-013 with pending theory '-'
    const bcsl13 = result.courses.find((c) => c.courseCode === 'BCSL-013');
    expect(bcsl13).toBeDefined();
    expect(bcsl13?.assignmentMarks).toBe(85);
    expect(bcsl13?.theoryMarks).toBeNull();
    expect(bcsl13?.rawStatus).toBe('NOT COMPLETED');

    // FEG-02 with 'NA' and 'AB'
    const feg02 = result.courses.find((c) => c.courseCode === 'FEG-02');
    expect(feg02).toBeDefined();
    expect(feg02?.assignmentMarks).toBeNull();
    expect(feg02?.theoryMarks).toBeNull();
  });

  it('detects duplicate course codes and registers warnings', () => {
    const duplicateHtml = `
      <table>
        <tr>
          <th>Course</th>
          <th>Assignment</th>
          <th>Theory</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>MCS-011</td>
          <td>45</td>
          <td>30</td>
          <td>NOT COMPLETED</td>
        </tr>
        <tr>
          <td>MCS-011</td>
          <td>45</td>
          <td>55</td>
          <td>COMPLETED</td>
        </tr>
      </table>
    `;
    const res = parseGradeCardInAnyEnvironment(duplicateHtml);
    expect(res.courses.length).toBe(2);
    expect(res.warnings.some((w) => w.includes('MCS-011'))).toBe(true);
  });

  it('handles CBCS style table with upper case columns', () => {
    const cbcsHtml = `
      <table>
        <tr>
          <th>COURSE</th>
          <th>ASGN1</th>
          <th>LAB1</th>
          <th>THEORY</th>
          <th>STATUS</th>
        </tr>
        <tr>
          <td>BEGAE-182</td>
          <td>78</td>
          <td>-</td>
          <td>62</td>
          <td>COMPLETED</td>
        </tr>
      </table>
    `;
    const res = parseGradeCardInAnyEnvironment(cbcsHtml);
    expect(res.courses.length).toBe(1);
    expect(res.courses[0].courseCode).toBe('BEGAE-182');
    expect(res.courses[0].assignmentMarks).toBe(78);
    expect(res.courses[0].theoryMarks).toBe(62);
  });

  it('parses pasted plain-text tab-delimited or space-aligned table data', () => {
    const rawText = `
      Enrolment No: 2001234567
      Programme: BAG
      BEGAE-182\t82\t70\tCOMPLETED
      BHIC-131\t75\t60\tCOMPLETED
      BPSC-131\t-\t55\tNOT COMPLETED
    `;
    const res = parseGradeCardText(rawText);
    expect(res.enrollmentNumber).toBe('2001234567');
    expect(res.programmeCode).toBe('BAG');
    expect(res.courses.length).toBe(3);
    expect(res.courses[0].courseCode).toBe('BEGAE-182');
    expect(res.courses[0].assignmentMarks).toBe(82);
    expect(res.courses[0].theoryMarks).toBe(70);
    expect(res.courses[2].assignmentMarks).toBeNull();
  });

  it('parses multi-column lab courses and averages LAB marks into practicalMarks', () => {
    const multiLabHtml = `
      <table>
        <tr>
          <th>COURSE</th>
          <th>Asgn1</th>
          <th>LAB1</th>
          <th>LAB2</th>
          <th>LAB3</th>
          <th>LAB4</th>
          <th>TERM END THEORY</th>
          <th>STATUS</th>
        </tr>
        <tr>
          <td>MCS211</td>
          <td>74</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>40</td>
          <td>COMPLETED</td>
        </tr>
        <tr>
          <td>MCSL216</td>
          <td>71</td>
          <td>84</td>
          <td>76</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>COMPLETED</td>
        </tr>
        <tr>
          <td>MCSL217</td>
          <td>85</td>
          <td>94</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>COMPLETED</td>
        </tr>
      </table>
    `;
    const res = parseGradeCardInAnyEnvironment(multiLabHtml);
    expect(res.courses.length).toBe(3);

    // MCS211: theory course
    expect(res.courses[0].courseCode).toBe('MCS211');
    expect(res.courses[0].assignmentMarks).toBe(74);
    expect(res.courses[0].theoryMarks).toBe(40);
    expect(res.courses[0].practicalMarks).toBeNull();

    // MCSL216: 2 labs: average of 84 and 76 = 80
    expect(res.courses[1].courseCode).toBe('MCSL216');
    expect(res.courses[1].assignmentMarks).toBe(71);
    expect(res.courses[1].practicalMarks).toBe(80);
    expect(res.courses[1].theoryMarks).toBeNull();

    // MCSL217: 1 lab: 94
    expect(res.courses[2].courseCode).toBe('MCSL217');
    expect(res.courses[2].assignmentMarks).toBe(85);
    expect(res.courses[2].practicalMarks).toBe(94);
  });

  it('handles empty or malformed HTML safely without throwing', () => {
    const res = parseGradeCardInAnyEnvironment('<html><body><div>No data available</div></body></html>');
    expect(res.courses).toEqual([]);
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
