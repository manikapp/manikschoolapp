import { jsPDF } from "jspdf";

type LetterheadConfig = {
  accent_color?: string; // hex, e.g. "#0F6E56"
};

/**
 * Renders a letter into a letterhead: school name/address as a header band,
 * then the letter body. Deliberately simple typography for v1 — swapping in
 * an actual logo image or a fancier layout is a good next iteration once a
 * school wants a specific letterhead look.
 */
export function generateLetterPdf(params: {
  schoolName: string;
  schoolAddress?: string | null;
  title: string;
  body: string;
  recipient?: string | null;
  config?: LetterheadConfig;
}): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const accent = params.config?.accent_color ?? "#0F6E56";
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;

  // Header band
  doc.setFillColor(accent);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(18);
  doc.text(params.schoolName, margin, 40);
  if (params.schoolAddress) {
    doc.setFontSize(10);
    doc.text(params.schoolAddress, margin, 60);
  }

  // Body
  doc.setTextColor("#1C1C1A");
  let y = 130;
  doc.setFontSize(11);
  doc.text(new Date().toLocaleDateString(), margin, y);
  y += 24;

  if (params.recipient) {
    doc.text(params.recipient, margin, y);
    y += 24;
  }

  doc.setFontSize(13);
  doc.text(params.title, margin, y);
  y += 24;

  doc.setFontSize(11);
  const bodyLines = doc.splitTextToSize(params.body, pageWidth - margin * 2);
  doc.text(bodyLines, margin, y);

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * A blank score sheet: student roll on the left, one column per assessment
 * component (CA1/CA2/Exam/etc., driven by the template's configured columns),
 * left blank for a teacher to fill in by hand or transcribe from a paper exam.
 */
export function generateScoreSheetPdf(params: {
  schoolName: string;
  classArmName: string;
  subjectName: string;
  termName: string;
  columns: string[]; // e.g. ["CA1", "CA2", "Exam", "Total"]
  students: { admission_number: string; full_name: string }[];
}): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.text(params.schoolName, margin, 40);
  doc.setFontSize(11);
  doc.text(
    `${params.subjectName} — ${params.classArmName} — ${params.termName}`,
    margin,
    58
  );

  const tableTop = 90;
  const rowHeight = 22;
  const nameColWidth = 220;
  const colWidth = (pageWidth - margin * 2 - nameColWidth) / params.columns.length;

  // Header row
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Student", margin + 4, tableTop - 6);
  params.columns.forEach((col, i) => {
    doc.text(col, margin + nameColWidth + i * colWidth + 4, tableTop - 6);
  });
  doc.line(margin, tableTop, pageWidth - margin, tableTop);

  // Student rows
  doc.setFont("helvetica", "normal");
  params.students.forEach((student, rowIndex) => {
    const y = tableTop + (rowIndex + 1) * rowHeight;
    doc.text(`${student.full_name} (${student.admission_number})`, margin + 4, y - 6);
    params.columns.forEach((_, colIndex) => {
      doc.line(
        margin + nameColWidth + colIndex * colWidth,
        y,
        margin + nameColWidth + (colIndex + 1) * colWidth,
        y
      );
    });
    doc.line(margin, y, pageWidth - margin, y);
  });

  return Buffer.from(doc.output("arraybuffer"));
}
