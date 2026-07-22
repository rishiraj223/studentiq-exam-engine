import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFConfig {
  coachingName: string;
  examName: string;
  subject: string;
  standard: string;
  date: string;
  totalMarks: number;
  numberOfQuestions: number;
}

export const generateQuestionPaperPDF = async (questions: any[], config: PDFConfig) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(config.coachingName, pageWidth / 2, margin, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.examName} - ${config.subject} (${config.standard})`, pageWidth / 2, margin + 8, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Date: ${config.date || new Date().toLocaleDateString()}`, margin, margin + 16);
  doc.text(`Total Marks: ${config.totalMarks}`, pageWidth - margin, margin + 16, { align: 'right' });

  doc.setLineWidth(0.5);
  doc.line(margin, margin + 20, pageWidth - margin, margin + 20);

  // Questions
  let yPos = margin + 30;
  doc.setFontSize(11);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const questionText = q.text || q.question_text || 'No question text provided.';
    
    // Check if page break is needed
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Q${i + 1}.`, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    // split text to fit width
    const textLines = doc.splitTextToSize(questionText, pageWidth - margin * 2 - 10);
    doc.text(textLines, margin + 10, yPos);
    
    yPos += textLines.length * 6;

    // Handle Image if exists
    if (q.image_url) {
      try {
        const imgUrl = q.image_url.startsWith('http') ? q.image_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question_images/${q.image_url}`;
        // Load image and add to PDF - this requires async loading and conversion
        // For simplicity in client generation without waiting for complex canvas logic,
        // we'll leave a placeholder or just try basic addImage if it's a valid data URL
        // In a full prod app, we'd fetch the image as blob, convert to base64, then doc.addImage()
        doc.setTextColor(150);
        doc.text('[Image]', margin + 10, yPos);
        doc.setTextColor(0);
        yPos += 8;
      } catch (e) {
        console.error("Error embedding image", e);
      }
    }

    // Options
    const options = q.options || [];
    const labels = ['A)', 'B)', 'C)', 'D)'];
    
    // Try to layout options inline if they are short, else block
    let optY = yPos + 2;
    for (let j = 0; j < options.length; j++) {
      if (optY > 280) {
        doc.addPage();
        optY = margin;
      }
      const optText = `${labels[j]} ${options[j]}`;
      const optLines = doc.splitTextToSize(optText, pageWidth - margin * 2 - 15);
      doc.text(optLines, margin + 15, optY);
      optY += optLines.length * 6;
    }

    yPos = optY + 5;
  }

  doc.save(`${config.subject.toLowerCase()}_question_paper.pdf`);
};


export const generateAnswerKeyPDF = (questions: any[], config: PDFConfig) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(config.coachingName, pageWidth / 2, margin, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Answer Key: ${config.examName} - ${config.subject}`, pageWidth / 2, margin + 8, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

  const labels = ['A', 'B', 'C', 'D'];
  const tableData = questions.map((q, i) => [
    (i + 1).toString(),
    labels[q.correct_answer] || '-'
  ]);

  autoTable(doc, {
    startY: margin + 25,
    head: [['Question No.', 'Correct Option']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin, right: margin }
  });

  doc.save(`${config.subject.toLowerCase()}_answer_key.pdf`);
};


export const generateOMRPDF = (config: PDFConfig) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(config.coachingName, pageWidth / 2, margin, { align: 'center' });

  doc.setFontSize(16);
  doc.text('OMR ANSWER SHEET', pageWidth / 2, margin + 10, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

  // Student Details Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  doc.rect(margin, margin + 20, pageWidth - margin * 2, 35);
  
  doc.text('Student Name: _________________________________________', margin + 5, margin + 28);
  doc.text('Roll Number:  _________________', pageWidth / 2 + 10, margin + 28);
  
  doc.text('Batch: _________________', margin + 5, margin + 40);
  doc.text('Standard: _________________', pageWidth / 2 + 10, margin + 40);
  
  doc.text(`Subject: ${config.subject}`, margin + 5, margin + 50);
  doc.text(`Date: ___________`, pageWidth / 2 + 10, margin + 50);

  // OMR Bubbles
  let startY = margin + 65;
  const numQuestions = config.numberOfQuestions;
  
  // Layout in columns (3 columns max on A4)
  const columns = 3;
  const questionsPerColumn = Math.ceil(numQuestions / columns);
  const columnWidth = (pageWidth - margin * 2) / columns;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  for (let c = 0; c < columns; c++) {
    const colX = margin + (c * columnWidth);
    
    // Draw column headers only if this column has questions
    if (c * questionsPerColumn < numQuestions) {
      doc.text('Q.No', colX + 2, startY);
      doc.text('A', colX + 18, startY);
      doc.text('B', colX + 28, startY);
      doc.text('C', colX + 38, startY);
      doc.text('D', colX + 48, startY);
    }

    doc.setFont('helvetica', 'normal');
    
    for (let r = 0; r < questionsPerColumn; r++) {
      const qNum = c * questionsPerColumn + r + 1;
      if (qNum > numQuestions) break;
      
      const rowY = startY + 10 + (r * 8);
      
      // Question number
      doc.text(qNum.toString().padStart(2, '0'), colX + 2, rowY + 3);
      
      // Draw bubbles (A, B, C, D)
      for (let b = 0; b < 4; b++) {
        const bubbleX = colX + 18 + (b * 10);
        doc.circle(bubbleX + 1, rowY + 2, 2.5);
      }
    }
    
    doc.setFont('helvetica', 'bold');
  }

  // Footer Instructions
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const footerY = 270;
  doc.text('INSTRUCTIONS:', margin, footerY);
  doc.text('1. Use completely black/blue ball point pen to darken the circle.', margin, footerY + 5);
  doc.text('2. Darken ONLY ONE circle for each question as shown below:', margin, footerY + 10);
  doc.circle(margin + 90, footerY + 9, 2.5, 'FD'); // Filled circle
  
  doc.save(`${config.subject.toLowerCase()}_omr_sheet.pdf`);
};
