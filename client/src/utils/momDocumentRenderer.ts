import { MOMTemplate, MOMSampleDocument, Meeting } from '../types/meeting.js';
import { normalizeSections, BUILT_IN_TEMPLATES } from './momTemplates.js';

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ResolvedDocumentData {
  title: string;
  subtitle?: string;
  date: string;
  duration: string;
  location: string;
  chair: string;
  docId: string;
  status: string;
  attendees: Array<{ name: string; role: string; attendance: string }>;
  agenda: string[];
  sections: Record<string, any>;
  nextMeeting?: string;
  distribution?: string;
  approvedBy?: string;
}

/**
 * Resolves document data from either a sample document, a Meeting entity, or generic data.
 */
export function resolveDocumentData(
  template: MOMTemplate,
  sourceData?: MOMSampleDocument | Meeting | any
): ResolvedDocumentData {
  // If template has a sample document in BUILT_IN_TEMPLATES, use it as baseline
  const canonical = BUILT_IN_TEMPLATES.find(t => t.id === template.id);
  const baselineSample: MOMSampleDocument | undefined =
    typeof template.sampleDocument === 'object' && template.sampleDocument !== null
      ? (template.sampleDocument as MOMSampleDocument)
      : (typeof canonical?.sampleDocument === 'object' ? canonical.sampleDocument : undefined);

  // If sourceData is a Meeting
  if (sourceData && 'transcript' in sourceData && 'title' in sourceData) {
    const meeting = sourceData as Meeting;
    const summary = meeting.summary;

    const attendeesList = summary?.attendees && summary.attendees.length > 0
      ? summary.attendees.map((name, i) => ({
          name,
          role: i === 0 ? 'Facilitator' : 'Participant',
          attendance: 'Present'
        }))
      : baselineSample?.attendees || [
          { name: 'Sarah Chen', role: 'Head of Product', attendance: 'Present' },
          { name: 'Alex Rivera', role: 'Tech Lead', attendance: 'Present' }
        ];

    // Combine sectionsData from summary with baseline fallback
    const sectionsData: Record<string, any> = { ...(summary?.sectionsData || {}) };

    // Map legacy fields into sectionsData if not already present
    if (summary?.summary) {
      if (!sectionsData['Executive Summary']) sectionsData['Executive Summary'] = summary.summary;
      if (!sectionsData['Summary']) sectionsData['Summary'] = summary.summary;
      if (!sectionsData['Executive Summary & Strategic Context']) sectionsData['Executive Summary & Strategic Context'] = summary.summary;
    }
    if (summary?.keyDecisions && summary.keyDecisions.length > 0) {
      if (!sectionsData['Key Decisions']) sectionsData['Key Decisions'] = summary.keyDecisions;
      if (!sectionsData['Decisions']) sectionsData['Decisions'] = summary.keyDecisions;
      if (!sectionsData['Key Decisions & Strategic Choices']) sectionsData['Key Decisions & Strategic Choices'] = summary.keyDecisions;
    }
    if (summary?.actionItems && summary.actionItems.length > 0) {
      if (!sectionsData['Action Items']) sectionsData['Action Items'] = summary.actionItems;
      if (!sectionsData['Action Items & Ownership']) sectionsData['Action Items & Ownership'] = summary.actionItems;
      if (!sectionsData['Action Items Matrix']) sectionsData['Action Items Matrix'] = summary.actionItems;
      if (!sectionsData['Immediate Action Items']) sectionsData['Immediate Action Items'] = summary.actionItems;
    }
    if (summary?.discussionHighlights && summary.discussionHighlights.length > 0) {
      if (!sectionsData['Discussion Highlights']) sectionsData['Discussion Highlights'] = summary.discussionHighlights;
      if (!sectionsData['Highlights']) sectionsData['Highlights'] = summary.discussionHighlights;
      if (!sectionsData['Key Discussion Points']) sectionsData['Key Discussion Points'] = summary.discussionHighlights;
    }
    if (summary?.nextSteps && summary.nextSteps.length > 0) {
      if (!sectionsData['Next Steps']) sectionsData['Next Steps'] = summary.nextSteps;
      if (!sectionsData['Immediate Next Steps']) sectionsData['Immediate Next Steps'] = summary.nextSteps;
    }

    return {
      title: meeting.title || baselineSample?.title || 'Meeting Minutes',
      subtitle: baselineSample?.subtitle || 'Minutes of Meeting',
      date: summary?.date || new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration: meeting.duration || '45 mins',
      location: baselineSample?.metadata?.['Location / Platform'] || 'Google Meet · Recorded & Transcribed with Minomeet',
      chair: baselineSample?.metadata?.['Chair / Facilitator'] || (summary?.attendees?.[0] || 'Team Lead'),
      docId: baselineSample?.metadata?.['Document ID'] || `MOM-${new Date(meeting.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-01`,
      status: baselineSample?.metadata?.['Status'] || 'Approved',
      attendees: attendeesList,
      agenda: baselineSample?.agenda || [
        'Review project milestones and deliverables',
        'Discussion of technical proposals and key blockers',
        'Ratify architecture decisions and assign ownership'
      ],
      sections: Object.keys(sectionsData).length > 0 ? sectionsData : (baselineSample?.sections || {}),
      nextMeeting: baselineSample?.nextMeeting || 'November 7, 2024 · 10:00 AM',
      distribution: baselineSample?.distribution || 'All Attendees, Exec Staff, Engineering Leads',
      approvedBy: baselineSample?.approvedBy || 'Sarah Chen'
    };
  }

  // If sourceData is already a sample document object
  if (sourceData && ('title' in sourceData || 'sections' in sourceData)) {
    const s = sourceData as MOMSampleDocument;
    return {
      title: s.title || baselineSample?.title || 'Minutes of Meeting',
      subtitle: s.subtitle || 'Minutes of Meeting',
      date: s.metadata?.['Date'] || 'October 24, 2024 · 10:00 AM - 11:00 AM EDT',
      duration: s.metadata?.['Duration'] || '60 mins',
      location: s.metadata?.['Location / Platform'] || 'Google Meet · Recorded & Transcribed with Minomeet',
      chair: s.metadata?.['Chair / Facilitator'] || 'Sarah Chen (Head of Product)',
      docId: s.metadata?.['Document ID'] || 'MOM-2024-1024-01 · Status: Approved',
      status: s.metadata?.['Status'] || 'Approved',
      attendees: s.attendees || baselineSample?.attendees || [],
      agenda: s.agenda || baselineSample?.agenda || [],
      sections: s.sections || baselineSample?.sections || {},
      nextMeeting: s.nextMeeting || baselineSample?.nextMeeting || 'November 7, 2024 · 10:00 AM',
      distribution: s.distribution || baselineSample?.distribution || 'All Attendees, Exec Staff, Engineering Leads',
      approvedBy: s.approvedBy || baselineSample?.approvedBy || 'Sarah Chen'
    };
  }

  // Fallback to baseline sample or generic template mock
  const sections: Record<string, any> = baselineSample?.sections || baselineSample?.sectionsData || {};
  const normSections = normalizeSections(template.sections);
  for (const sec of normSections) {
    const key = sec.name || sec.title || sec.id || 'Section';
    if (!sections[key]) {
      if (sec.type === 'table') {
        sections[key] = [
          { owner: 'Sarah Chen', task: `Finalize requirements for ${key}`, due: 'By Friday', status: 'In Progress' },
          { owner: 'Alex Rivera', task: `Deliver technical review for ${key}`, due: 'Next Monday', status: 'Pending' }
        ];
      } else if (sec.type === 'bullets' || sec.type === 'numbered') {
        sections[key] = [
          `Agreed on key deliverables and milestones for ${key}.`,
          `Validated dependencies with cross-functional leads.`,
          `Confirmed release timeline and scheduled verification sync.`
        ];
      } else {
        sections[key] = `The discussion covered core requirements, strategic priorities, and operational considerations for ${key}. All participants aligned on immediate goals and next sprint milestones.`;
      }
    }
  }

  return {
    title: baselineSample?.meetingTitle || baselineSample?.title || `${template.name} — Minutes of Meeting`,
    subtitle: 'Minutes of Meeting',
    date: baselineSample?.metadata?.['Date'] || 'October 24, 2024 · 10:00 AM - 11:00 AM EDT',
    duration: baselineSample?.metadata?.['Duration'] || '60 mins',
    location: baselineSample?.metadata?.['Location / Platform'] || 'Google Meet · Recorded & Transcribed with Minomeet',
    chair: baselineSample?.metadata?.['Chair / Facilitator'] || 'Sarah Chen (Head of Product)',
    docId: baselineSample?.metadata?.['Document ID'] || 'MOM-2024-1024-01 · Status: Approved',
    status: baselineSample?.metadata?.['Status'] || 'Approved',
    attendees: baselineSample?.attendees || [
      { name: 'Sarah Chen', role: 'Head of Product', attendance: 'Present' },
      { name: 'Alex Rivera', role: 'Staff Infrastructure Lead', attendance: 'Present' },
      { name: 'Priya Sharma', role: 'Engineering Manager', attendance: 'Present' },
      { name: 'Marcus Brody', role: 'Enterprise Sales Director', attendance: 'Remote' }
    ],
    agenda: baselineSample?.agenda || [
      'Strategic roadmap review & resource planning',
      'Architecture proposals & technical trade-offs',
      'Action item assignment and approval milestones'
    ],
    sections,
    nextMeeting: baselineSample?.nextMeeting || 'November 7, 2024 · 10:00 AM',
    distribution: baselineSample?.distribution || 'All Attendees, Exec Staff, Engineering Leads',
    approvedBy: baselineSample?.approvedBy || 'Sarah Chen'
  };
}

/**
 * Generates the inner A4 document HTML for preview, print, or Word export.
 */
export function renderMomDocumentHtml(
  template: MOMTemplate,
  sourceData?: MOMSampleDocument | Meeting | any,
  options?: { embedBodyOnly?: boolean; forWord?: boolean; forPrint?: boolean }
): string {
  const doc = resolveDocumentData(template, sourceData);
  const accentColor = template.accentColor || '#2563eb';
  const sections = normalizeSections(template.sections);

  // Render individual sections
  const renderedSectionsHtml = sections.map((sec) => {
    const secName = sec.title || (sec as any).name || '';
    const nameLower = secName.toLowerCase();
    let rawVal = doc.sections[secName] || ((sec as any).name ? doc.sections[(sec as any).name] : '') || (sec.id ? doc.sections[sec.id] : '') || '';
    if (!rawVal || (Array.isArray(rawVal) && rawVal.length === 0)) {
      const matchedKey = Object.keys(doc.sections).find(k => {
        const kLower = k.toLowerCase();
        return kLower === nameLower ||
          (nameLower.includes('action') && kLower.includes('action')) ||
          (nameLower.includes('decision') && kLower.includes('decision')) ||
          (nameLower.includes('summary') && kLower.includes('summary')) ||
          (nameLower.includes('highlight') && kLower.includes('highlight')) ||
          (nameLower.includes('next step') && kLower.includes('next step'));
      });
      if (matchedKey && doc.sections[matchedKey]) {
        rawVal = doc.sections[matchedKey];
      }
    }
    let contentHtml = '';

    const isDecisionSection = secName.toLowerCase().includes('decision');

    if (Array.isArray(rawVal) && rawVal.length > 0 && typeof rawVal[0] === 'object' && rawVal[0] !== null) {
      // Table data
      const cols = sec.columns && sec.columns.length > 0
        ? sec.columns
        : Object.keys(rawVal[0]).filter(k => k !== 'id');

      contentHtml = `
        <div style="overflow-x: auto; margin-top: 6px; margin-bottom: 10px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
                ${cols.map(c => `<th style="padding: 6px 10px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px;">${escapeHtml(c)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rawVal.map((row: any, rIdx: number) => `
                <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${rIdx % 2 === 1 ? '#fafafa' : '#ffffff'};">
                  ${cols.map(c => {
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
                    const isStatus = cLower.includes('status') || cLower.includes('state');
                    const isOwner = cLower.includes('owner') || cLower.includes('lead');

                    let cellDisplay = escapeHtml(String(val));
                    if (isStatus) {
                      const isDone = String(val).toLowerCase().includes('done') || String(val).toLowerCase().includes('complete') || row.completed;
                      const isPending = String(val).toLowerCase().includes('pending') || String(val).toLowerCase().includes('progress');
                      const bg = isDone ? '#dcfce7' : (isPending ? '#fef9c3' : '#f1f5f9');
                      const fg = isDone ? '#15803d' : (isPending ? '#854d0e' : '#475569');
                      cellDisplay = `<span style="background: ${bg}; color: ${fg}; font-weight: 700; font-size: 9.5px; padding: 2px 6px; border-radius: 4px; display: inline-block;">${escapeHtml(String(val))}</span>`;
                    } else if (isOwner) {
                      cellDisplay = `<b>${cellDisplay}</b>`;
                    }
                    return `<td style="padding: 6px 10px; color: #1e293b; vertical-align: top;">${cellDisplay}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (Array.isArray(rawVal) && rawVal.length > 0) {
      // Bullet or numbered list
      contentHtml = `
        <ul style="margin: 6px 0 10px 18px; padding-left: 0; font-size: 12px; line-height: 1.6; color: #334155;">
          ${rawVal.map((item, idx) => {
            const strItem = String(item);
            let prefix = '';
            if (isDecisionSection && !strItem.startsWith('[D-')) {
              prefix = `<span style="font-weight: 800; color: ${accentColor}; font-family: monospace; margin-right: 6px;">[D-${String(idx + 1).padStart(2, '0')}]</span>`;
            }
            return `<li style="margin-bottom: 4px;">${prefix}${escapeHtml(strItem)}</li>`;
          }).join('')}
        </ul>
      `;
    } else if (typeof rawVal === 'string' && rawVal.trim().length > 0) {
      // Paragraph text
      const paragraphs = rawVal.split(/\n\n+/).filter(Boolean);
      contentHtml = paragraphs.map(p => `
        <p style="margin: 4px 0 8px 0; font-size: 12px; line-height: 1.65; color: #334155; text-align: justify;">
          ${escapeHtml(p)}
        </p>
      `).join('');
    } else {
      contentHtml = `<p style="font-size: 11px; color: #94a3b8; font-style: italic; margin: 4px 0;">No notes recorded for this section.</p>`;
    }

    return `
      <section style="margin-bottom: 16px;">
        <div style="border-left: 3.5px solid ${accentColor}; padding-left: 8px; margin-bottom: 6px;">
          <h2 style="margin: 0; font-size: 12.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
            ${escapeHtml(sec.name)}
          </h2>
        </div>
        ${contentHtml}
      </section>
    `;
  }).join('');

  // Attendees HTML table (3 columns)
  const attendeesTableHtml = `
    <div style="margin-top: 6px; margin-bottom: 14px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #cbd5e1;">
            <th style="padding: 5px 8px; font-weight: 700; color: #334155; width: 35%;">Name</th>
            <th style="padding: 5px 8px; font-weight: 700; color: #334155; width: 45%;">Role / Organization</th>
            <th style="padding: 5px 8px; font-weight: 700; color: #334155; width: 20%;">Attendance</th>
          </tr>
        </thead>
        <tbody>
          ${doc.attendees.map((a, i) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${i % 2 === 1 ? '#fafafa' : '#ffffff'};">
              <td style="padding: 5px 8px; font-weight: 700; color: #0f172a;">${escapeHtml(a.name)}</td>
              <td style="padding: 5px 8px; color: #475569;">${escapeHtml(a.role)}</td>
              <td style="padding: 5px 8px;">
                <span style="font-size: 9.5px; font-weight: 700; padding: 1.5px 6px; border-radius: 4px; ${
                  a.attendance.toLowerCase().includes('present')
                    ? 'background: #dcfce7; color: #15803d;'
                    : (a.attendance.toLowerCase().includes('remote') ? 'background: #e0f2fe; color: #0369a1;' : 'background: #fee2e2; color: #b91c1c;')
                }">
                  ${escapeHtml(a.attendance)}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Agenda HTML
  const agendaHtml = doc.agenda && doc.agenda.length > 0 ? `
    <section style="margin-bottom: 16px;">
      <div style="border-left: 3.5px solid ${accentColor}; padding-left: 8px; margin-bottom: 6px;">
        <h2 style="margin: 0; font-size: 12.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
          Agenda Topics
        </h2>
      </div>
      <ol style="margin: 6px 0 10px 18px; padding-left: 0; font-size: 12px; line-height: 1.6; color: #334155;">
        ${doc.agenda.map(item => `<li style="margin-bottom: 3px;">${escapeHtml(item)}</li>`).join('')}
      </ol>
    </section>
  ` : '';

  // The complete Document Sheet HTML
  const documentBodyHtml = `
    <div class="mom-sheet" style="max-width: 680px; margin: 0 auto; background: #ffffff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; padding: 36px 40px; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07); border: 1px solid #e5e7eb; border-radius: 4px; position: relative;">
      <!-- Accent Top Bar -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background-color: ${accentColor}; border-top-left-radius: 3px; border-top-right-radius: 3px;"></div>

      <!-- Header Subtitle & Title -->
      <div style="margin-top: 4px; margin-bottom: 14px;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.16em; color: ${accentColor}; text-transform: uppercase; margin-bottom: 4px;">
          MINUTES OF MEETING &bull; OFFICIAL RECORD
        </div>
        <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; line-height: 1.25;">
          ${escapeHtml(doc.title)}
        </h1>
        <div style="font-size: 11px; color: #64748b; font-weight: 500;">
          Template: <b style="color: #334155;">${escapeHtml(template.name)}</b> &bull; ${escapeHtml(template.category || 'General')}
        </div>
      </div>

      <!-- Metadata Grid (2 Columns) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px;">
        <div>
          <span style="color: #64748b; font-weight: 600;">Date &amp; Time:</span>
          <div style="color: #0f172a; font-weight: 700; margin-top: 1px;">${escapeHtml(doc.date)} (${escapeHtml(doc.duration)})</div>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Platform / Location:</span>
          <div style="color: #0f172a; font-weight: 700; margin-top: 1px;">${escapeHtml(doc.location)}</div>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Facilitator / Chair:</span>
          <div style="color: #0f172a; font-weight: 700; margin-top: 1px;">${escapeHtml(doc.chair)}</div>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Document Ref:</span>
          <div style="color: #0f172a; font-weight: 700; margin-top: 1px;">${escapeHtml(doc.docId)}</div>
        </div>
      </div>

      <!-- Attendees Table -->
      <section style="margin-bottom: 16px;">
        <div style="border-left: 3.5px solid ${accentColor}; padding-left: 8px; margin-bottom: 4px;">
          <h2 style="margin: 0; font-size: 12.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
            Attendees &amp; Quorum
          </h2>
        </div>
        ${attendeesTableHtml}
      </section>

      <!-- Agenda -->
      ${agendaHtml}

      <!-- Dynamic Template Sections -->
      ${renderedSectionsHtml}

      <!-- Document Sign-off & Footer -->
      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #64748b;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
          <div>
            <span style="font-weight: 700; color: #334155;">Next Scheduled Sync:</span>
            <div>${escapeHtml(doc.nextMeeting || 'To be determined by project leads')}</div>
          </div>
          <div>
            <span style="font-weight: 700; color: #334155;">Distribution:</span>
            <div>${escapeHtml(doc.distribution || 'All Attendees & Leadership Team')}</div>
          </div>
        </div>

        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;">
          <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">Minutes Certification &amp; Approval:</div>
          <div style="color: #475569;">Minutes approved by: <span style="border-bottom: 1px solid #94a3b8; display: inline-block; width: 180px;">&nbsp;</span> &nbsp;&bull;&nbsp; Date: <span style="border-bottom: 1px solid #94a3b8; display: inline-block; width: 100px;">&nbsp;</span></div>
        </div>

        <div style="text-align: center; font-size: 9.5px; color: #94a3b8; margin-top: 6px;">
          Generated with Minomeet AI &bull; 100% On-Device Neural Synthesis &bull; Template: ${escapeHtml(template.name)}
        </div>
      </div>
    </div>
  `;

  if (options?.embedBodyOnly) {
    return documentBodyHtml;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(doc.title)} — MOM</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 12mm;
        }
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .mom-sheet {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
        body {
          margin: 0;
          padding: 24px;
          background: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      </style>
    </head>
    <body>
      ${documentBodyHtml}
    </body>
    </html>
  `;
}

/**
 * Renders Markdown for export or copy.
 */
export function renderMomDocumentMarkdown(
  template: MOMTemplate,
  sourceData?: MOMSampleDocument | Meeting | any
): string {
  const doc = resolveDocumentData(template, sourceData);
  const sections = normalizeSections(template.sections);

  let md = `# ${doc.title}\n\n`;
  md += `**MINUTES OF MEETING** | **Template:** ${template.name} (${template.category || 'General'})\n`;
  md += `**Date:** ${doc.date} | **Duration:** ${doc.duration} | **Platform:** ${doc.location}\n`;
  md += `**Chair:** ${doc.chair} | **Ref:** ${doc.docId}\n\n`;

  // Attendees table
  if (doc.attendees && doc.attendees.length > 0) {
    md += `### Attendees & Quorum\n`;
    md += `| Name | Role | Attendance |\n|---|---|---|\n`;
    for (const a of doc.attendees) {
      md += `| ${a.name} | ${a.role} | ${a.attendance} |\n`;
    }
    md += `\n`;
  }

  // Agenda
  if (doc.agenda && doc.agenda.length > 0) {
    md += `### Agenda Topics\n`;
    doc.agenda.forEach((item, idx) => {
      md += `${idx + 1}. ${item}\n`;
    });
    md += `\n`;
  }

  // Dynamic sections
  for (const sec of sections) {
    const secName = sec.title || (sec as any).name || '';
    const nameLower = secName.toLowerCase();
    let rawVal = doc.sections[secName] || ((sec as any).name ? doc.sections[(sec as any).name] : '') || (sec.id ? doc.sections[sec.id] : '') || '';
    if (!rawVal || (Array.isArray(rawVal) && rawVal.length === 0)) {
      const matchedKey = Object.keys(doc.sections).find(k => {
        const kLower = k.toLowerCase();
        return kLower === nameLower ||
          (nameLower.includes('action') && kLower.includes('action')) ||
          (nameLower.includes('decision') && kLower.includes('decision')) ||
          (nameLower.includes('summary') && kLower.includes('summary')) ||
          (nameLower.includes('highlight') && kLower.includes('highlight')) ||
          (nameLower.includes('next step') && kLower.includes('next step'));
      });
      if (matchedKey && doc.sections[matchedKey]) {
        rawVal = doc.sections[matchedKey];
      }
    }
    const isDecisionSection = secName.toLowerCase().includes('decision');

    md += `### ${secName}\n`;
    if (Array.isArray(rawVal) && rawVal.length > 0 && typeof rawVal[0] === 'object' && rawVal[0] !== null) {
      const cols = sec.columns && sec.columns.length > 0
        ? sec.columns
        : Object.keys(rawVal[0]).filter(k => k !== 'id');
      md += `| ${cols.join(' | ')} |\n| ${cols.map(() => '---').join(' | ')} |\n`;
      for (const row of rawVal) {
        const line = cols.map(c => {
          const cLower = c.toLowerCase();
          const k = Object.keys(row).find(key => {
            const kl = key.toLowerCase();
            return kl === cLower ||
              (cLower.includes('task') && kl.includes('task')) ||
              (cLower.includes('owner') && kl.includes('owner')) ||
              (cLower.includes('due') && kl.includes('due')) ||
              (cLower.includes('status') && (kl.includes('status') || kl.includes('completed')));
          }) || c;
          let cellVal = row[k] ?? row[c] ?? '';
          if (typeof cellVal === 'boolean') {
            cellVal = cellVal ? 'Completed' : 'Pending';
          }
          return String(cellVal).replace(/\|/g, '\\|');
        }).join(' | ');
        md += `| ${line} |\n`;
      }
      md += `\n`;
    } else if (Array.isArray(rawVal) && rawVal.length > 0) {
      rawVal.forEach((item, idx) => {
        const str = String(item);
        if (isDecisionSection && !str.startsWith('[D-')) {
          md += `- **[D-${String(idx + 1).padStart(2, '0')}]** ${str}\n`;
        } else {
          md += `- ${str}\n`;
        }
      });
      md += `\n`;
    } else if (typeof rawVal === 'string' && rawVal.trim().length > 0) {
      md += `${rawVal}\n\n`;
    } else {
      md += `_No notes recorded._\n\n`;
    }
  }

  md += `---\n`;
  md += `**Next Meeting:** ${doc.nextMeeting || 'TBD'} | **Distribution:** ${doc.distribution || 'All Attendees'}\n`;
  md += `*Minutes approved by: _______________________ Date: _________*\n`;
  md += `*Generated by Minomeet AI · ${template.name}*\n`;

  return md;
}

/**
 * Triggers clean print preview using an invisible iframe.
 */
export function printMomDocument(
  template: MOMTemplate,
  sourceData?: MOMSampleDocument | Meeting | any
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const html = renderMomDocumentHtml(template, sourceData, { forPrint: true });

  const oldFrame = document.getElementById('minomeet-print-frame');
  if (oldFrame && oldFrame.parentNode) {
    oldFrame.parentNode.removeChild(oldFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'minomeet-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      }
      setTimeout(() => {
        try {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch (e) {}
      }, 4000);
    }, 350);
  } else {
    window.print();
  }
}
