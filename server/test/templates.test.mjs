import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { storageService } from '../dist/services/storageService.js';
import { aiService } from '../dist/services/aiService.js';
import { BUILT_IN_TEMPLATES, BUILT_IN_TEMPLATE_IDS, isBuiltInTemplateId, migrateTemplates, resolveActiveTemplate } from '../dist/utils/momTemplates.js';

describe('Settings > Templates Pipeline - End-to-End Verification Tests', () => {
  let originalTemplates;
  let originalSettings;

  beforeEach(() => {
    originalTemplates = JSON.parse(JSON.stringify(storageService.getTemplates()));
    originalSettings = JSON.parse(JSON.stringify(storageService.getSettings()));
  });

  afterEach(() => {
    storageService.updateSettings(originalSettings);
  });

  describe('Step 1: Exactly 5 Built-in Templates', () => {
    test('Storage service loads exactly 5 built-in canonical templates', () => {
      const templates = storageService.getTemplates();
      const builtIns = templates.filter(t => isBuiltInTemplateId(t.id));
      assert.strictEqual(builtIns.length, 5, 'Must have exactly 5 built-in templates');

      const expectedIds = ['std-mom', 'exec-board', 'eng-standup', 'client-sales', 'product-design'];
      const actualIds = builtIns.map(t => t.id);
      assert.deepStrictEqual(actualIds.sort(), expectedIds.sort(), 'Must match canonical template IDs');
    });

    test('Stale or duplicate presets are pruned during migration', () => {
      const dirtyList = [
        ...BUILT_IN_TEMPLATES,
        { id: 'template-standard', name: 'Legacy Standard', sections: ['Summary'] },
        { id: 'template-executive', name: 'Legacy Exec', sections: ['Summary'] },
        { id: 'daily_standup', name: 'Old Daily Standup', sections: ['Summary'] },
        { id: 'std-mom', name: 'Duplicate Std MOM', sections: ['Summary'] },
        { id: 'custom-123', name: 'Genuine User Template', category: 'Custom', sections: ['Custom Section'] }
      ];

      const cleaned = migrateTemplates(dirtyList);
      const builtIns = cleaned.filter(t => isBuiltInTemplateId(t.id));
      assert.strictEqual(builtIns.length, 5, 'Deduplication must result in exactly 5 built-ins');
      
      const userTmpl = cleaned.find(t => t.id === 'custom-123');
      assert.ok(userTmpl, 'Genuine user custom templates must be preserved');
      assert.strictEqual(userTmpl.name, 'Genuine User Template');
    });

    test('Default template falls back to std-mom when invalid or missing', () => {
      const resolved = resolveActiveTemplate(BUILT_IN_TEMPLATES, 'non-existent-id', 'Non Existent');
      assert.strictEqual(resolved.id, 'std-mom');
      assert.strictEqual(resolved.name, 'Standard Meeting Notes & MOM');
    });
  });

  describe('Step 2 & 4: Template Protection and Custom Template CRUD', () => {
    test('Updating a built-in template throws an error', () => {
      assert.throws(() => {
        storageService.updateTemplate('std-mom', { name: 'Hacked Built-in' });
      }, /cannot be modified|read-only/i);
    });

    test('Deleting a built-in template throws an error', () => {
      assert.throws(() => {
        storageService.deleteTemplate('std-mom');
      }, /cannot be deleted|protected/i);
    });

    test('Creating a custom template validates limits and adds to list', () => {
      const created = storageService.createTemplate({
        name: 'Weekly Sprint Retrospective',
        category: 'Engineering',
        description: 'Sprint retro with start/stop/continue',
        accentColor: '#059669',
        sections: [
          { name: 'What Went Well', type: 'bullets' },
          { name: 'What Needs Work', type: 'bullets' },
          { name: 'Action Matrix', type: 'table', columns: ['Item', 'Owner', 'Due'] }
        ]
      });

      assert.ok(created.id);
      assert.strictEqual(created.name, 'Weekly Sprint Retrospective');
      assert.strictEqual(created.sections.length, 3);
      assert.strictEqual(created.isBuiltIn, false);

      // Verify it appears in templates list
      const all = storageService.getTemplates();
      const found = all.find(t => t.id === created.id);
      assert.ok(found);

      // Clean up
      storageService.deleteTemplate(created.id);
    });

    test('Creating duplicate template name is rejected', () => {
      assert.throws(() => {
        storageService.createTemplate({
          name: 'Standard Meeting Notes & MOM', // Same as built-in
          sections: [{ name: 'Test' }]
        });
      }, /already exists/i);
    });
  });

  describe('Step 5: End-to-End Default Template Selection and Summary Integration', () => {
    test('Setting default template updates settings.defaultTemplateId and settings.defaultTemplate', () => {
      const target = storageService.setDefaultTemplate('eng-standup');
      assert.strictEqual(target.id, 'eng-standup');
      assert.strictEqual(target.isDefault, true);

      const settings = storageService.getSettings();
      assert.strictEqual(settings.defaultTemplateId, 'eng-standup');
      assert.strictEqual(settings.defaultTemplate, target.name);
    });

    test('generateMOM respects selected template and produces sectionsData', async () => {
      // Ensure AI provider is usable (builtin-ai requires no cloud API key)
      storageService.updateSettings({
        ...storageService.getSettings(),
        activeAIProvider: 'builtin-ai',
        aiModel: 'qwen3.5:4b'
      });

      const mockTranscript = [
        { id: '1', time: '00:01', speaker: 'Sarah', text: 'We decided on Redis for the caching layer.' },
        { id: '2', time: '00:05', speaker: 'Alex', text: 'I will implement the Redis client by Friday.' }
      ];

      // Mock callLLM to return a valid JSON payload matching template schema
      const originalCallLLM = aiService.callLLM;
      aiService.callLLM = async () => {
        return JSON.stringify({
          title: 'Engineering Architecture Review',
          attendees: ['Sarah', 'Alex'],
          summary: 'Discussed Redis caching architecture and assigned sprint tasks.',
          keyDecisions: ['[D-01] Selected Redis 7.2 for caching layer.'],
          actionItems: [
            { owner: 'Alex', task: 'Implement Redis client integration', due: 'By Friday', completed: false }
          ],
          discussionHighlights: ['Redis vs Memcached benchmarks evaluated.'],
          nextSteps: ['Run load testing on Redis cache cluster.']
        });
      };

      try {
        const mom = await aiService.generateMOM(mockTranscript, 'eng-standup', 'English');
        assert.ok(mom);
        assert.strictEqual(mom.templateId, 'eng-standup');
        assert.ok(mom.sectionsData, 'sectionsData must be populated');
        assert.ok(mom.actionItems.length > 0);
      } finally {
        aiService.callLLM = originalCallLLM;
      }
    });
  });
});
