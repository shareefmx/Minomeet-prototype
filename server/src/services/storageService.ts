import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Meeting, AppSettings, MOMTemplate } from '../types/index.js';
import { defaultMeetings, defaultSettings } from '../data/defaultMeetings.js';
import { defaultTemplates } from '../data/defaultTemplates.js';
import {
  BUILT_IN_TEMPLATES,
  isBuiltInTemplateId,
  migrateTemplates,
  normalizeSections
} from '../utils/momTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

interface DatabaseSchema {
  meetings: Meeting[];
  settings: AppSettings;
  templates: MOMTemplate[];
}

class StorageService {
  private db: DatabaseSchema = {
    meetings: [...defaultMeetings],
    settings: { ...defaultSettings },
    templates: [...defaultTemplates]
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const parsedSettings = parsed.settings || {};
        const migratedTemplates = migrateTemplates(parsed.templates || []);
        const validTemplateIds = migratedTemplates.map(t => t.id);

        let defaultTemplateId = parsedSettings.defaultTemplateId;
        if (!defaultTemplateId || !validTemplateIds.includes(defaultTemplateId)) {
          const matchingByName = migratedTemplates.find(
            t => t.name.toLowerCase() === (parsedSettings.defaultTemplate || '').toLowerCase()
          );
          defaultTemplateId = matchingByName ? matchingByName.id : 'std-mom';
        }

        const activeTmpl = migratedTemplates.find(t => t.id === defaultTemplateId) || migratedTemplates[0];
        migratedTemplates.forEach(t => t.isDefault = (t.id === defaultTemplateId));

        const migratedSettings: AppSettings = {
          ...defaultSettings,
          ...parsedSettings,
          defaultTemplateId,
          defaultTemplate: activeTmpl.name,
          autoSummaryOnConclude: parsedSettings.autoSummaryOnConclude !== undefined
            ? Boolean(parsedSettings.autoSummaryOnConclude)
            : (parsedSettings.autoSummary !== undefined ? Boolean(parsedSettings.autoSummary) : true),
          summaryComponents: {
            executiveSummary: parsedSettings.summaryComponents?.executiveSummary ?? true,
            actionItems: parsedSettings.summaryComponents?.actionItems ?? true,
            keyDecisions: parsedSettings.summaryComponents?.keyDecisions ?? true,
          },
          transcriptionLanguage: parsedSettings.transcriptionLanguage || 'en',
          summaryLanguage: parsedSettings.summaryLanguage || 'same',
        };

        this.db = {
          meetings: parsed.meetings || [...defaultMeetings],
          settings: migratedSettings,
          templates: migratedTemplates
        };
        this.save();
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize storage database, using defaults:', err);
      this.db = {
        meetings: [...defaultMeetings],
        settings: { ...defaultSettings },
        templates: [...defaultTemplates]
      };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Meetings CRUD
  public getMeetings(): Meeting[] {
    return this.db.meetings;
  }

  public getMeetingById(id: string): Meeting | undefined {
    return this.db.meetings.find(m => m.id === id);
  }

  public createMeeting(meeting: Meeting): Meeting {
    this.db.meetings.unshift(meeting);
    this.save();
    return meeting;
  }

  public updateMeeting(id: string, updates: Partial<Meeting>): Meeting | null {
    const index = this.db.meetings.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.db.meetings[index] = {
      ...this.db.meetings[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.db.meetings[index];
  }

  public deleteMeeting(id: string): boolean {
    const meeting = this.db.meetings.find(m => m.id === id);
    if (!meeting) return false;

    // Delete associated audio file when meeting is deleted
    if (meeting.audioPath) {
      try {
        const fileName = path.basename(meeting.audioPath);
        const resolvedUploadFile = path.join(UPLOADS_DIR, fileName);
        if (fs.existsSync(resolvedUploadFile)) {
          fs.unlinkSync(resolvedUploadFile);
        } else if (fs.existsSync(meeting.audioPath)) {
          fs.unlinkSync(meeting.audioPath);
        }
      } catch (err) {
        console.warn(`[storageService] Could not remove audio file for meeting ${id}:`, err);
      }
    }

    this.db.meetings = this.db.meetings.filter(m => m.id !== id);
    this.save();
    return true;
  }

  // Settings
  public getSettings(): AppSettings {
    return this.db.settings;
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    const currentComponents = this.db.settings.summaryComponents || {
      executiveSummary: true,
      actionItems: true,
      keyDecisions: true,
    };
    const summaryComponents = updates.summaryComponents !== undefined
      ? { ...currentComponents, ...updates.summaryComponents }
      : currentComponents;

    const autoSummaryOnConclude = updates.autoSummaryOnConclude !== undefined
      ? Boolean(updates.autoSummaryOnConclude)
      : (updates.autoSummary !== undefined ? Boolean(updates.autoSummary) : (this.db.settings.autoSummaryOnConclude ?? true));

    this.db.settings = {
      ...this.db.settings,
      ...updates,
      summaryComponents,
      autoSummaryOnConclude,
      autoSummary: autoSummaryOnConclude
    };
    this.save();
    return this.db.settings;
  }

  // Templates CRUD
  public getTemplates(): MOMTemplate[] {
    const list = migrateTemplates(this.db.templates || []);
    const defaultId = this.db.settings.defaultTemplateId || 'std-mom';
    list.forEach(t => t.isDefault = (t.id === defaultId));
    this.db.templates = list;
    return list;
  }

  public getTemplateById(id: string): MOMTemplate | undefined {
    return this.getTemplates().find(t => t.id === id || t.name.toLowerCase() === id.toLowerCase());
  }

  public createTemplate(template: Partial<MOMTemplate>): MOMTemplate {
    const templates = this.getTemplates();
    const customCount = templates.filter(t => !isBuiltInTemplateId(t.id)).length;
    if (customCount >= 20) {
      throw new Error('Maximum limit of 20 custom templates reached.');
    }
    const name = (template.name || '').trim();
    if (!name || name.length > 80) {
      throw new Error('Template name must be between 1 and 80 characters.');
    }
    if (templates.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A template with this name already exists.');
    }
    const sections = normalizeSections(template.sections || []);
    if (!sections || sections.length === 0 || sections.length > 10) {
      throw new Error('Templates must contain between 1 and 10 sections.');
    }

    const created: MOMTemplate = {
      id: template.id || ('custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)),
      name,
      category: template.category || 'Custom',
      description: (template.description || '').slice(0, 200),
      accentColor: template.accentColor || '#2563eb',
      sections,
      promptInstructions: template.promptInstructions || '',
      isBuiltIn: false,
      isSystem: false,
      isDefault: Boolean(template.isDefault),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (created.isDefault) {
      templates.forEach(t => t.isDefault = false);
      created.isDefault = true;
      this.updateSettings({
        defaultTemplateId: created.id,
        defaultTemplate: created.name
      });
    }
    templates.push(created);
    this.db.templates = templates;
    this.save();
    return created;
  }

  public updateTemplate(id: string, updates: Partial<MOMTemplate>): MOMTemplate | null {
    if (isBuiltInTemplateId(id)) {
      throw new Error('Built-in templates cannot be modified.');
    }
    const templates = this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    if (updates.isDefault) {
      templates.forEach(t => t.isDefault = false);
      this.updateSettings({
        defaultTemplateId: id,
        defaultTemplate: updates.name || templates[index].name
      });
    }

    templates[index] = {
      ...templates[index],
      ...updates,
      id: templates[index].id,
      isBuiltIn: false,
      isSystem: false,
      sections: updates.sections ? normalizeSections(updates.sections) : templates[index].sections,
      updatedAt: new Date().toISOString()
    };
    this.db.templates = templates;
    this.save();
    return templates[index];
  }

  public deleteTemplate(id: string): boolean {
    if (isBuiltInTemplateId(id)) {
      throw new Error('Built-in templates cannot be deleted.');
    }
    const templates = this.getTemplates();
    const target = templates.find(t => t.id === id);
    if (!target) return false;

    this.db.templates = templates.filter(t => t.id !== id);
    // If deleted template was default, fall back to std-mom
    if (target.id === this.db.settings.defaultTemplateId || target.isDefault) {
      this.setDefaultTemplate('std-mom');
    } else {
      this.save();
    }
    return true;
  }

  public setDefaultTemplate(id: string): MOMTemplate | null {
    const templates = this.getTemplates();
    const target = templates.find(t => t.id === id);
    if (!target) return null;

    templates.forEach(t => t.isDefault = (t.id === id));
    this.db.templates = templates;
    this.updateSettings({
      defaultTemplateId: target.id,
      defaultTemplate: target.name
    });
    this.save();
    return target;
  }
}

export const storageService = new StorageService();


