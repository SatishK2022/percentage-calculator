'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseGradeCardHtml, parseGradeCardText } from '@/lib/ignou-grade-card-parser';
import { CourseRawRecord, GradeCardFetchResult } from '@/types/ignou';
import { Clipboard, Upload, Plus, Trash2, CheckCircle2, Sparkles, FileCode } from 'lucide-react';

interface ManualImportProps {
  onImportSuccess: (data: GradeCardFetchResult) => void;
  defaultProgramme?: string;
}

export function ManualGradeCardImport({ onImportSuccess, defaultProgramme = 'BCA' }: ManualImportProps) {
  const [activeTab, setActiveTab] = React.useState<'paste' | 'upload' | 'manual'>('paste');
  const [pasteContent, setPasteContent] = React.useState('');
  const [importError, setImportError] = React.useState<string | null>(null);

  // Manual entry rows state
  const [manualCourses, setManualCourses] = React.useState<CourseRawRecord[]>([
    { courseCode: 'BCS-011', assignmentMarks: 78, theoryMarks: 65, credits: 3 },
    { courseCode: 'BCS-012', assignmentMarks: 82, theoryMarks: 58, credits: 4 },
    { courseCode: 'BCSL-013', assignmentMarks: 85, theoryMarks: 72, credits: 2 },
    { courseCode: 'FEG-02', assignmentMarks: 70, theoryMarks: 62, credits: 4 },
  ]);

  const handlePasteImport = () => {
    setImportError(null);
    if (!pasteContent.trim()) {
      setImportError('Please paste your grade card table text or HTML source.');
      return;
    }

    try {
      const parsed = pasteContent.includes('<table') || pasteContent.includes('<tr')
        ? parseGradeCardHtml(pasteContent)
        : parseGradeCardText(pasteContent);

      if (parsed.courses.length === 0) {
        setImportError('No course rows could be identified. Ensure course codes (e.g. BCS-011) and marks are present.');
        return;
      }

      onImportSuccess({
        success: true,
        source: 'pasted_text',
        enrollmentNumber: parsed.enrollmentNumber,
        programmeCode: parsed.programmeCode || defaultProgramme,
        studentName: parsed.studentName,
        courses: parsed.courses,
        rawHtml: pasteContent,
      });
    } catch {
      setImportError('Failed to parse the provided text. Please verify the format or use Manual Entry.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm') && !file.name.endsWith('.txt')) {
      setImportError('Please select a valid .html, .htm, or .txt grade card file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsed = parseGradeCardHtml(content);
      if (parsed.courses.length === 0) {
        setImportError('No course rows found in this file. Please verify it is an official IGNOU grade card page.');
        return;
      }

      onImportSuccess({
        success: true,
        source: 'html_import',
        enrollmentNumber: parsed.enrollmentNumber,
        programmeCode: parsed.programmeCode || defaultProgramme,
        studentName: parsed.studentName,
        courses: parsed.courses,
        rawHtml: content,
      });
    };
    reader.onerror = () => {
      setImportError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleAddManualRow = () => {
    setManualCourses((prev) => [
      ...prev,
      { courseCode: '', assignmentMarks: null, theoryMarks: null, credits: 4 },
    ]);
  };

  const handleRemoveManualRow = (index: number) => {
    setManualCourses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleManualRowChange = (index: number, field: keyof CourseRawRecord, value: string) => {
    setManualCourses((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'courseCode') {
        target.courseCode = value.toUpperCase();
      } else if (field === 'assignmentMarks' || field === 'theoryMarks' || field === 'credits') {
        const num = value.trim() === '' ? null : parseFloat(value);
        (target as Record<string, unknown>)[field] = num === null || isNaN(num) ? null : num;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleManualSubmit = () => {
    setImportError(null);
    const validCourses = manualCourses.filter((c) => c.courseCode.trim().length > 0);

    if (validCourses.length === 0) {
      setImportError('Please add at least one valid course with a course code.');
      return;
    }

    onImportSuccess({
      success: true,
      source: 'manual_entry',
      programmeCode: defaultProgramme,
      courses: validCourses,
    });
  };

  const loadSampleData = () => {
    const sampleHtml = `<table class="tbl-gradecard">
<tr><th>Course Code</th><th>Assignment 1</th><th>Term End Theory</th><th>Status</th></tr>
<tr><td>BCS-011</td><td>78</td><td>66</td><td>COMPLETED</td></tr>
<tr><td>BCS-012</td><td>84</td><td>58</td><td>COMPLETED</td></tr>
<tr><td>BCSL-013</td><td>86</td><td>74</td><td>COMPLETED</td></tr>
<tr><td>FEG-02</td><td>72</td><td>60</td><td>COMPLETED</td></tr>
<tr><td>BCS-031</td><td>80</td><td>70</td><td>COMPLETED</td></tr>
<tr><td>BCS-040</td><td>75</td><td>64</td><td>COMPLETED</td></tr>
</table>`;
    setPasteContent(sampleHtml);
    setImportError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Direct Grade Card Import</CardTitle>
            <CardDescription>
              Paste your grade card table, upload saved HTML, or enter marks manually.
            </CardDescription>
          </div>

          {/* Segmented Switcher */}
          <div className="flex overflow-hidden rounded-md border border-neutral-300 bg-white/70 p-0.5 text-xs font-medium dark:border-white/10 dark:bg-black/40 self-start">
            <button
              type="button"
              onClick={() => { setActiveTab('paste'); setImportError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                activeTab === 'paste'
                  ? 'bg-amber-100 text-amber-900 font-semibold dark:bg-amber-950/60 dark:text-orange-100'
                  : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Clipboard className="size-3.5" aria-hidden="true" />
              Paste Table
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setImportError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                activeTab === 'upload'
                  ? 'bg-amber-100 text-amber-900 font-semibold dark:bg-amber-950/60 dark:text-orange-100'
                  : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Upload HTML
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('manual'); setImportError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                activeTab === 'manual'
                  ? 'bg-amber-100 text-amber-900 font-semibold dark:bg-amber-950/60 dark:text-orange-100'
                  : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Manual Entry
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {importError && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            {importError}
          </div>
        )}

        {/* Tab 1: Paste Text/HTML */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="paste-textarea" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Paste Grade Card Content (HTML source or copied table text):
              </label>
              <button
                type="button"
                onClick={loadSampleData}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-brand dark:text-neutral-400 cursor-pointer"
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                Fill Sample BCA Data
              </button>
            </div>
            <textarea
              id="paste-textarea"
              rows={6}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste table copied from IGNOU grade card page, or press 'Fill Sample BCA Data' to test..."
              className="w-full rounded-md border border-neutral-300 bg-white/70 p-3 font-mono text-xs text-foreground placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-white/15 dark:bg-black/30 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-500">
                Pasted data is processed 100% inside your browser using DOMParser.
              </span>
              <Button type="button" variant="solid" size="sm" onClick={handlePasteImport}>
                Parse and Calculate
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-card-edge p-8 text-center transition-colors hover:border-card-edge-hover">
              <FileCode className="size-10 text-neutral-400 mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">
                Drop your saved IGNOU Grade Card HTML file here
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Supports .html or .htm saved web pages. Files never leave your browser.
              </p>
              <label className="mt-4">
                <input
                  type="file"
                  accept=".html,.htm,.txt"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                <span className="btn-asym inline-flex h-9 cursor-pointer items-center gap-2 bg-neutral-900 px-4 text-xs font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200">
                  Select File
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Manual Course Entry */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-card-edge text-neutral-500 uppercase tracking-wider font-mono text-[11px]">
                    <th className="pb-2 font-medium">Course Code</th>
                    <th className="pb-2 font-medium">Assignment (/100)</th>
                    <th className="pb-2 font-medium">Theory (/100)</th>
                    <th className="pb-2 font-medium">Credits</th>
                    <th className="pb-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-edge">
                  {manualCourses.map((row, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-2 pr-2">
                        <Input
                          type="text"
                          placeholder="e.g. BCS-011"
                          value={row.courseCode}
                          onChange={(e) => handleManualRowChange(idx, 'courseCode', e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          placeholder="e.g. 75"
                          min={0}
                          max={100}
                          value={row.assignmentMarks ?? ''}
                          onChange={(e) => handleManualRowChange(idx, 'assignmentMarks', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          placeholder="e.g. 60"
                          min={0}
                          max={100}
                          value={row.theoryMarks ?? ''}
                          onChange={(e) => handleManualRowChange(idx, 'theoryMarks', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 pr-2 w-20">
                        <Input
                          type="number"
                          placeholder="4"
                          min={1}
                          max={16}
                          value={row.credits ?? 4}
                          onChange={(e) => handleManualRowChange(idx, 'credits', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveManualRow(idx)}
                          disabled={manualCourses.length <= 1}
                          aria-label={`Remove course ${row.courseCode || idx + 1}`}
                          className="inline-flex size-7 items-center justify-center rounded text-neutral-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddManualRow}>
                <Plus className="size-3.5 -ml-1 mr-1" aria-hidden="true" />
                Add Course Row
              </Button>

              <Button type="button" variant="solid" size="sm" onClick={handleManualSubmit}>
                <CheckCircle2 className="size-3.5 -ml-1 mr-1" aria-hidden="true" />
                Calculate Percentage
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
