import { MOMTemplate, MOMTemplateSection } from '../types/meeting';

export const BUILT_IN_TEMPLATE_IDS = [
  'std-mom',
  'exec-board',
  'eng-standup',
  'client-sales',
  'product-design'
] as const;

export type BuiltInTemplateId = typeof BUILT_IN_TEMPLATE_IDS[number];

export const OLD_BUILT_IN_IDS = [
  'template-standard',
  'template-executive',
  'template-standup',
  'template-sales',
  'template-product',
  'template-product-design',
  'template-retrospective',
  'daily_standup',
  'standard_meeting'
];

export const BUILT_IN_TEMPLATES: MOMTemplate[] = [
  // 1. Standard Meeting Notes & MOM
  {
    id: 'std-mom',
    name: 'Standard Meeting Notes & MOM',
    category: 'General',
    description: 'Comprehensive business meeting record capturing executive summary, agreed decisions, assigned tasks with deadlines, key discussion points, and next steps.',
    icon: 'file-text',
    accentColor: '#2563eb',
    sections: [
      { id: 'exec-summary', title: 'Executive Summary', type: 'text' },
      { id: 'key-decisions', title: 'Key Decisions', type: 'bullets' },
      { id: 'action-items', title: 'Action Items & Ownership', type: 'table' },
      { id: 'discussion-highlights', title: 'Discussion Highlights', type: 'bullets' },
      { id: 'next-steps', title: 'Next Steps', type: 'bullets' }
    ],
    tableColumns: ['Owner', 'Task', 'Due Date', 'Status'],
    promptInstructions: 'Generate clean, professional Minutes of Meeting (MOM). Synthesize the overarching purpose into an Executive Summary. Enumerate firm Key Decisions with D-01, D-02 decision codes. Extract concrete Action Items into the structured table with assignees, due dates, and initial status. Summarize discussion highlights and list clear next steps.',
    sampleDocument: {
      meetingTitle: 'Q4 Strategic Execution & Cross-Functional Alignment',
      date: 'Nov 21, 2026',
      duration: '45 mins',
      location: 'Executive Boardroom & Zoom Conf Room A',
      preparedBy: 'Minomeet AI Assistant',
      aiModel: 'Built-in Neural AI (Local)',
      attendees: [
        { name: 'Sarah Chen', role: 'VP of Product', attendance: 'Present' },
        { name: 'Alex Rivera', role: 'Engineering Director', attendance: 'Present' },
        { name: 'Marcus Vance', role: 'Head of Operations', attendance: 'Present' },
        { name: 'Elena Rostova', role: 'Executive Sponsor', attendance: 'Remote' }
      ],
      agenda: [
        '1. Review Q4 Delivery Milestones & KPI Attainment',
        '2. Infrastructure Scaling & Production Readiness',
        '3. Action Items Assignment & Sign-off'
      ],
      sectionsData: {
        'exec-summary': 'The leadership committee convened to review key Q4 deliverables, operational benchmarks, and cross-functional dependencies across core engineering and product tracks. All milestones remain on track for end-of-quarter release with system uptime holding at 99.98% across all production environments.\n\nResource allocations for cloud infrastructure and on-device model optimization were ratified to ensure frictionless scaling into the next fiscal quarter.',
        'key-decisions': [
          'D-01: Approved the production rollout timeline scheduled for Sunday 02:00 UTC during low-traffic maintenance window.',
          'D-02: Ratified mandatory zero-telemetry policy for all enterprise on-device speech processing.',
          'D-03: Agreed on bi-weekly cross-functional standup cadence to streamline engineering deliverables.'
        ],
        'action-items': [
          { Owner: 'Alex Rivera', Task: 'Conduct staging rehearsal for database replication cutover', 'Due Date': 'Friday, Nov 27', Status: 'In Progress' },
          { Owner: 'Sarah Chen', Task: 'Publish product release notes and customer-facing changelog', 'Due Date': 'Monday, Nov 30', Status: 'Pending' },
          { Owner: 'Marcus Vance', Task: 'Notify enterprise clients of scheduled maintenance window', 'Due Date': 'Wednesday, Nov 25', Status: 'Completed' }
        ],
        'discussion-highlights': [
          'Analyzed compute resource utilization during simulated high-concurrency peak load tests.',
          'Evaluated telemetry reporting latency and resolved edge caching constraints.',
          'Reviewed customer sentiment survey scores indicating 94% positive adoption for real-time transcription.'
        ],
        'next-steps': [
          'Circulate approved Minutes of Meeting document to all attendees within 24 hours.',
          'Convene cutover review sync on Thursday at 14:00 UTC.'
        ]
      },
      nextMeeting: 'Thursday, Nov 26, 2026 at 10:00 AM UTC',
      distribution: 'Executive Leadership, Engineering Leads, Product Operations',
      signoff: 'Sarah Chen (VP of Product)'
    },
    isBuiltIn: true,
    isDefault: true,
    isSystem: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },

  // 2. Executive & Board Briefing
  {
    id: 'exec-board',
    name: 'Executive & Board Briefing',
    category: 'Leadership',
    description: 'High-level strategic briefing designed for executives, board directors, and C-suite leadership focusing on organizational directives, governance, and capital priorities.',
    icon: 'shield',
    accentColor: '#7c3aed',
    sections: [
      { id: 'exec-briefing', title: 'Strategic Executive Briefing', type: 'text' },
      { id: 'board-decisions', title: 'Board Decisions & Directives', type: 'bullets' },
      { id: 'strategic-deliverables', title: 'Strategic Deliverables & Ownership', type: 'table' },
      { id: 'strategic-deliberations', title: 'Strategic Deliberations', type: 'bullets' },
      { id: 'horizon-roadmap', title: 'Horizon Roadmap', type: 'bullets' }
    ],
    tableColumns: ['Owner', 'Strategic Deliverable', 'Target Date', 'Status'],
    promptInstructions: 'Synthesize conversation into an authoritative Executive & Board Briefing. Highlight high-level strategic developments, formal board resolutions (D-01, D-02), capital allocations, strategic deliverables, risk deliberations, and multi-quarter horizon roadmaps. Omit granular engineering details.',
    sampleDocument: {
      meetingTitle: 'Board of Directors Q4 Strategic Governance Briefing',
      date: 'Nov 21, 2026',
      duration: '60 mins',
      location: 'Corporate Headquarters & Secure Video Link',
      preparedBy: 'Office of the Corporate Secretary & Minomeet AI',
      aiModel: 'Built-in Neural AI (Local)',
      attendees: [
        { name: 'Elena Rostova', role: 'Chief Executive Officer', attendance: 'Present' },
        { name: 'Marcus Vance', role: 'Chief Financial Officer', attendance: 'Present' },
        { name: 'Priya Patel', role: 'Chief Technology Officer', attendance: 'Present' },
        { name: 'Jonathan Sterling', role: 'Lead Independent Director', attendance: 'Present' }
      ],
      agenda: [
        '1. Fiscal 2027 Capital Budget Allocation & Operational Expenditure',
        '2. International Data Boundary Expansion Strategy',
        '3. Board Resolutions & Executive Directives'
      ],
      sectionsData: {
        'exec-briefing': 'Executive leadership presented the FY27 capital expansion charter, financial operating projections, and international market expansion roadmap. Annual recurring revenue expanded 38% year-over-year, outpacing consensus quarterly targets while preserving an efficient operating cash burn multiple.\n\nThe board conducted extensive deliberations regarding geographic boundary isolations, regulatory compliance posture, and strategic technological differentiators in on-device AI.',
        'board-decisions': [
          'D-01: Unanimously approved $14.5M capital budget allocation for dedicated on-device neural hardware acceleration.',
          'D-02: Authorized incorporation of European regional operational entity to satisfy strict data sovereignty regulations.',
          'D-03: Ratified revised compensation committee recommendations for executive performance milestones.'
        ],
        'strategic-deliverables': [
          { Owner: 'Marcus Vance (CFO)', 'Strategic Deliverable': 'Finalize syndicated credit facility documentation with Tier-1 lead banks', 'Target Date': 'Q1 2027', Status: 'Approved' },
          { Owner: 'Priya Patel (CTO)', 'Strategic Deliverable': 'Commission isolated European data sovereign server cluster', 'Target Date': 'Q2 2027', Status: 'In Review' },
          { Owner: 'Elena Rostova (CEO)', 'Strategic Deliverable': 'Execute strategic partnership agreements with enterprise OEM distribution partners', 'Target Date': 'Q1 2027', Status: 'Active' }
        ],
        'strategic-deliberations': [
          'Deliberated on macroeconomic currency hedging strategies to protect against transatlantic foreign exchange volatility.',
          'Assessed supply chain multi-sourcing contracts to guarantee GPU accelerator supply quotas through FY28.'
        ],
        'horizon-roadmap': [
          'Audit committee compliance review scheduled for January 14, 2027.',
          'Full annual shareholder governance assembly convened for March 22, 2027.'
        ]
      },
      nextMeeting: 'January 14, 2027 at 09:00 AM EST',
      distribution: 'Board of Directors, Executive Committee, Corporate Legal Counsel',
      signoff: 'Jonathan Sterling (Lead Independent Director)'
    },
    isBuiltIn: true,
    isDefault: false,
    isSystem: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },

  // 3. Engineering & Agile Standup
  {
    id: 'eng-standup',
    name: 'Engineering & Agile Standup',
    category: 'Technical',
    description: 'Fast-paced engineering sync capturing sprint status, architecture decisions, active PRs, technical blockers, and 24-hour sprint commitments.',
    icon: 'code',
    accentColor: '#0891b2',
    sections: [
      { id: 'sprint-status', title: 'Sprint Status & Daily Sync', type: 'text' },
      { id: 'arch-decisions', title: 'Architectural Decisions (ADR)', type: 'bullets' },
      { id: 'sprint-tasks', title: 'Sprint Tasks & Backlog Assignments', type: 'table' },
      { id: 'tech-blockers', title: 'Tech Debates & Blockers', type: 'bullets' },
      { id: 'next-24h', title: 'Next 24h Sprint Goals', type: 'bullets' }
    ],
    tableColumns: ['Owner', 'Task / PR', 'Due Sprint', 'Priority'],
    promptInstructions: 'Extract engineering and agile sprint details. Summarize daily sprint velocity and PR statuses in Sprint Status. Detail architectural consensus (D-01, D-02). Tabulate sprint tasks with owners, PR tickets, and priority. Outline active blockers and list concrete 24-hour engineering goals.',
    sampleDocument: {
      meetingTitle: 'Sprint 44 Platform Core & Audio Engine Standup',
      date: 'Nov 21, 2026',
      duration: '15 mins',
      location: 'Engineering Slack Huddle & Dev Lab',
      preparedBy: 'Minomeet Engine Bot',
      aiModel: 'Built-in Neural AI (Local)',
      attendees: [
        { name: 'Jason Miller', role: 'Audio DSP Engineer', attendance: 'Present' },
        { name: 'Maria Santos', role: 'Rust Systems Lead', attendance: 'Present' },
        { name: 'Kenji Sato', role: 'Frontend Architect', attendance: 'Present' }
      ],
      agenda: [
        '1. Yesterday PR Merge Status & Benchmark Reviews',
        '2. CoreAudio Ring Buffer Memory Profile',
        '3. Active Blocker Resolution & Pairing Plan'
      ],
      sectionsData: {
        'sprint-status': 'Platform engineering completed 94% of committed Sprint 44 story points. PR #412 optimizing CircularBuffer ring-buffer memory allocations was verified and merged into main without regression. Whisper.cpp Metal inference throughput benchmarked at 142 tokens/sec with batch size 1 on Apple Silicon hardware.',
        'arch-decisions': [
          'D-01: Enforced 16kHz mono internally across all audio pipelines before feeding Whisper/Parakeet native workers.',
          'D-02: Adopted asynchronous batching for Tauri IPC transcript events to eliminate main thread UI micro-stutters.'
        ],
        'sprint-tasks': [
          { Owner: 'Jason Miller', 'Task / PR': 'PR #419: Speech Metal kernel FP16 vectorization', 'Due Sprint': 'Sprint 44', Priority: 'P0 - Blocker' },
          { Owner: 'Maria Santos', 'Task / PR': 'CORE-882: SQLite WAL mode concurrency stress test', 'Due Sprint': 'Sprint 44', Priority: 'P1 - High' },
          { Owner: 'Kenji Sato', 'Task / PR': 'UI-104: Template preview modal document viewer component', 'Due Sprint': 'Sprint 44', Priority: 'P1 - High' }
        ],
        'tech-blockers': [
          'PR #419 blocked awaiting macOS 15.2 SDK beta test harness; temporary workaround enabled via software fallback.',
          'SQLite write-lock contention resolved by configuring 5000ms busy timeout.'
        ],
        'next-24h': [
          'Jason and Maria pairing at 15:30 to profile CoreAudio ring buffer memory consumption.',
          'Kenji to finalize template selection state synchronization in Settings screen.'
        ]
      },
      nextMeeting: 'Tomorrow, Nov 22, 2026 at 09:30 AM',
      distribution: 'Platform Core Engineering Team, QA Automation',
      signoff: 'Maria Santos (Rust Systems Lead)'
    },
    isBuiltIn: true,
    isDefault: false,
    isSystem: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },

  // 4. Client Discovery & Commercial
  {
    id: 'client-sales',
    name: 'Client Discovery & Commercial',
    category: 'Sales',
    description: 'Commercial customer qualification capturing client opportunity, agreed scope, pricing terms, customer pain points, and commercial timelines.',
    icon: 'briefcase',
    accentColor: '#059669',
    sections: [
      { id: 'client-opportunity', title: 'Client Opportunity Overview', type: 'text' },
      { id: 'agreed-scope', title: 'Agreed Scope & Commercial Terms', type: 'bullets' },
      { id: 'commercial-deliverables', title: 'Commercial Deliverables', type: 'table' },
      { id: 'client-pain-points', title: 'Client Pain Points', type: 'bullets' },
      { id: 'commercial-timeline', title: 'Commercial Follow-Up Timeline', type: 'bullets' }
    ],
    tableColumns: ['Owner', 'Deliverable', 'Due Date', 'Context'],
    promptInstructions: 'Structure meeting minutes for commercial discovery and customer qualification. Summarize client background and deal parameters. Document agreed scope and pricing terms (D-01, D-02). Tabulate commercial deliverables. Enumerate client pain points and establish strict follow-up timelines.',
    sampleDocument: {
      meetingTitle: 'Acme Health Enterprise Discovery & Compliance Sync',
      date: 'Nov 21, 2026',
      duration: '35 mins',
      location: 'Google Meet & Customer Executive Briefing Center',
      preparedBy: 'Commercial AI Assistant',
      aiModel: 'Built-in Neural AI (Local)',
      attendees: [
        { name: 'Robert Sterling', role: 'Enterprise Account Director', attendance: 'Present' },
        { name: 'Lisa Zhang', role: 'Principal Solutions Architect', attendance: 'Present' },
        { name: 'Dr. Aris Thorne', role: 'VP of Medical Informatics (Acme Health)', attendance: 'Present' }
      ],
      agenda: [
        '1. Clinical Data Security & HIPAA On-Premises Mandate',
        '2. 250-Seat Enterprise License Pricing & SLA Tiers',
        '3. Pilot Rollout Timeline & Security Whitepaper Review'
      ],
      sectionsData: {
        'client-opportunity': 'Acme Health Technologies requires a strictly on-device, HIPAA-compliant speech-to-text meeting summarizer for medical executive discussions. Cloud-based transcription services violate internal compliance guidelines; 100% air-gapped processing is a non-negotiable prerequisite.\n\nCommercial opportunity size estimated at 250 enterprise seats with annual recurring license commitment.',
        'agreed-scope': [
          'D-01: Approved 60-day enterprise pilot deployment across 3 clinical governance committees.',
          'D-02: Agreed on annual enterprise licensing model at $120k ARR including dedicated support engineering.'
        ],
        'commercial-deliverables': [
          { Owner: 'Lisa Zhang', Deliverable: 'Provide SOC2 Type II report and on-device architecture whitepaper', 'Due Date': 'Tuesday, Nov 25', Context: 'Information Security Committee sign-off' },
          { Owner: 'Robert Sterling', Deliverable: 'Issue executable Master Services Agreement (MSA) and Pilot Order Form', 'Due Date': 'Wednesday, Nov 26', Context: 'Procurement legal review' },
          { Owner: 'Dr. Thorne', Deliverable: 'Confirm pilot participant roster and macOS test hardware fleet', 'Due Date': 'Monday, Dec 01', Context: 'Pilot kickoff readiness' }
        ],
        'client-pain-points': [
          'Existing cloud meeting recorders leak confidential patient identifier discussions.',
          'Meeting summaries currently taken manually by senior physicians, consuming 4+ hours weekly.'
        ],
        'commercial-timeline': [
          'Security audit call with Acme CISO confirmed for Dec 03, 2026.',
          'Target pilot deployment go-live date set for Dec 15, 2026.'
        ]
      },
      nextMeeting: 'Dec 03, 2026 at 11:00 AM EST',
      distribution: 'Enterprise Sales, Solutions Architecture, Acme Procurement Team',
      signoff: 'Robert Sterling (Enterprise Account Director)'
    },
    isBuiltIn: true,
    isDefault: false,
    isSystem: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },

  // 5. Product & Design Review
  {
    id: 'product-design',
    name: 'Product & Design Review',
    category: 'Product',
    description: 'Product vision, UX flows, critique findings, wireframe/spec decisions, design action items, and next prototype milestones.',
    icon: 'palette',
    accentColor: '#ea580c',
    sections: [
      { id: 'product-vision', title: 'Product Vision & UX Overview', type: 'text' },
      { id: 'feature-scope', title: 'Feature Scope & Design Decisions', type: 'bullets' },
      { id: 'design-action-items', title: 'Design Action Items', type: 'table' },
      { id: 'usability-findings', title: 'Usability Findings', type: 'bullets' },
      { id: 'next-milestones', title: 'Next Milestones', type: 'bullets' }
    ],
    tableColumns: ['Owner', 'Prototype / Spec Task', 'Target Milestone', 'Design Notes'],
    promptInstructions: 'Synthesize product design and UX review discussions. Summarize product vision and customer problem. Detail UX decisions and design system approvals (D-01, D-02). Tabulate design action items with assignees and target milestones. Capture usability critique findings and outline upcoming delivery sprints.',
    sampleDocument: {
      meetingTitle: 'Settings Redesign & Template Preview UX Review',
      date: 'Nov 21, 2026',
      duration: '40 mins',
      location: 'Figma Jam & Design Studio 3',
      preparedBy: 'Product Design AI',
      aiModel: 'Built-in Neural AI (Local)',
      attendees: [
        { name: 'Chloe Martin', role: 'Staff Product Designer', attendance: 'Present' },
        { name: 'Tyler Ross', role: 'Principal Product Manager', attendance: 'Present' },
        { name: 'Frank Wu', role: 'Frontend Design Engineer', attendance: 'Present' }
      ],
      agenda: [
        '1. Template Selection Hero Card & Preview Modal Critique',
        '2. Micro-interactions: Knob Transitions & Hover Lift',
        '3. Design Token Standardization Across Cards'
      ],
      sectionsData: {
        'product-vision': 'The team conducted a comprehensive design audit of the Settings experience, centering on the Template Gallery and realistic MOM preview dialog. Users need immediate visual confidence that selecting a template directly shapes their exported meeting minutes document.\n\nAll components adhere strictly to the established light palette (blue #2563eb, light blue #eff6ff, border #e5e7eb) with 20px padding and rounded-2xl geometry.',
        'feature-scope': [
          'D-01: Approved the top \'Active Template\' hero card with miniature document thumbnail and instant Preview button.',
          'D-02: Mandated centered A4 sheet preview with realistic drop shadow, clean typography, and dedicated print action.'
        ],
        'design-action-items': [
          { Owner: 'Chloe Martin', 'Prototype / Spec Task': 'Deliver interactive Figma component variants for active template cards', 'Target Milestone': 'Sprint 45', 'Design Notes': 'Include keyboard focus-visible rings' },
          { Owner: 'Frank Wu', 'Prototype / Spec Task': 'Implement hidden iframe print utility for instantaneous paper output', 'Target Milestone': 'Sprint 45', 'Design Notes': 'Zero UI flicker during print' },
          { Owner: 'Tyler Ross', 'Prototype / Spec Task': 'Draft specification document for template section schema validation', 'Target Milestone': 'Sprint 45', 'Design Notes': 'Limit 1-10 sections, 80 char title' }
        ],
        'usability-findings': [
          'Testers overwhelmingly preferred reading full realistic sample documents over generic filler text.',
          'The green Active Default badge provided unmistakable confirmation of the currently applied template.'
        ],
        'next-milestones': [
          'Engineering handoff scheduled for Wednesday at 16:00.',
          'Usability testing session with 8 beta customers on Friday morning.'
        ]
      },
      nextMeeting: 'Wednesday, Nov 25, 2026 at 04:00 PM',
      distribution: 'Product Design, Product Management, Frontend Engineering',
      signoff: 'Chloe Martin (Staff Product Designer)'
    },
    isBuiltIn: true,
    isDefault: false,
    isSystem: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  }
];

// Alias for backwards compatibility
export const DEFAULT_MOM_TEMPLATES: MOMTemplate[] = [...BUILT_IN_TEMPLATES];

/**
 * Normalizes template sections into strongly typed objects: { id, title, type }
 */
export function normalizeSections(sections?: (MOMTemplateSection | string)[]): MOMTemplateSection[] {
  if (!Array.isArray(sections)) return [];
  return sections.map((sec, idx) => {
    if (typeof sec === 'string') {
      const title = sec.trim();
      const lower = title.toLowerCase();
      let type: 'text' | 'bullets' | 'table' = 'text';
      let columns: string[] | undefined;
      if (lower.includes('table') || lower.includes('matrix') || lower.includes('action') || lower.includes('task') || lower.includes('deliverable')) {
        type = 'table';
        columns = ['Owner', 'Task', 'Due Date', 'Status'];
      } else if (lower.includes('decision') || lower.includes('highlight') || lower.includes('step') || lower.includes('bullet') || lower.includes('finding')) {
        type = 'bullets';
      }
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `section-${idx + 1}`;
      return { id: slug, title, name: title, type, columns };
    }
    const title = sec.title || (sec as any).name || `Section ${idx + 1}`;
    const name = (sec as any).name || sec.title || title;
    const id = sec.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `section-${idx + 1}`;
    return {
      ...sec,
      id,
      title,
      name,
      type: sec.type || 'text',
      columns: (sec as any).columns || (sec.type === 'table' ? ['Owner', 'Task', 'Due Date', 'Status'] : undefined)
    };
  });
}

/**
 * Checks whether an ID belongs to the canonical built-in templates
 */
export function isBuiltInTemplateId(id?: string): boolean {
  if (!id) return false;
  return BUILT_IN_TEMPLATE_IDS.includes(id as BuiltInTemplateId);
}

/**
 * Deduplicates and migrates templates:
 * 1. Canonical 5 built-ins always appear first in exact order.
 * 2. Stale or duplicated legacy built-in copies are pruned.
 * 3. Genuinely user-created custom templates are preserved.
 */
export function migrateTemplates(storedList: any[] = []): MOMTemplate[] {
  const customTemplates: MOMTemplate[] = [];
  const seenIds = new Set<string>(BUILT_IN_TEMPLATE_IDS);
  const builtInNames = new Set<string>(BUILT_IN_TEMPLATES.map(b => b.name.toLowerCase()));

  if (Array.isArray(storedList)) {
    for (const item of storedList) {
      if (!item || !item.id) continue;
      const id = String(item.id);
      const name = String(item.name || '').trim().toLowerCase();

      // Skip old built-in IDs or matching names
      if (isBuiltInTemplateId(id) || OLD_BUILT_IN_IDS.includes(id)) continue;
      if (builtInNames.has(name) && (item.isBuiltIn || item.isSystem)) continue;

      if (!seenIds.has(id)) {
        seenIds.add(id);
        customTemplates.push({
          ...item,
          isBuiltIn: false,
          isSystem: false,
          sections: normalizeSections(item.sections || [])
        });
      }
    }
  }

  return [...BUILT_IN_TEMPLATES, ...customTemplates];
}

/**
 * Resolves active template by ID or name, falling back to 'std-mom'
 */
export function resolveActiveTemplate(
  templates: MOMTemplate[] = BUILT_IN_TEMPLATES,
  targetId?: string,
  fallbackName?: string
): MOMTemplate {
  if (targetId) {
    const byId = templates.find(t => t.id === targetId || t.name.toLowerCase() === targetId.toLowerCase());
    if (byId) return byId;
  }

  if (fallbackName) {
    const lower = fallbackName.toLowerCase();
    const byName = templates.find(
      t => t.name.toLowerCase() === lower ||
           t.id === lower ||
           t.name.toLowerCase().includes(lower)
    );
    if (byName) return byName;

    // Word-based match (e.g. "Executive Board" matches "Executive & Board Briefing")
    const words = lower.split(/\W+/).filter(w => w.length > 2);
    if (words.length > 0) {
      const byWords = templates.find(t => {
        const tLower = t.name.toLowerCase();
        return words.every(w => tLower.includes(w));
      });
      if (byWords) return byWords;
    }
  }

  return templates.find(t => t.id === 'std-mom') || templates[0] || BUILT_IN_TEMPLATES[0];
}
