import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFConfig {
  coachingName: string;
  testName: string;
  examName: string;
  subject: string;
  standard: string;
  date: string;
  duration?: string | null;
  totalMarks: number;
  numberOfQuestions: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function addHeader(doc: jsPDF, config: PDFConfig, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 18;

  // Coaching Name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text(config.coachingName, pageWidth / 2, margin, { align: 'center' });

  // Test / Exam name
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(config.testName, pageWidth / 2, margin + 8, { align: 'center' });

  // Subtitle (e.g. "Answer Key" or "OMR Answer Sheet")
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, margin + 14, { align: 'center' });
  }

  // Info row
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const infoY = margin + (subtitle ? 21 : 16);

  const leftInfo = `Subject: ${config.subject}  |  Standard: ${config.standard}  |  Exam: ${config.examName}`;
  const rightInfo = `Total Marks: ${config.totalMarks}${config.duration ? `  |  Duration: ${config.duration} min` : ''}`;

  doc.text(leftInfo, margin, infoY);
  doc.text(`Date: ${config.date}`, margin, infoY + 5);
  doc.text(rightInfo, pageWidth - margin, infoY, { align: 'right' });
  doc.text(`Questions: ${config.numberOfQuestions}`, pageWidth - margin, infoY + 5, { align: 'right' });

  // Divider
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(0.6);
  doc.line(margin, infoY + 9, pageWidth - margin, infoY + 9);

  doc.setTextColor(0, 0, 0);
  return infoY + 16; // return Y position where content can start
}

function addPageNumber(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.setTextColor(0);
  }
}

// ─── Question Paper PDF ─────────────────────────────────────────────────────

export const generateQuestionPaperPDF = async (questions: any[], config: PDFConfig) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let yPos = addHeader(doc, config);

  // Marking scheme note
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  const firstQ = questions[0];
  const marksPerQ = firstQ?.marks || 4;
  const negPerQ = firstQ?.negative_marks || 1;
  doc.text(`Marking Scheme: +${marksPerQ} for correct, –${negPerQ} for incorrect, 0 for unattempted`, margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const questionText = q.question_text || 'Question text not available.';

    // Check if we need a page break (leave 40mm at bottom for options)
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }

    // Question number bubble
    doc.setFillColor(59, 130, 246);
    doc.circle(margin + 4, yPos - 2, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text((i + 1).toString(), margin + 4, yPos - 0.5, { align: 'center' });

    // Question text
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const textLines = doc.splitTextToSize(questionText, contentWidth - 12);
    doc.text(textLines, margin + 10, yPos);
    yPos += textLines.length * 5.5;

    // Image placeholder (with proper note)
    if (q.image_url) {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setDrawColor(180);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin + 10, yPos + 1, 80, 20, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text('[ Refer to figure / diagram ]', margin + 50, yPos + 13, { align: 'center' });
      doc.setTextColor(0);
      yPos += 26;
    }

    // Options
    const options: string[] = q.options || [];
    const labels = ['(A)', '(B)', '(C)', '(D)'];
    yPos += 2;

    // Try to fit options in 2 columns if they're short
    const allShort = options.every(o => (o || '').length < 30);
    if (allShort && options.length === 4) {
      const colW = (contentWidth - 12) / 2;
      for (let j = 0; j < options.length; j++) {
        if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
        const colX = margin + 10 + (j % 2 === 0 ? 0 : colW);
        const optText = `${labels[j]}  ${options[j] || ''}`;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(optText, colX, yPos);
        if (j % 2 === 1) yPos += 6;
      }
      if (options.length % 2 !== 0) yPos += 6;
    } else {
      for (let j = 0; j < options.length; j++) {
        if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
        const optText = `${labels[j]}  ${options[j] || ''}`;
        const optLines = doc.splitTextToSize(optText, contentWidth - 12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(optLines, margin + 10, yPos);
        yPos += optLines.length * 5.5;
      }
    }

    // Separator line between questions
    yPos += 4;
    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  }

  addPageNumber(doc);
  const filename = `${config.testName.replace(/[^a-z0-9]/gi, '_')}_question_paper.pdf`;
  doc.save(filename);
};


// ─── Answer Key PDF ──────────────────────────────────────────────────────────

export const generateAnswerKeyPDF = (questions: any[], config: PDFConfig) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const margin = 18;

  const startY = addHeader(doc, config, 'Answer Key');

  const labels = ['A', 'B', 'C', 'D'];

  const tableData = questions.map((q: any, i: number) => {
    const answerIndex = q.correct_answer_index;
    const answerLabel = (typeof answerIndex === 'number' && answerIndex >= 0 && answerIndex <= 3)
      ? labels[answerIndex]
      : '—';
    const correctOption = q.options?.[answerIndex] || '—';
    // Truncate long option text for readability
    const truncated = correctOption.length > 55 ? correctOption.substring(0, 55) + '...' : correctOption;

    return [
      (i + 1).toString(),
      answerLabel,
      truncated,
      `+${q.marks || 4} / –${q.negative_marks || 1}`,
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [['Q.No', 'Answer', 'Correct Option', 'Marks']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [30, 64, 175] },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 26 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      // Continuation header on new pages
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${config.coachingName} — ${config.testName} — Answer Key (continued)`, margin, 12);
      doc.setTextColor(0);
    },
  });

  addPageNumber(doc);
  const filename = `${config.testName.replace(/[^a-z0-9]/gi, '_')}_answer_key.pdf`;
  doc.save(filename);
};


// ─── OMR Sheet PDF ───────────────────────────────────────────────────────────

export const generateOMRPDF = (config: PDFConfig) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 18;

  const drawOMRPage = (startQNum: number, endQNum: number, isFirst: boolean) => {
    if (!isFirst) doc.addPage();

    // Header (only on first page)
    let yStart = 18;
    if (isFirst) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(config.coachingName, pageWidth / 2, yStart, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text('OMR ANSWER SHEET', pageWidth / 2, yStart + 8, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(`${config.testName}  |  ${config.examName}  |  ${config.subject} (${config.standard})`, pageWidth / 2, yStart + 15, { align: 'center' });

      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(margin, yStart + 19, pageWidth - margin, yStart + 19);

      // Student info box
      yStart += 24;
      doc.setDrawColor(180);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, yStart, pageWidth - margin * 2, 36, 2, 2);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30);

      doc.text('Student Name:', margin + 4, yStart + 8);
      doc.line(margin + 32, yStart + 8, pageWidth / 2 + 20, yStart + 8);

      doc.text('Roll No:', pageWidth / 2 + 24, yStart + 8);
      doc.line(pageWidth / 2 + 41, yStart + 8, pageWidth - margin - 4, yStart + 8);

      doc.text('Batch:', margin + 4, yStart + 18);
      doc.line(margin + 18, yStart + 18, pageWidth / 2 + 20, yStart + 18);

      doc.text('Date:', pageWidth / 2 + 24, yStart + 18);
      doc.line(pageWidth / 2 + 36, yStart + 18, pageWidth - margin - 4, yStart + 18);

      doc.text(`Total Marks: ${config.totalMarks}`, margin + 4, yStart + 29);
      if (config.duration) {
        doc.text(`Duration: ${config.duration} min`, pageWidth / 2, yStart + 29);
      }
      doc.text(`Questions: ${config.numberOfQuestions}`, pageWidth - margin - 4, yStart + 29, { align: 'right' });

      yStart += 44;
    } else {
      // Continuation header
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${config.coachingName} — ${config.testName} — OMR Sheet (continued)`, margin, 12);
      doc.setTextColor(0);
      yStart = 20;
    }

    // OMR Bubble grid — 3 columns
    const totalQ = endQNum - startQNum + 1;
    const columns = 3;
    const questionsPerColumn = Math.ceil(totalQ / columns);
    const columnWidth = (pageWidth - margin * 2) / columns;

    // Column headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(50);
    for (let c = 0; c < columns; c++) {
      if (c * questionsPerColumn >= totalQ) break;
      const colX = margin + c * columnWidth;
      doc.text('No.', colX + 2, yStart);
      doc.text('A', colX + 18, yStart);
      doc.text('B', colX + 29, yStart);
      doc.text('C', colX + 40, yStart);
      doc.text('D', colX + 51, yStart);
    }

    doc.setFont('helvetica', 'normal');
    yStart += 5;

    for (let c = 0; c < columns; c++) {
      const colX = margin + c * columnWidth;
      for (let r = 0; r < questionsPerColumn; r++) {
        const relQNum = c * questionsPerColumn + r;
        if (relQNum >= totalQ) break;
        const absQNum = startQNum + relQNum;
        const rowY = yStart + r * 8;

        // Question number
        doc.setFontSize(8.5);
        doc.setTextColor(30);
        doc.text(absQNum.toString().padStart(2, '0'), colX + 2, rowY + 3);

        // A B C D bubbles
        const bubbleLabels = ['A', 'B', 'C', 'D'];
        const bubbleXs = [18, 29, 40, 51];
        for (let b = 0; b < 4; b++) {
          const bx = colX + bubbleXs[b];
          doc.setDrawColor(80);
          doc.setLineWidth(0.4);
          doc.circle(bx + 1.5, rowY + 1.5, 2.8);
        }
      }
    }

    // Instructions footer (only on last page)
    const footerY = pageHeight - 22;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('INSTRUCTIONS: Use blue/black ball-point pen only. Darken ONE bubble completely per question. Do not use pencil or correction fluid.', margin, footerY, { maxWidth: pageWidth - margin * 2 });

    // Sample filled bubble
    doc.setFillColor(30, 30, 30);
    doc.circle(margin, footerY + 7, 2.8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.text(' = Correct way to mark', margin + 4, footerY + 8);
  };

  // Calculate how many questions fit per page
  const questionsPerPage = 45; // safe limit for 3 columns of 15 rows each
  const totalQ = config.numberOfQuestions;
  const pages = Math.ceil(totalQ / questionsPerPage);

  for (let p = 0; p < pages; p++) {
    const start = p * questionsPerPage + 1;
    const end = Math.min((p + 1) * questionsPerPage, totalQ);
    drawOMRPage(start, end, p === 0);
  }

  addPageNumber(doc);
  const filename = `${config.testName.replace(/[^a-z0-9]/gi, '_')}_omr_sheet.pdf`;
  doc.save(filename);
};
