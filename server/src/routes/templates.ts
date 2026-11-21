import { Router, Request, Response } from 'express';
import { storageService } from '../services/storageService.js';
import { MOMTemplate } from '../types/index.js';
import { isBuiltInTemplateId, normalizeSections } from '../utils/momTemplates.js';

export const templatesRouter = Router();

// Sanitize string helper
function sanitizeString(str?: string): string {
  if (!str) return '';
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

// GET /api/templates
templatesRouter.get('/', (req: Request, res: Response) => {
  try {
    const templates = storageService.getTemplates();
    return res.json({ success: true, templates });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve templates', message: err.message });
  }
});

// GET /api/templates/:id
templatesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const template = storageService.getTemplateById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    return res.json({ success: true, template });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve template', message: err.message });
  }
});

// POST /api/templates
templatesRouter.post('/', (req: Request, res: Response) => {
  try {
    const customTemplates = storageService.getTemplates().filter(t => !isBuiltInTemplateId(t.id));
    if (customTemplates.length >= 20) {
      return res.status(400).json({ error: 'Maximum 20 custom templates allowed' });
    }

    const { name, category, description, sections, tableColumns, promptInstructions, accentColor, icon, isDefault } = req.body;
    const cleanName = sanitizeString(name);

    if (!cleanName || cleanName.length === 0 || cleanName.length > 80) {
      return res.status(400).json({ error: 'Template name must be between 1 and 80 characters' });
    }

    if (!sections || !Array.isArray(sections) || sections.length < 1 || sections.length > 10) {
      return res.status(400).json({ error: 'Template must contain between 1 and 10 sections' });
    }

    for (const sec of sections) {
      const title = typeof sec === 'string' ? sanitizeString(sec) : sanitizeString(sec?.title);
      if (!title || title.length === 0 || title.length > 80) {
        return res.status(400).json({ error: 'Section titles must be between 1 and 80 characters' });
      }
    }

    const cleanCategory = sanitizeString(category) || 'Custom';
    const cleanDesc = sanitizeString(description) || 'Custom Minutes of Meeting report template.';
    const cleanPrompt = sanitizeString(promptInstructions) || 'Synthesize structured Minutes of Meeting according to this template.';

    const newTemplate: MOMTemplate = {
      id: 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      category: cleanCategory,
      description: cleanDesc,
      icon: sanitizeString(icon) || 'file-text',
      accentColor: sanitizeString(accentColor) || '#2563eb',
      sections: normalizeSections(sections),
      tableColumns: Array.isArray(tableColumns) ? tableColumns.map(sanitizeString).filter(Boolean) : ['Owner', 'Task', 'Due Date', 'Status'],
      promptInstructions: cleanPrompt,
      isDefault: Boolean(isDefault),
      isBuiltIn: false,
      isSystem: false
    };

    const created = storageService.createTemplate(newTemplate);
    return res.status(201).json({ success: true, template: created });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create template', message: err.message });
  }
});

// PUT /api/templates/:id
templatesRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (isBuiltInTemplateId(id)) {
      return res.status(403).json({ error: 'Built-in templates cannot be modified' });
    }

    const existing = storageService.getTemplateById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { name, category, description, sections, tableColumns, promptInstructions, accentColor, icon, isDefault } = req.body;
    const updates: Partial<MOMTemplate> = {};

    if (name !== undefined) {
      const cleanName = sanitizeString(name);
      if (!cleanName || cleanName.length === 0 || cleanName.length > 80) {
        return res.status(400).json({ error: 'Template name must be between 1 and 80 characters' });
      }
      updates.name = cleanName;
    }

    if (category !== undefined) {
      updates.category = sanitizeString(category) || 'Custom';
    }

    if (description !== undefined) {
      updates.description = sanitizeString(description);
    }

    if (sections !== undefined) {
      if (!Array.isArray(sections) || sections.length < 1 || sections.length > 10) {
        return res.status(400).json({ error: 'Template must contain between 1 and 10 sections' });
      }
      for (const sec of sections) {
        const title = typeof sec === 'string' ? sanitizeString(sec) : sanitizeString(sec?.title);
        if (!title || title.length === 0 || title.length > 80) {
          return res.status(400).json({ error: 'Section titles must be between 1 and 80 characters' });
        }
      }
      updates.sections = normalizeSections(sections);
    }

    if (tableColumns !== undefined && Array.isArray(tableColumns)) {
      updates.tableColumns = tableColumns.map(sanitizeString).filter(Boolean);
    }

    if (promptInstructions !== undefined) {
      updates.promptInstructions = sanitizeString(promptInstructions);
    }

    if (accentColor !== undefined) {
      updates.accentColor = sanitizeString(accentColor);
    }

    if (icon !== undefined) {
      updates.icon = sanitizeString(icon);
    }

    if (isDefault !== undefined) {
      updates.isDefault = Boolean(isDefault);
    }

    const updated = storageService.updateTemplate(id, updates);
    return res.json({ success: true, template: updated });
  } catch (err: any) {
    if (err.message && err.message.includes('Built-in')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to update template', message: err.message });
  }
});

// DELETE /api/templates/:id
templatesRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (isBuiltInTemplateId(id)) {
      return res.status(403).json({ error: 'Built-in templates cannot be deleted' });
    }

    const deleted = storageService.deleteTemplate(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }
    return res.json({ success: true, message: 'Template deleted successfully', id });
  } catch (err: any) {
    if (err.message && err.message.includes('Built-in')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to delete template', message: err.message });
  }
});

// POST /api/templates/:id/default
templatesRouter.post('/:id/default', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const defaultTemplate = storageService.setDefaultTemplate(id);
    if (!defaultTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }
    return res.json({ success: true, template: defaultTemplate });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to set default template', message: err.message });
  }
});
