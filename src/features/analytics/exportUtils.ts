import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

export const exportAnalyticsToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAnalyticsToPDF = (
  testName: string,
  coachingName: string,
  batchPerformance: any[],
  questionDifficulty: any[]
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Dark header bar
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(coachingName, margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Advanced Analytics: ${testName}`, margin, 25);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 32);

  doc.setTextColor(30, 30, 30);
  let startY = 50;

  // Section 1: Batch Performance
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('Batch Performance Overview', margin, startY);
  doc.setTextColor(30, 30, 30);

  const batchData = batchPerformance.length > 0
    ? batchPerformance.map(b => [
        b.batchName,
        b.totalAttempts.toString(),
        `${b.avgScore} pts`,
        `${b.avgAccuracy}%`
      ])
    : [['No data available', '', '', '']];

  autoTable(doc, {
    startY: startY + 6,
    head: [['Batch Name', 'Attempts', 'Avg Score', 'Avg Accuracy']],
    body: batchData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY || startY + 30;

  // Section 2: Most Failed Questions
  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 14;
  }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('Question Difficulty Intelligence (Most Failed)', margin, finalY);
  doc.setTextColor(30, 30, 30);

  const qData = questionDifficulty.length > 0
    ? questionDifficulty.slice(0, 15).map(q => [
        `${q.id.substring(0, 8)}...`,
        q.subject,
        q.incorrectCount.toString(),
        `${q.incorrectPercentage}%`
      ])
    : [['No data available', '', '', '']];

  autoTable(doc, {
    startY: finalY + 6,
    head: [['Question ID', 'Subject', 'Failed Count', 'Failure Rate']],
    body: qData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [255, 245, 245] },
    margin: { left: margin, right: margin },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`StudentIQ Exam Engine · Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(`${testName.replace(/\s+/g, '_').toLowerCase()}_analytics.pdf`);
};

export const exportTestResultsPDF = (
  test: { name: string; exam_type: string; duration_minutes: number; total_marks: number; participations: number },
  coachingName: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header
  doc.setFillColor(234, 88, 12); // orange-600
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(coachingName, margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Test Result Summary: ${test.name}`, margin, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 33);

  doc.setTextColor(30, 30, 30);

  // Test Info
  let y = 52;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('Test Information', margin, y);
  y += 8;
  doc.setTextColor(30, 30, 30);

  autoTable(doc, {
    startY: y,
    body: [
      ['Test Name', test.name],
      ['Exam Type', test.exam_type],
      ['Duration', `${test.duration_minutes} minutes`],
      ['Total Marks', `${test.total_marks} pts`],
      ['Total Attempts', `${test.participations} students`],
      ['Date Generated', new Date().toLocaleDateString('en-IN')],
    ],
    theme: 'plain',
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 100, 120], cellWidth: 50 },
      1: { textColor: [30, 30, 30] }
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 15;

  // Note
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 140);
  doc.setFont('helvetica', 'italic');
  doc.text('For detailed student-wise breakdown, visit Advanced Analytics in StudentIQ Admin Portal.', margin, y, {
    maxWidth: pageWidth - margin * 2
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('StudentIQ Exam Engine · Confidential', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

  doc.save(`${test.name.replace(/\s+/g, '_').toLowerCase()}_result.pdf`);
};
