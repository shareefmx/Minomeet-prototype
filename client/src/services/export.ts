import { Meeting, MOMTemplate } from '../types/meeting.js';
import { BUILT_IN_TEMPLATES } from '../utils/momTemplates.js';
import { renderMomDocumentHtml, renderMomDocumentMarkdown, printMomDocument } from '../utils/momDocumentRenderer.js';
import { buildMomPdfDocument, MomPdfBuildResult } from '../utils/momPdfBuilder.js';

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(title: string): string {
  return (title || 'Meeting_Minutes')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

export const exportService = {
  getMeetingTemplate(meeting: Meeting): MOMTemplate {
    const tmplIdOrName = meeting.summary?.templateId || meeting.summary?.template;
    const found = BUILT_IN_TEMPLATES.find(t => t.id === tmplIdOrName || t.name === tmplIdOrName);
    return found || BUILT_IN_TEMPLATES[0];
  },

  /**
   * Formats meeting minutes into clean, professional Markdown.
   */
  toMarkdown(meeting: Meeting): string {
    const template = this.getMeetingTemplate(meeting);
    return renderMomDocumentMarkdown(template, meeting);
  },

  /**
   * Formats meeting into a complete Microsoft Word (.doc) document
   * using standard Word-compatible MSO HTML formatting.
   */
  toWordDoc(meeting: Meeting): string {
    const template = this.getMeetingTemplate(meeting);
    const bodyHtml = renderMomDocumentHtml(template, meeting, { embedBodyOnly: true, forWord: true });
    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${escapeHtml(meeting.title)}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, -apple-system, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111827; margin: 30pt; }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
      </html>
    `;
  },

  /**
   * Saves content to Downloads directory (browser download fallback in web).
   */
  async saveToDownloads(filename: string, content: string, mimeType: string = 'text/plain'): Promise<string> {
    this.downloadFile(content, filename, mimeType);
    return `~/Downloads/${filename}`;
  },

  /**
   * Saves binary data directly to Downloads via browser download.
   */
  async saveBinaryToDownloads(filename: string, bytes: Uint8Array, mimeType: string = 'application/pdf'): Promise<string> {
    this.downloadBinary(bytes, filename, mimeType);
    return `~/Downloads/${filename}`;
  },

  /**
   * Exports meeting as Word Document (.doc).
   */
  async exportToWord(meeting: Meeting): Promise<string> {
    const filename = `${sanitizeFilename(meeting.title)}_MOM.doc`;
    const docHtml = this.toWordDoc(meeting);
    return await this.saveToDownloads(filename, docHtml, 'application/msword');
  },

  /**
   * Exports meeting as Markdown (.md).
   */
  async exportToMarkdown(meeting: Meeting): Promise<string> {
    const filename = `${sanitizeFilename(meeting.title)}_MOM.md`;
    const md = this.toMarkdown(meeting);
    return await this.saveToDownloads(filename, md, 'text/markdown');
  },

  /**
   * Exports meeting as a real vector PDF document (.pdf).
   * Generates pure PDF bytes via jsPDF & autoTable, strictly omitting raw meeting transcripts.
   */
  async exportToPDF(meeting: Meeting): Promise<{ savedPath: string; hasUnsupportedUnicode: boolean; detectedScripts: string[]; filename: string }> {
    const buildResult: MomPdfBuildResult = await buildMomPdfDocument(meeting);
    const pdfArrayBuffer = buildResult.doc.output('arraybuffer');
    const bytes = new Uint8Array(pdfArrayBuffer);

    // Save binary bytes directly to browser Downloads
    const savedPath = await this.saveBinaryToDownloads(buildResult.filename, bytes, 'application/pdf');

    return {
      savedPath,
      hasUnsupportedUnicode: buildResult.hasUnsupportedUnicode,
      detectedScripts: buildResult.detectedScripts,
      filename: buildResult.filename
    };
  },

  /**
   * Downloads content as a file via temporary anchor element.
   */
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Downloads binary bytes via temporary anchor element.
   */
  downloadBinary(bytes: Uint8Array, filename: string, mimeType: string) {
    const blob = new Blob([bytes as any], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Copies formatted text to clipboard.
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  },

  /**
   * Opens clean printable page for browser print / Save as PDF using an invisible iframe.
   * Strictly avoids window.open.
   */
  printMeeting(meeting: Meeting) {
    const template = this.getMeetingTemplate(meeting);
    printMomDocument(template, meeting);
  },

  getPrintableHtml(meeting: Meeting): string {
    const template = this.getMeetingTemplate(meeting);
    return renderMomDocumentHtml(template, meeting, { forPrint: true });
  }
};
