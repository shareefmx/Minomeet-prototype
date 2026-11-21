import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Meeting, MOMTemplate } from '../types/meeting.js';
import { BUILT_IN_TEMPLATES, normalizeSections } from './momTemplates.js';
import { resolveDocumentData } from './momDocumentRenderer.js';

export interface MomPdfBuildResult {
  doc: jsPDF;
  hasUnsupportedUnicode: boolean;
  detectedScripts: string[];
  filename: string;
}

/**
 * Detects whether text contains scripts that standard PDF fonts (Latin-1)
 * do not support natively (e.g. Tamil, Devanagari, Arabic, Chinese, Japanese).
 */
export function detectNonLatinScripts(text: string): string[] {
  const scripts: string[] = [];
  if (/[\u0B80-\u0BFF]/.test(text)) scripts.push('Tamil');
  if (/[\u0900-\u097F]/.test(text)) scripts.push('Devanagari');
  if (/[\u0600-\u06FF]/.test(text)) scripts.push('Arabic');
  if (/[\u4E00-\u9FFF]/.test(text)) scripts.push('Chinese');
  if (/[\u3040-\u30FF]/.test(text)) scripts.push('Japanese');
  if (/[\uAC00-\uD7AF]/.test(text)) scripts.push('Korean');
  if (/[\u0400-\u04FF]/.test(text)) scripts.push('Cyrillic');
  return scripts;
}

/**
 * Sanitizes filename: removes / \ : * ? " < > |, collapses whitespace/underscores,
 * and caps title length at 80 characters.
 */
export function sanitizePdfFilename(title: string, dateStr?: string): string {
  const cleanTitle = (title || 'Meeting_Minutes')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
  const formattedDate = dateStr || new Date().toISOString().slice(0, 10);
  return `${cleanTitle}_MOM_${formattedDate}.pdf`;
}

/**
 * Builds a professional, multi-page vector PDF document using jsPDF & autoTable.
 * Strictly avoids html2canvas screenshots for crisp, searchable, selectable text.
 * Omits raw meeting transcript while including all MOM summary sections, tables,
 * and active template styling.
 */
export async function buildMomPdfDocument(
  meeting: Meeting,
  templateOverride?: MOMTemplate
): Promise<MomPdfBuildResult> {
  const tmplIdOrName = meeting.summary?.templateId || meeting.summary?.template;
  const template = templateOverride ||
    BUILT_IN_TEMPLATES.find(t => t.id === tmplIdOrName || t.name === tmplIdOrName) ||
    BUILT_IN_TEMPLATES[0];

  const docData = resolveDocumentData(template, meeting);
  const sections = normalizeSections(template.sections);

  // Scan text for non-Latin characters to inform user if warning is needed
  const fullTextScan = [
    meeting.title,
    docData.title,
    docData.chair,
    JSON.stringify(docData.sections),
    JSON.stringify(docData.agenda)
  ].join(' ');
  const detectedScripts = detectNonLatinScripts(fullTextScan);
  const hasUnsupportedUnicode = detectedScripts.length > 0;

  // Initialize jsPDF A4 portrait document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_LEFT = 20;
  const MARGIN_RIGHT = 20;
  const MARGIN_TOP = 20;
  const MARGIN_BOTTOM = 22;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 170 mm

  let currentY = MARGIN_TOP;

  // Helper to ensure page bounds
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      currentY = MARGIN_TOP;
      return true;
    }
    return false;
  };

  // 1. Accent Top Stripe on First Page
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.rect(0, 0, PAGE_WIDTH, 4.5, 'F');

  // 2. Document Super-Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('MINUTES OF MEETING • OFFICIAL RECORD', MARGIN_LEFT, currentY);
  currentY += 6;

  // 3. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // #0f172a
  const titleLines = doc.splitTextToSize(docData.title || meeting.title || 'Meeting Minutes', CONTENT_WIDTH);
  doc.text(titleLines, MARGIN_LEFT, currentY);
  currentY += titleLines.length * 7 + 2;

  // 4. Template Info Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(`Template: ${template.name} (${template.category || 'Standard'})`, MARGIN_LEFT, currentY);
  currentY += 7;

  // 5. Metadata Grid Card
  ensureSpace(28);
  const metaBoxY = currentY;
  const metaBoxHeight = 24;
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.roundedRect(MARGIN_LEFT, metaBoxY, CONTENT_WIDTH, metaBoxHeight, 2, 2, 'FD');

  const col1X = MARGIN_LEFT + 4;
  const col2X = MARGIN_LEFT + (CONTENT_WIDTH / 2) + 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DATE & TIME', col1X, metaBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`${docData.date || 'Today'} (${docData.duration || meeting.duration || '30 mins'})`, col1X, metaBoxY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PLATFORM / LOCATION', col1X, metaBoxY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const locText = doc.splitTextToSize(docData.location || 'Recorded & Transcribed with Minomeet', (CONTENT_WIDTH / 2) - 8);
  doc.text(locText[0] || '', col1X, metaBoxY + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CHAIR / FACILITATOR', col2X, metaBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(docData.chair || 'Team Lead', col2X, metaBoxY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('AI MODEL & DOC REF', col2X, metaBoxY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const modelText = meeting.summary?.modelUsed || 'Minomeet On-Device Neural Engine';
  doc.text(`${modelText} • ${docData.docId || 'MOM-01'}`, col2X, metaBoxY + 18.5);

  currentY = metaBoxY + metaBoxHeight + 8;

  // 6. Attendees & Quorum Table
  if (docData.attendees && docData.attendees.length > 0) {
    ensureSpace(24);
    // Section Header
    doc.setFillColor(37, 99, 235);
    doc.rect(MARGIN_LEFT, currentY, 2.5, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ATTENDEES & QUORUM', MARGIN_LEFT + 5, currentY + 3.8);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Name', 'Role / Title', 'Attendance']],
      body: docData.attendees.map(a => [a.name, a.role || 'Participant', a.attendance || 'Present']),
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 8,
        cellPadding: 2.2
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 7. Agenda Topics
  if (docData.agenda && docData.agenda.length > 0) {
    ensureSpace(20);
    doc.setFillColor(37, 99, 235);
    doc.rect(MARGIN_LEFT, currentY, 2.5, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AGENDA TOPICS', MARGIN_LEFT + 5, currentY + 3.8);
    currentY += 6.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    docData.agenda.forEach((item, idx) => {
      ensureSpace(6);
      const itemText = doc.splitTextToSize(`${idx + 1}. ${item}`, CONTENT_WIDTH);
      doc.text(itemText, MARGIN_LEFT + 2, currentY);
      currentY += itemText.length * 4.5 + 1;
    });
    currentY += 4;
  }

  // 8. Template-Driven Dynamic Sections (Excluding raw transcript)
  for (const sec of sections) {
    const secName = sec.title || (sec as any).name || '';
    if (secName.toLowerCase().includes('transcript')) {
      continue; // Transcript is strictly excluded from MOM report
    }

    const nameLower = secName.toLowerCase();
    let rawVal = docData.sections[secName] ||
      ((sec as any).name ? docData.sections[(sec as any).name] : '') ||
      (sec.id ? docData.sections[sec.id] : '') || '';

    // Fuzzy section match
    if (!rawVal || (Array.isArray(rawVal) && rawVal.length === 0)) {
      const matchedKey = Object.keys(docData.sections).find(k => {
        const kLower = k.toLowerCase();
        return kLower === nameLower ||
          (nameLower.includes('action') && kLower.includes('action')) ||
          (nameLower.includes('decision') && kLower.includes('decision')) ||
          (nameLower.includes('summary') && kLower.includes('summary')) ||
          (nameLower.includes('highlight') && kLower.includes('highlight')) ||
          (nameLower.includes('next step') && kLower.includes('next step'));
      });
      if (matchedKey && docData.sections[matchedKey]) {
        rawVal = docData.sections[matchedKey];
      }
    }

    // Prevent orphan header: ensure at least 25mm space remains
    ensureSpace(25);

    // Section Header
    doc.setFillColor(37, 99, 235);
    doc.rect(MARGIN_LEFT, currentY, 2.5, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(secName.toUpperCase(), MARGIN_LEFT + 5, currentY + 3.8);
    currentY += 6.5;

    // A. Table Section (e.g. Action Items)
    if (Array.isArray(rawVal) && rawVal.length > 0 && typeof rawVal[0] === 'object' && rawVal[0] !== null) {
      const cols = sec.columns && sec.columns.length > 0
        ? sec.columns
        : ['Owner', 'Task / Deliverable', 'Due Date', 'Status'];

      const tableRows = rawVal.map((row: any) => {
        return cols.map(c => {
          const cLower = c.toLowerCase();
          const cellKey = Object.keys(row).find(k => {
            const kl = k.toLowerCase();
            return kl === cLower ||
              (cLower.includes('task') && kl.includes('task')) ||
              (cLower.includes('owner') && kl.includes('owner')) ||
              (cLower.includes('due') && kl.includes('due')) ||
              (cLower.includes('status') && (kl.includes('status') || kl.includes('completed')));
          }) || c;
          let val = row[cellKey] ?? row[c] ?? '';
          if (typeof val === 'boolean') {
            val = val ? 'Completed' : 'Pending';
          }
          return String(val);
        });
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        head: [cols],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5
        },
        bodyStyles: {
          textColor: [30, 41, 59],
          fontSize: 8,
          cellPadding: 2.2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
    // B. List / Bullets Section (e.g. Decisions, Highlights, Next Steps)
    else if (Array.isArray(rawVal) && rawVal.length > 0) {
      const isDecision = secName.toLowerCase().includes('decision');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      rawVal.forEach((item, idx) => {
        ensureSpace(7);
        const prefix = isDecision ? `[D-${String(idx + 1).padStart(2, '0')}] ` : '• ';
        const textStr = String(item).replace(/^\[D-\d+\]\s*/, '');
        const fullItemText = `${prefix}${textStr}`;
        const lines = doc.splitTextToSize(fullItemText, CONTENT_WIDTH - 4);
        doc.text(lines, MARGIN_LEFT + 2, currentY);
        currentY += lines.length * 4.5 + 1.2;
      });
      currentY += 4;
    }
    // C. Paragraph Section (e.g. Executive Summary)
    else if (typeof rawVal === 'string' && rawVal.trim().length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const paragraphs = rawVal.split(/\n\n+/).filter(Boolean);
      paragraphs.forEach(p => {
        const lines = doc.splitTextToSize(p.trim(), CONTENT_WIDTH);
        ensureSpace(lines.length * 4.5 + 2);
        doc.text(lines, MARGIN_LEFT, currentY);
        currentY += lines.length * 4.5 + 2.5;
      });
      currentY += 4;
    }
    // D. Empty State Note
    else {
      ensureSpace(7);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // #94a3b8
      doc.text('No notes recorded for this section.', MARGIN_LEFT, currentY);
      currentY += 7;
    }
  }

  // 9. Document Sign-off & Footer Card
  ensureSpace(26);
  const signoffY = currentY;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN_LEFT, signoffY, PAGE_WIDTH - MARGIN_RIGHT, signoffY);
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Next Scheduled Sync:', MARGIN_LEFT, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(docData.nextMeeting || 'To be determined by project leads', MARGIN_LEFT + 32, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Distribution:', MARGIN_LEFT, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(docData.distribution || 'All Attendees & Executive Leadership', MARGIN_LEFT + 22, currentY);
  currentY += 7;

  // Sign-off line
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Minutes approved by: __________________________________   Date: ________________', MARGIN_LEFT, currentY);

  // 10. Number all pages cleanly at the bottom
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN_LEFT, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text(
      `Generated by Minomeet AI • 100% On-Device Neural Synthesis • Template: ${template.name}`,
      MARGIN_LEFT,
      PAGE_HEIGHT - 7
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      PAGE_WIDTH - MARGIN_RIGHT,
      PAGE_HEIGHT - 7,
      { align: 'right' }
    );
  }

  const dateStr = new Date(meeting.createdAt || Date.now()).toISOString().slice(0, 10);
  const filename = sanitizePdfFilename(meeting.title || 'Meeting_Minutes', dateStr);

  return {
    doc,
    hasUnsupportedUnicode,
    detectedScripts,
    filename
  };
}
