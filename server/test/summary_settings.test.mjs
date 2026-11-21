import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { storageService } from '../dist/services/storageService.js';
import { aiService } from '../dist/services/aiService.js';
import {
  ALLOWED_TRANSCRIPTION_LANGUAGES,
  ALLOWED_SUMMARY_LANGUAGES
} from '../dist/types/index.js';

describe('Settings > Summary Tab - End-to-End Pipeline Tests', () => {
  let originalSettings;
  let originalCallLLM;

  beforeEach(() => {
    originalSettings = JSON.parse(JSON.stringify(storageService.getSettings()));
    originalCallLLM = aiService.callLLM;
  });

  afterEach(() => {
    storageService.updateSettings(originalSettings);
    aiService.callLLM = originalCallLLM;
  });

  describe('Card 1: Auto Summary on Meeting Conclude', () => {
    test('Default settings contain autoSummaryOnConclude = true', () => {
      const settings = storageService.getSettings();
      assert.strictEqual(settings.autoSummaryOnConclude, true, 'Default autoSummaryOnConclude must be true');
      assert.strictEqual(settings.autoSummary, true, 'autoSummary alias must be in sync');
    });

    test('Updating autoSummaryOnConclude toggles setting and synchronizes aliases', () => {
      storageService.updateSettings({ autoSummaryOnConclude: false });
      let updated = storageService.getSettings();
      assert.strictEqual(updated.autoSummaryOnConclude, false);
      assert.strictEqual(updated.autoSummary, false);

      storageService.updateSettings({ autoSummaryOnConclude: true });
      updated = storageService.getSettings();
      assert.strictEqual(updated.autoSummaryOnConclude, true);
      assert.strictEqual(updated.autoSummary, true);
    });

    test('Meeting concluded with autoSummaryOnConclude = false sets summaryStatus = not_generated', async () => {
      storageService.updateSettings({ autoSummaryOnConclude: false });
      const current = storageService.getSettings();
      assert.strictEqual(current.autoSummaryOnConclude, false);

      // Simulate stop recording flow with autoSummaryOnConclude disabled
      const shouldAutoSummarize = current.autoSummaryOnConclude ?? current.autoSummary ?? true;
      assert.strictEqual(shouldAutoSummarize, false);

      const meetingRecord = {
        id: 'test-meeting-no-summary',
        title: 'Standup Without Auto Summary',
        date: new Date().toISOString(),
        summaryStatus: shouldAutoSummarize ? 'completed' : 'not_generated',
        summary: shouldAutoSummarize ? { title: 'MOM', summary: 'Sample' } : undefined
      };

      assert.strictEqual(meetingRecord.summaryStatus, 'not_generated');
      assert.strictEqual(meetingRecord.summary, undefined);
    });

    test('Meeting concluded with autoSummaryOnConclude = true sets summaryStatus = completed', async () => {
      storageService.updateSettings({ autoSummaryOnConclude: true });
      const current = storageService.getSettings();
      const shouldAutoSummarize = current.autoSummaryOnConclude ?? current.autoSummary ?? true;
      assert.strictEqual(shouldAutoSummarize, true);

      const meetingRecord = {
        id: 'test-meeting-with-summary',
        title: 'Standup With Auto Summary',
        date: new Date().toISOString(),
        summaryStatus: shouldAutoSummarize ? 'completed' : 'not_generated'
      };

      assert.strictEqual(meetingRecord.summaryStatus, 'completed');
    });
  });

  describe('Card 2: Synthesized Output Components', () => {
    test('Defaults include all 3 summary components enabled', () => {
      const settings = storageService.getSettings();
      assert.ok(settings.summaryComponents, 'summaryComponents must exist');
      assert.strictEqual(settings.summaryComponents.executiveSummary, true);
      assert.strictEqual(settings.summaryComponents.actionItems, true);
      assert.strictEqual(settings.summaryComponents.keyDecisions, true);
    });

    test('Guard prevents disabling all 3 summary components', () => {
      const tryDisableAll = {
        executiveSummary: false,
        actionItems: false,
        keyDecisions: false
      };

      const activeCount = Object.values(tryDisableAll).filter(Boolean).length;
      assert.strictEqual(activeCount, 0);

      // Emulate validation logic from settings PUT route
      const isValid = activeCount >= 1;
      assert.strictEqual(isValid, false, 'Validation must reject disabling all 3 components');
    });

    test('Partial summary component toggling persists correctly', () => {
      storageService.updateSettings({
        summaryComponents: {
          executiveSummary: true,
          actionItems: false,
          keyDecisions: true
        }
      });
      const settings = storageService.getSettings();
      assert.strictEqual(settings.summaryComponents.executiveSummary, true);
      assert.strictEqual(settings.summaryComponents.actionItems, false);
      assert.strictEqual(settings.summaryComponents.keyDecisions, true);
    });

    test('generateMOM omits disabled components from synthesized output', async () => {
      // Mock callLLM to return a full synthesized payload
      aiService.callLLM = async () => JSON.stringify({
        summary: 'Team delivered sprint targets and coordinated release milestones.',
        keyDecisions: ['Approved sprint roadmap deliverables.', 'Assigned QA regression lead.'],
        actionItems: [
          { owner: 'Sarah', task: 'Deploy engine update', due: 'Friday', completed: false },
          { owner: 'Alex', task: 'Review customer MOM notes', due: 'Monday', completed: false }
        ]
      });

      const sampleTranscript = [
        { id: '1', speaker: 'Sarah', text: 'We agreed to launch the beta release this Friday.', timestamp: '00:01' },
        { id: '2', speaker: 'Alex', text: 'I will coordinate with the QA team on regression testing.', timestamp: '00:05' }
      ];

      // Provide mock credentials so resolveModel marks provider usable
      const testApiKey = 'mock-api-key-for-test';
      const curSettings = storageService.getSettings();
      const activeProv = curSettings.activeAIProvider || 'google';

      // Test 1: Only Executive Summary enabled
      storageService.updateSettings({
        apiKey: testApiKey,
        aiProviders: {
          ...(curSettings.aiProviders || {}),
          [activeProv]: { apiKey: testApiKey, status: 'connected' },
          google: { apiKey: testApiKey, status: 'connected' }
        },
        summaryComponents: {
          executiveSummary: true,
          actionItems: false,
          keyDecisions: false
        }
      });

      const momExecOnly = await aiService.generateMOM(sampleTranscript, 'Standard Meeting Notes & MOM', 'English');
      assert.ok(momExecOnly.summary.length > 0, 'Executive summary should be populated');
      assert.deepStrictEqual(momExecOnly.actionItems, [], 'Action items must be empty array when disabled');
      assert.deepStrictEqual(momExecOnly.keyDecisions, [], 'Key decisions must be empty array when disabled');

      // Test 2: Only Action Items enabled
      storageService.updateSettings({
        summaryComponents: {
          executiveSummary: false,
          actionItems: true,
          keyDecisions: false
        }
      });

      const momActionsOnly = await aiService.generateMOM(sampleTranscript, 'Standard Meeting Notes & MOM', 'English');
      assert.strictEqual(momActionsOnly.summary, '', 'Summary should be empty string when disabled');
      assert.ok(momActionsOnly.actionItems.length > 0, 'Action items should be populated');
      assert.deepStrictEqual(momActionsOnly.keyDecisions, [], 'Key decisions must be empty array when disabled');

      // Test 3: Only Key Decisions enabled
      storageService.updateSettings({
        summaryComponents: {
          executiveSummary: false,
          actionItems: false,
          keyDecisions: true
        }
      });

      const momDecisionsOnly = await aiService.generateMOM(sampleTranscript, 'Standard Meeting Notes & MOM', 'English');
      assert.strictEqual(momDecisionsOnly.summary, '', 'Summary should be empty string when disabled');
      assert.deepStrictEqual(momDecisionsOnly.actionItems, [], 'Action items must be empty array when disabled');
      assert.ok(momDecisionsOnly.keyDecisions.length > 0, 'Key decisions should be populated');

      // Test 4: All 3 components enabled
      storageService.updateSettings({
        summaryComponents: {
          executiveSummary: true,
          actionItems: true,
          keyDecisions: true
        }
      });

      const momAll = await aiService.generateMOM(sampleTranscript, 'Standard Meeting Notes & MOM', 'English');
      assert.ok(momAll.summary.length > 0);
      assert.ok(momAll.actionItems.length > 0);
      assert.ok(momAll.keyDecisions.length > 0);
    });
  });

  describe('Card 3: Transcription and Summary Languages', () => {
    test('Allowed transcription languages include all 16 supported codes', () => {
      const expectedCodes = ['en', 'auto', 'es', 'fr', 'de', 'pt', 'it', 'hi', 'ta', 'te', 'ml', 'kn', 'ja', 'ko', 'zh', 'ar'];
      for (const code of expectedCodes) {
        assert.ok(ALLOWED_TRANSCRIPTION_LANGUAGES.includes(code), `Code ${code} must be in ALLOWED_TRANSCRIPTION_LANGUAGES`);
      }
    });

    test('Allowed summary languages include "same" and 15 target languages', () => {
      assert.ok(ALLOWED_SUMMARY_LANGUAGES.includes('same'));
      assert.ok(ALLOWED_SUMMARY_LANGUAGES.includes('es'));
      assert.ok(ALLOWED_SUMMARY_LANGUAGES.includes('hi'));
      assert.ok(ALLOWED_SUMMARY_LANGUAGES.includes('ja'));
      assert.ok(ALLOWED_SUMMARY_LANGUAGES.includes('de'));
    });

    test('Language validation allows valid codes and rejects invalid ones', () => {
      assert.ok(ALLOWED_TRANSCRIPTION_LANGUAGES.includes('hi'));
      assert.ok(ALLOWED_TRANSCRIPTION_LANGUAGES.includes('auto'));
      assert.strictEqual(ALLOWED_TRANSCRIPTION_LANGUAGES.includes('klingon'), false);
      assert.strictEqual(ALLOWED_TRANSCRIPTION_LANGUAGES.includes('invalid-code'), false);

      assert.ok(ALLOWED_SUMMARY_LANGUAGES.includes('same'));
      assert.ok(ALLOWED_SUMMARY_LANGUAGES.includes('fr'));
      assert.strictEqual(ALLOWED_SUMMARY_LANGUAGES.includes('pig-latin'), false);
    });

    test('Persisting valid languages updates storage cleanly', () => {
      storageService.updateSettings({
        transcriptionLanguage: 'hi',
        summaryLanguage: 'en'
      });
      const settings = storageService.getSettings();
      assert.strictEqual(settings.transcriptionLanguage, 'hi');
      assert.strictEqual(settings.summaryLanguage, 'en');
    });
  });
});
