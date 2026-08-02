import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── LaTeX/Math Sanitizer ─────────────────────────────────────────────────────
// IMPORTANT: jsPDF built-in Helvetica only supports Latin-1 (ISO-8859-1, U+0000–U+00FF).
// Greek, math symbols, superscript/subscript blocks are all OUTSIDE Latin-1 and render as garbage.
// Safe chars: × (U+00D7), ÷ (U+00F7), ± (U+00B1), ° (U+00B0), ² (U+00B2), ³ (U+00B3).
// All other special chars must become readable ASCII.
//
// Key ordering rule: process subscripts/Greek BEFORE frac/sqrt so nested content like
// \sqrt{\mu_{0}/\varepsilon_{0}} resolves to sqrt(mu_0/epsilon_0) correctly.

function sanitizeForPDF(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // ── Step 1: Strip $...$ and $$...$$ delimiters (keep content) ──
  text = text.replace(/\$\$([^$]*)\$\$/g, (_m, inner) => inner.trim());
  text = text.replace(/\$([^$]*)\$/g, (_m, inner) => inner.trim());

  // ── Step 2: Spacing commands ──
  text = text.replace(/\\,/g, ' ');
  text = text.replace(/\\;/g, ' ');
  text = text.replace(/\\:/g, ' ');
  text = text.replace(/\\!/g, '');
  text = text.replace(/\\\\/g, ' ');    // \\ line break
  text = text.replace(/\\quad/g, '  ');
  text = text.replace(/\\qquad/g, '   ');
  text = text.replace(/\\hspace\{[^{}]*\}/g, ' ');
  text = text.replace(/\\vspace\{[^{}]*\}/g, ' ');

  // ── Step 3: Greek letters → English names FIRST (so they resolve inside nested braces) ──
  text = text.replace(/\\alpha/g, 'alpha').replace(/\\Alpha/g, 'Alpha');
  text = text.replace(/\\beta/g, 'beta').replace(/\\Beta/g, 'Beta');
  text = text.replace(/\\gamma/g, 'gamma').replace(/\\Gamma/g, 'Gamma');
  text = text.replace(/\\delta/g, 'delta').replace(/\\Delta/g, 'Delta');
  text = text.replace(/\\varepsilon/g, 'epsilon').replace(/\\epsilon/g, 'epsilon');
  text = text.replace(/\\zeta/g, 'zeta').replace(/\\eta/g, 'eta');
  text = text.replace(/\\vartheta/g, 'theta').replace(/\\theta/g, 'theta').replace(/\\Theta/g, 'Theta');
  text = text.replace(/\\iota/g, 'iota').replace(/\\kappa/g, 'kappa');
  text = text.replace(/\\lambda/g, 'lambda').replace(/\\Lambda/g, 'Lambda');
  text = text.replace(/\\mu/g, 'mu').replace(/\\nu/g, 'nu');
  text = text.replace(/\\xi/g, 'xi').replace(/\\Xi/g, 'Xi');
  text = text.replace(/\\varpi/g, 'pi').replace(/\\pi/g, 'pi').replace(/\\Pi/g, 'Pi');
  text = text.replace(/\\varrho/g, 'rho').replace(/\\rho/g, 'rho');
  text = text.replace(/\\varsigma/g, 'sigma').replace(/\\sigma/g, 'sigma').replace(/\\Sigma/g, 'Sigma');
  text = text.replace(/\\tau/g, 'tau');
  text = text.replace(/\\upsilon/g, 'upsilon').replace(/\\Upsilon/g, 'Upsilon');
  text = text.replace(/\\varphi/g, 'phi').replace(/\\phi/g, 'phi').replace(/\\Phi/g, 'Phi');
  text = text.replace(/\\chi/g, 'chi');
  text = text.replace(/\\psi/g, 'psi').replace(/\\Psi/g, 'Psi');
  text = text.replace(/\\omega/g, 'omega').replace(/\\Omega/g, 'Omega');

  // ── Step 4: Subscripts with braces FIRST (resolves inner brace content for frac/sqrt) ──
  // Single-char subscripts: l_{1} → l1, theta_{1} → theta1
  // Multi-char subscripts: K_{AB} → K(AB)
  // NO underscores — they look bad in PDF and confuse variable names
  for (let i = 0; i < 3; i++) {
    text = text.replace(/_\{([^{}]*)\}/g, (_m, content) =>
      content.length === 1 ? content : `(${content})`);
  }
  // Single-char bare subscript: x_1 → x1, A_n → An
  text = text.replace(/_([0-9a-zA-Z])/g, '$1');

  // ── Step 5: Format wrappers — unwrap and keep content (also resolves inner braces) ──
  for (let i = 0; i < 3; i++) {
    text = text.replace(/\\(?:mathbf|mathit|mathbb|mathrm|boldsymbol|textbf|textit)\{([^{}]*)\}/g, '$1');
    text = text.replace(/\\(?:text|mbox|hbox|textrm|textsf|texttt)\{([^{}]*)\}/g, '$1');
    text = text.replace(/\\(?:vec|hat|bar|tilde|dot|ddot|overline|underline|widehat)\{([^{}]*)\}/g, '$1');
    text = text.replace(/\\(?:overrightarrow|overleftarrow)\{([^{}]*)\}/g, '$1');
  }

  // ── Step 6: Fractions — \\frac{a}{b} → (a)/(b)  [multi-pass, now content is brace-light] ──
  for (let i = 0; i < 6; i++) {
    text = text.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  }

  // ── Step 7: Roots — use text sqrt() since √ is outside Latin-1 ──
  // \sqrt[n]{x} → n-th root: show as root[n](x)
  text = text.replace(/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g, 'root[$1]($2)');
  // \sqrt{x} → sqrt(x) — readable and unambiguous
  for (let i = 0; i < 3; i++) {
    text = text.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
  }
  text = text.replace(/\\sqrt(?=[^{])/g, 'sqrt');

  // ── Step 8: Superscripts → ^(content)  [after frac/sqrt so ^{} in fractions resolves first] ──
  text = text.replace(/\^\{2\}/g, '\u00B2');  // ² is in Latin-1
  text = text.replace(/\^\{3\}/g, '\u00B3');  // ³ is in Latin-1
  text = text.replace(/\^2(?=[^{}]|$)/g, '\u00B2');
  text = text.replace(/\^3(?=[^{}]|$)/g, '\u00B3');
  // All other superscripts → ^(content) — plain ASCII
  for (let i = 0; i < 3; i++) {
    text = text.replace(/\^\{([^{}]*)\}/g, '^($1)');
  }
  text = text.replace(/\^([0-9+\-a-zA-Z])/g, '^$1');

  // ── Step 9: Brackets ──
  text = text.replace(/\\left\s*\(/g, '(').replace(/\\right\s*\)/g, ')');
  text = text.replace(/\\left\s*\[/g, '[').replace(/\\right\s*\]/g, ']');
  text = text.replace(/\\left\s*\|/g, '|').replace(/\\right\s*\|/g, '|');
  text = text.replace(/\\left\s*\\?\{/g, '(').replace(/\\right\s*\\?\}/g, ')');
  text = text.replace(/\\left\s*\.?/g, '').replace(/\\right\s*\.?/g, '');
  text = text.replace(/\\[Bb]igg?[lr]?\s*[([|{]/g, '(').replace(/\\[Bb]igg?[lr]?\s*[)\]|]/g, ')');

  // ── Step 10: Trig / math functions ──
  text = text.replace(/\\sin/g, 'sin').replace(/\\cos/g, 'cos').replace(/\\tan/g, 'tan');
  text = text.replace(/\\sec/g, 'sec').replace(/\\csc/g, 'csc').replace(/\\cot/g, 'cot');
  text = text.replace(/\\arcsin/g, 'arcsin').replace(/\\arccos/g, 'arccos').replace(/\\arctan/g, 'arctan');
  text = text.replace(/\\log/g, 'log').replace(/\\ln/g, 'ln').replace(/\\exp/g, 'exp');
  text = text.replace(/\\lim/g, 'lim').replace(/\\max/g, 'max').replace(/\\min/g, 'min').replace(/\\det/g, 'det');
  text = text.replace(/\\int/g, 'integral').replace(/\\oint/g, 'oint');
  text = text.replace(/\\sum/g, 'sum').replace(/\\prod/g, 'product');
  text = text.replace(/\\partial/g, 'd').replace(/\\nabla/g, 'del');
  text = text.replace(/\\infty/g, 'infinity');

  // ── Step 11: Symbols — Latin-1 safe ones used directly, rest as ASCII ──
  text = text.replace(/\\times/g, '\u00D7');   // × Latin-1 safe
  text = text.replace(/\\div/g, '\u00F7');     // ÷ Latin-1 safe
  text = text.replace(/\\pm/g, '\u00B1');      // ± Latin-1 safe
  text = text.replace(/\\mp/g, '-/+');
  text = text.replace(/\\cdot/g, '.');
  text = text.replace(/\\bullet/g, '*');
  text = text.replace(/\\approx/g, '~=');
  text = text.replace(/\\neq/g, '!=');
  text = text.replace(/\\leq/g, '<=').replace(/\\geq/g, '>=');
  text = text.replace(/\\ll/g, '<<').replace(/\\gg/g, '>>');
  text = text.replace(/\\propto/g, 'proportional to');
  text = text.replace(/\\sim/g, '~');
  text = text.replace(/\\rightarrow/g, '->').replace(/\\leftarrow/g, '<-');
  text = text.replace(/\\Rightarrow/g, '=>').replace(/\\Leftarrow/g, '<=');
  text = text.replace(/\\leftrightarrow/g, '<->').replace(/\\Leftrightarrow/g, '<=>');
  text = text.replace(/\\to\b/g, '->');
  text = text.replace(/\\circ/g, '\u00B0');    // ° Latin-1 safe
  text = text.replace(/\\degree/g, '\u00B0');
  text = text.replace(/\\angle/g, 'angle').replace(/\\perp/g, '_|_').replace(/\\parallel/g, '||');
  text = text.replace(/\\in\b/g, ' in ').replace(/\\notin/g, ' not in ');
  text = text.replace(/\\subset/g, ' subset ').replace(/\\cup/g, ' union ').replace(/\\cap/g, ' intersect ');

  // ── Step 12: Remove all remaining LaTeX commands ──
  text = text.replace(/\\[a-zA-Z]+\*?\{[^{}]*\}/g, '');  // cmd{arg}
  text = text.replace(/\\[a-zA-Z]+\*/g, '');              // cmd*
  text = text.replace(/\\[a-zA-Z]+/g, '');                // remaining commands
  text = text.replace(/\\./g, '');                        // escaped single chars (\\, \\; etc.)

  // ── Step 13: Strip leftover LaTeX braces ──
  text = text.replace(/\{|\}/g, '');

  // ── Step 14: Normalize Unicode punctuation to ASCII equivalents BEFORE stripping ──
  text = text.replace(/\u2212/g, '-');    // − MINUS SIGN → hyphen (fixes -5 → ?5 bug)
  text = text.replace(/\u2013/g, '-');    // – EN DASH → hyphen
  text = text.replace(/\u2014/g, '-');    // — EM DASH → hyphen
  text = text.replace(/\u00B7/g, '.');   // · MIDDLE DOT (actually Latin-1 safe, but keep as .)
  text = text.replace(/\u2019/g, "'");   // ' RIGHT SINGLE QUOTE
  text = text.replace(/\u201C/g, '"');   // " LEFT DOUBLE QUOTE
  text = text.replace(/\u201D/g, '"');   // " RIGHT DOUBLE QUOTE

  // ── Step 15: Strip any remaining non-Latin-1 chars (safety net) ──
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[^\x00-\xFF]/g, '');

  // ── Step 16: Normalize whitespace ──
  text = text.replace(/[ \t]+/g, ' ').trim();

  return text;
}

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
  hasNumericals?: boolean;
  numericalCount?: number;
  numericalStartIndex?: number; // which question number numericals start at
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

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const questionText = sanitizeForPDF(q.question_text || 'Question text not available.');
    const questionType: string = q.question_type || 'mcq';

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
    yPos += textLines.length * 6;

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

    // Numerical questions — no options, show answer box
    if (questionType === 'numerical') {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(180, 100, 0);
      doc.text('Answer: ___________________________', margin + 10, yPos);
      doc.setTextColor(0);
      yPos += 10;
      // Skip the options block
      doc.setDrawColor(220);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      continue;
    }

    // Options
    const options: string[] = q.options || [];
    const labels = ['(A)', '(B)', '(C)', '(D)'];
    yPos += 2;

    // Try to fit options in 2 columns if all sanitized options are short
    const sanitizedOpts = options.map((o: string) => sanitizeForPDF(o || ''));
    const allShort = sanitizedOpts.every((o: string) => o.length < 28);
    if (allShort && options.length === 4) {
      const colW = (contentWidth - 12) / 2;
      for (let j = 0; j < options.length; j++) {
        if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
        const colX = margin + 10 + (j % 2 === 0 ? 0 : colW);
        const optText = `${labels[j]}  ${sanitizedOpts[j]}`;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(optText, colX, yPos);
        if (j % 2 === 1) yPos += 6.5;
      }
      if (options.length % 2 !== 0) yPos += 6.5;
    } else {
      for (let j = 0; j < options.length; j++) {
        if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
        const optText = `${labels[j]}  ${sanitizedOpts[j]}`;
        const optLines = doc.splitTextToSize(optText, contentWidth - 12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(optLines, margin + 10, yPos);
        yPos += optLines.length * 6;
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
    const isNumerical = q.question_type === 'numerical';

    if (isNumerical) {
      const numAnswer = q.numerical_answer !== null && q.numerical_answer !== undefined
        ? String(q.numerical_answer)
        : '—';
      return [
        (i + 1).toString(),
        'NUM',
        `Answer: ${numAnswer}`,
        `+${q.marks || 4} / 0`,  // numericals have no negative marking
      ];
    }

    const answerIndex = q.correct_answer_index;
    const answerLabel = (typeof answerIndex === 'number' && answerIndex >= 0 && answerIndex <= 3)
      ? labels[answerIndex]
      : '—';
    const correctOption = sanitizeForPDF(q.options?.[answerIndex] || '—');
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
    didParseCell: (data: any) => {
      if (data.column.index === 1 && data.cell.raw === 'NUM') {
        data.cell.styles.textColor = [180, 100, 0];
        data.cell.styles.fontStyle = 'bold';
      }
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

    // Section B: Numerical
    if (config.hasNumericals && config.numericalCount && config.numericalStartIndex) {
      const numY = yStart + Math.ceil(questionsPerPage / columns) * 8 + 10;
      if (numY < pageHeight - 40) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(180, 100, 0);
        doc.text('SECTION B — NUMERICAL ANSWERS (Write your calculated answer)', margin, numY);
        doc.setLineWidth(0.3);
        doc.setDrawColor(200, 150, 50);
        doc.line(margin, numY + 2, pageWidth - margin, numY + 2);
        doc.setTextColor(30);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);

        const cols = 2;
        const colW = (pageWidth - margin * 2) / cols;
        for (let n = 0; n < config.numericalCount; n++) {
          const qNum = config.numericalStartIndex + n;
          const col = n % cols;
          const row = Math.floor(n / cols);
          const nx = margin + col * colW;
          const ny = numY + 8 + row * 12;
          if (ny > pageHeight - 25) break;
          doc.text(`Q${qNum}:`, nx, ny);
          doc.setDrawColor(150);
          doc.line(nx + 12, ny, nx + colW - 8, ny);
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
