import jsPDF from 'jspdf';
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

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(coachingName, pageWidth / 2, margin, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Advanced Analytics: ${testName}`, pageWidth / 2, margin + 8, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 14, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(margin, margin + 18, pageWidth - margin, margin + 18);

  let startY = margin + 25;

  // Section 1: Batch Performance
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Performance Overview', margin, startY);
  
  const batchData = batchPerformance.map(b => [
    b.batchName,
    b.totalAttempts.toString(),
    `${b.avgScore} pts`,
    `${b.avgAccuracy}%`
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Batch Name', 'Attempts', 'Avg Score', 'Avg Accuracy']],
    body: batchData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin, right: margin }
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY || startY + 30;

  // Section 2: Question Difficulty
  if (finalY > 240) {
    doc.addPage();
    finalY = margin;
  } else {
    finalY += 15;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Question Difficulty Intelligence (Most Failed)', margin, finalY);

  const qData = questionDifficulty.slice(0, 15).map(q => [
    `Q. ${q.id.substring(0, 5)}...`, // Truncated ID or use sequential if available
    q.incorrectCount.toString(),
    `${q.incorrectPercentage}%`,
    q.subject
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Question ID (Prefix)', 'Failed Count', 'Failure Rate', 'Subject']],
    body: qData,
    theme: 'grid',
    headStyles: { fillColor: [231, 76, 60] },
    margin: { left: margin, right: margin }
  });

  doc.save(`${testName.replace(/\s+/g, '_').toLowerCase()}_analytics.pdf`);
};
