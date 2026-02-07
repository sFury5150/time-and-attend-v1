/**
 * Report Generator Utility
 * Generates PDF reports for attendance, shifts, and analytics
 * Uses jsPDF and html2canvas for rendering
 */

import jsPDF, { jsPDFOptions } from 'jspdf';
import html2canvas from 'html2canvas';

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReportData {
  title: string;
  subtitle?: string;
  generatedDate: Date;
  employeeName?: string;
  companyName?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  content: ReportContent;
}

export interface ReportContent {
  summary?: SummarySection;
  timeEntries?: TimeEntrySection;
  breaks?: BreakSection;
  analytics?: AnalyticsSection;
  violations?: ViolationSection;
  customHtml?: string; // Custom HTML to render
}

export interface SummarySection {
  totalHours: number;
  totalDays: number;
  averageHoursPerDay: number;
  breakTime: number;
  onTimeCount: number;
  lateCount: number;
  attendancePercentage: number;
}

export interface TimeEntrySection {
  entries: Array<{
    date: Date;
    clockInTime: string;
    clockOutTime?: string;
    duration: number;
    location?: string;
  }>;
}

export interface BreakSection {
  breaks: Array<{
    date: Date;
    startTime: string;
    endTime: string;
    duration: number;
    type: string;
  }>;
}

export interface AnalyticsSection {
  chartData?: any; // Recharts data
  metrics: Array<{
    label: string;
    value: string | number;
  }>;
}

export interface ViolationSection {
  violations: Array<{
    date: Date;
    type: string;
    location?: string;
    distance?: number;
    severity: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Generate a PDF report from ReportData object
 * @param reportData - Report data to generate
 * @param fileName - Name of the PDF file
 * @returns Promise resolving to PDF blob
 */
export async function generatePDFReport(
  reportData: ReportData,
  fileName: string = 'report.pdf'
): Promise<Blob> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    } as jsPDFOptions);

    // Add header
    addReportHeader(pdf, reportData);

    // Add summary section
    if (reportData.content.summary) {
      addSummarySection(pdf, reportData.content.summary);
    }

    // Add time entries section
    if (reportData.content.timeEntries) {
      addTimeEntriesSection(pdf, reportData.content.timeEntries);
    }

    // Add breaks section
    if (reportData.content.breaks) {
      addBreaksSection(pdf, reportData.content.breaks);
    }

    // Add analytics section
    if (reportData.content.analytics) {
      addAnalyticsSection(pdf, reportData.content.analytics);
    }

    // Add violations section
    if (reportData.content.violations) {
      addViolationsSection(pdf, reportData.content.violations);
    }

    // Add footer
    addReportFooter(pdf);

    // Save PDF
    pdf.save(fileName);

    // Return blob for uploading or preview
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
}

/**
 * Generate PDF from HTML element
 * @param element - DOM element to convert to PDF
 * @param fileName - Name of the PDF file
 * @returns Promise resolving to void
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  fileName: string = 'report.pdf'
): Promise<void> {
  try {
    // Capture HTML as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    } as jsPDFOptions);

    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF (multiple pages if needed)
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw new Error('Failed to generate PDF from HTML');
  }
}

/**
 * Generate daily attendance report
 */
export async function generateDailyReport(
  employeeName: string,
  companyName: string,
  date: Date,
  summary: SummarySection,
  timeEntries: TimeEntrySection
): Promise<Blob> {
  const dateString = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return generatePDFReport(
    {
      title: 'Daily Attendance Report',
      subtitle: dateString,
      generatedDate: new Date(),
      employeeName,
      companyName,
      dateRange: {
        start: date,
        end: date,
      },
      content: {
        summary,
        timeEntries,
      },
    },
    `daily-report-${date.toISOString().split('T')[0]}.pdf`
  );
}

/**
 * Generate weekly attendance report
 */
export async function generateWeeklyReport(
  employeeName: string,
  companyName: string,
  weekStart: Date,
  weekEnd: Date,
  summary: SummarySection,
  timeEntries: TimeEntrySection,
  analytics?: AnalyticsSection
): Promise<Blob> {
  const weekString = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;

  return generatePDFReport(
    {
      title: 'Weekly Attendance Report',
      subtitle: weekString,
      generatedDate: new Date(),
      employeeName,
      companyName,
      dateRange: {
        start: weekStart,
        end: weekEnd,
      },
      content: {
        summary,
        timeEntries,
        analytics,
      },
    },
    `weekly-report-${weekStart.toISOString().split('T')[0]}.pdf`
  );
}

/**
 * Generate monthly attendance report
 */
export async function generateMonthlyReport(
  employeeName: string,
  companyName: string,
  monthDate: Date,
  summary: SummarySection,
  timeEntries: TimeEntrySection,
  analytics?: AnalyticsSection,
  violations?: ViolationSection
): Promise<Blob> {
  const monthString = monthDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  // Calculate month range
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  return generatePDFReport(
    {
      title: 'Monthly Attendance Report',
      subtitle: monthString,
      generatedDate: new Date(),
      employeeName,
      companyName,
      dateRange: {
        start: monthStart,
        end: monthEnd,
      },
      content: {
        summary,
        timeEntries,
        analytics,
        violations,
      },
    },
    `monthly-report-${monthDate.toISOString().split('T')[0]}.pdf`
  );
}

/**
 * Add report header
 */
function addReportHeader(pdf: jsPDF, reportData: ReportData): void {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Title
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text(reportData.title, pageWidth / 2, 15, { align: 'center' });

  // Subtitle
  if (reportData.subtitle) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(reportData.subtitle, pageWidth / 2, 22, { align: 'center' });
  }

  // Employee and company info
  pdf.setFontSize(10);
  let yPos = 30;

  if (reportData.employeeName) {
    pdf.text(`Employee: ${reportData.employeeName}`, 15, yPos);
    yPos += 5;
  }

  if (reportData.companyName) {
    pdf.text(`Company: ${reportData.companyName}`, 15, yPos);
    yPos += 5;
  }

  const dateRangeString = `${reportData.dateRange.start.toLocaleDateString()} - ${reportData.dateRange.end.toLocaleDateString()}`;
  pdf.text(`Period: ${dateRangeString}`, 15, yPos);
  yPos += 5;

  pdf.text(`Generated: ${reportData.generatedDate.toLocaleString()}`, 15, yPos);

  // Add separator line
  pdf.setDrawColor(200);
  pdf.line(15, yPos + 5, pageWidth - 15, yPos + 5);
}

/**
 * Add summary section
 */
function addSummarySection(pdf: jsPDF, summary: SummarySection): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 45;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Summary', 15, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');

  const data = [
    [`Total Hours: ${summary.totalHours.toFixed(1)}h`, `Total Days: ${summary.totalDays}`],
    [`Avg Hours/Day: ${summary.averageHoursPerDay.toFixed(1)}h`, `Break Time: ${summary.breakTime.toFixed(1)}h`],
    [`Attendance: ${summary.attendancePercentage.toFixed(1)}%`, `On Time: ${summary.onTimeCount} / Late: ${summary.lateCount}`],
  ];

  data.forEach(row => {
    row.forEach((text, idx) => {
      const xPos = idx === 0 ? 15 : pageWidth / 2;
      pdf.text(text, xPos, yPos);
    });
    yPos += 6;
  });

  // Add separator
  pdf.setDrawColor(220);
  pdf.line(15, yPos + 2, pageWidth - 15, yPos + 2);
}

/**
 * Add time entries section
 */
function addTimeEntriesSection(pdf: jsPDF, timeEntries: TimeEntrySection): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 75;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Time Entries', 15, yPos);
  yPos += 8;

  // Table headers
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'bold');
  pdf.text('Date', 15, yPos);
  pdf.text('Clock In', 45, yPos);
  pdf.text('Clock Out', 95, yPos);
  pdf.text('Duration', 150, yPos);

  yPos += 6;
  pdf.setFont(undefined, 'normal');
  pdf.setDrawColor(220);
  pdf.line(15, yPos, pageWidth - 15, yPos);
  yPos += 4;

  // Table data
  timeEntries.entries.forEach(entry => {
    const dateString = entry.date.toLocaleDateString();
    pdf.text(dateString, 15, yPos);
    pdf.text(entry.clockInTime, 45, yPos);
    pdf.text(entry.clockOutTime || 'N/A', 95, yPos);
    pdf.text(`${entry.duration.toFixed(1)}h`, 150, yPos);
    yPos += 5;
  });
}

/**
 * Add breaks section
 */
function addBreaksSection(pdf: jsPDF, breaks: BreakSection): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 150;

  // Check if we need a new page
  if (yPos > 250) {
    pdf.addPage();
    yPos = 15;
  }

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Breaks', 15, yPos);
  yPos += 8;

  pdf.setFontSize(9);
  breaks.breaks.forEach(brk => {
    pdf.text(
      `${brk.date.toLocaleDateString()} - ${brk.type} (${brk.duration.toFixed(1)}m)`,
      15,
      yPos
    );
    yPos += 5;
  });
}

/**
 * Add analytics section
 */
function addAnalyticsSection(pdf: jsPDF, analytics: AnalyticsSection): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 180;

  if (yPos > 250) {
    pdf.addPage();
    yPos = 15;
  }

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Analytics', 15, yPos);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');

  analytics.metrics.forEach(metric => {
    pdf.text(`${metric.label}: ${metric.value}`, 15, yPos);
    yPos += 5;
  });
}

/**
 * Add violations section
 */
function addViolationsSection(pdf: jsPDF, violations: ViolationSection): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 210;

  if (yPos > 250) {
    pdf.addPage();
    yPos = 15;
  }

  if (violations.violations.length === 0) {
    pdf.setFontSize(10);
    pdf.text('No geofence violations recorded.', 15, yPos);
    return;
  }

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Geofence Violations', 15, yPos);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');

  violations.violations.forEach(violation => {
    const distance = violation.distance ? ` (${violation.distance}m away)` : '';
    pdf.text(
      `${violation.date.toLocaleDateString()} - ${violation.type}${distance} [${violation.severity.toUpperCase()}]`,
      15,
      yPos
    );
    yPos += 5;
  });
}

/**
 * Add report footer
 */
function addReportFooter(pdf: jsPDF): void {
  const pageCount = pdf.internal.pages.length - 1;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(8);
  pdf.setFont(undefined, 'italic');
  pdf.setTextColor(150);

  // Add page numbers to all pages
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
  }
}

export default {
  generatePDFReport,
  generatePDFFromHTML,
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
};
