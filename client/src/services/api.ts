export interface EngineDiagnosticResult {
  healthy: boolean;
  modelName: string;
  isLoaded: boolean;
  modelsDir: string;
  hardwareAcceleration: string;
  latencyMs: number;
  message: string;
}
import { Meeting, AppSettings, MOMSummary, TranscriptLine, TranscriptionModel, TranscriptionEngineStatus, StorageStats, MOMTemplate, AskQuestionResponse, CalendarAccount, CalendarEvent, CalendarProvidersConfig } from '../types/meeting.js';
import packageJson from '../../package.json';
import { REPO_URL, RELEASES_URL, LATEST_RELEASE_API } from '../config/app.js';
import { isNewerVersion } from '../utils/semver.js';

export type UpdateState =
  | 'up_to_date'
  | 'update_available'
  | 'offline'
  | 'rate_limited'
  | 'no_releases'
  | 'error';

export interface UpdateCheckResult {
  state: UpdateState;
  currentVersion: string;
  latestVersion?: string;
  publishedAt?: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseUrl: string;
  repoUrl: string;
  downloadUrl?: string;
  checkedAt: number;
  message?: string;
}

const API_BASE = '/api';

export function toCanonicalModelId(id: string): string {
  const norm = (id || '').trim().toLowerCase();
  if (norm.includes('parakeet')) return 'parakeet-tdt-0.6b-v3-int8';
  if (norm === 'tiny' || norm === 'ggml-tiny.bin' || norm === 'whisper-tiny') return 'whisper-tiny';
  if (norm === 'tiny-q5_1' || norm === 'ggml-tiny-q5_1.bin' || norm === 'whisper-tiny-q5_1') return 'whisper-tiny-q5_1';
  if (norm === 'base' || norm === 'ggml-base.bin' || norm === 'whisper-base') return 'whisper-base';
  if (norm === 'base-q5_1' || norm === 'ggml-base-q5_1.bin' || norm === 'whisper-base-q5_1') return 'whisper-base-q5_1';
  if (norm === 'small-q5_1' || norm === 'ggml-small-q5_1.bin' || norm === 'whisper-small-q5_1') return 'whisper-small-q5_1';
  if (norm === 'medium' || norm === 'ggml-medium.bin' || norm === 'whisper-medium') return 'whisper-medium';
  if (norm === 'large-v3-turbo-q5_0' || norm === 'ggml-large-v3-turbo-q5_0.bin' || norm === 'whisper-large-v3-turbo-q5_0') return 'whisper-large-v3-turbo-q5_0';
  if (norm === 'large-v3-turbo' || norm === 'ggml-large-v3-turbo.bin' || norm === 'whisper-large-v3-turbo') return 'whisper-large-v3-turbo';
  return id;
}

export const api = {
  // Templates
  async getTemplates(): Promise<MOMTemplate[]> {
    const res = await fetch(`${API_BASE}/templates`);
    const data = await res.json();
    return data.templates || [];
  },

  async createTemplate(payload: Partial<MOMTemplate>): Promise<MOMTemplate> {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create template');
    return data.template;
  },

  async updateTemplate(id: string, updates: Partial<MOMTemplate>): Promise<MOMTemplate> {
    const res = await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update template');
    return data.template;
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete template');
    return data.success;
  },

  async setDefaultTemplate(id: string): Promise<MOMTemplate> {
    const res = await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}/default`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to set default template');
    return data.template;
  },

  // Meetings
  async getMeetings(search?: string): Promise<Meeting[]> {
    const url = search ? `${API_BASE}/meetings?search=${encodeURIComponent(search)}` : `${API_BASE}/meetings`;
    const res = await fetch(url);
    const data = await res.json();
    return data.meetings || [];
  },

  async getMeeting(id: string): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load meeting');
    return data.meeting;
  },

  async createMeeting(payload: {
    title?: string;
    transcript: TranscriptLine[];
    duration?: string;
    audioPath?: string;
    tags?: string[];
    autoSummarize?: boolean;
    template?: string;
    language?: string;
    model?: string;
  }): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create meeting');
    return data.meeting;
  },

  async uploadAudio(file: File): Promise<{ success: boolean; filePath: string }> {
    const formData = new FormData();
    formData.append('audio', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to upload audio');
    return data;
  },

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update meeting');
    return data.meeting;
  },

  async deleteMeeting(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  async importAudio(payload: {
    file: File;
    autoSummarize?: boolean;
    model?: string;
    language?: string;
    template?: string;
    duration?: string;
  }): Promise<Meeting> {
    const formData = new FormData();
    formData.append('audio', payload.file);
    formData.append('autoSummarize', String(payload.autoSummarize ?? true));
    if (payload.model) formData.append('model', payload.model);
    if (payload.language) formData.append('language', payload.language);
    if (payload.template) formData.append('template', payload.template);
    if (payload.duration) formData.append('duration', payload.duration);

    const res = await fetch(`${API_BASE}/meetings/import`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to import audio');
    return data.meeting;
  },

  // AI
  async summarize(payload: {
    transcript: TranscriptLine[];
    title?: string;
    template?: string;
    language?: string;
    model?: string;
    customPrompt?: string;
    agentId?: string;
  }): Promise<MOMSummary> {
    const res = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to generate summary');
    return data.summary;
  },

  async askMeetings(
    query: string,
    meetingId?: string,
    history?: { role: 'user' | 'assistant'; content: string }[],
    mode?: 'all' | 'action_items' | 'decisions' | 'attendees' | 'summary',
    agentId?: string
  ): Promise<AskQuestionResponse> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, meetingId, history, mode, agentId: agentId || 'ask_meetings' })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to query meeting assistant');
    return {
      answer: data.answer,
      sources: data.sources || [],
      suggestedFollowUps: data.suggestedFollowUps || [],
      modelUsed: data.modelUsed
    };
  },

  async generateFollowUpEmail(
    meetingId: string,
    tone?: string,
    agentId?: string,
    variantSeed: number = 0
  ): Promise<{ subject: string; body: string }> {
    const res = await fetch(`${API_BASE}/ai/follow-up-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, tone, agentId: agentId || 'follow_up_email', variantSeed })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to generate follow-up email');
    return { subject: data.subject, body: data.body };
  },

  async testAIConnection(payload: {
    provider: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }): Promise<{
    success: boolean;
    status: 'not_configured' | 'testing' | 'connected' | 'invalid' | 'error';
    message: string;
    latencyMs?: number;
    fetchedModels?: string[];
  }> {
    const res = await fetch(`${API_BASE}/ai/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async fetchAIProviderModels(payload: {
    provider: string;
    apiKey?: string;
    baseUrl?: string;
  }): Promise<{ success: boolean; models?: string[]; error?: string }> {
    const res = await fetch(`${API_BASE}/ai/fetch-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async saveAIModelSettings(payload: {
    provider: string;
    model: string;
    whisperModel?: string;
    apiKey?: string;
    baseUrl?: string;
  }): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeAIProvider: payload.provider,
          selectedModel: payload.model
        })
      });
      return true;
    } catch {
      return false;
    }
  },

  // Settings
  async getSettings(): Promise<{ settings: AppSettings; storageStats?: StorageStats }> {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return { settings: data.settings, storageStats: data.storageStats };
  },

  async getStorageStats(): Promise<StorageStats> {
    const res = await fetch(`${API_BASE}/settings/stats`);
    const data = await res.json();
    return data.storageStats;
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return data.settings;
  },

  async openFolder(targetFolder?: string): Promise<{ success: boolean; path: string }> {
    const res = await fetch(`${API_BASE}/settings/open-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: targetFolder, path: targetFolder })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to open directory');
    return data;
  },

  async purgeRecordings(days: number): Promise<{ success: boolean; deletedCount: number; freedFormatted: string; message: string }> {
    const res = await fetch(`${API_BASE}/settings/purge-recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to purge recordings');
    return data;
  },

  async exportBackup(): Promise<string> {
    const res = await fetch(`${API_BASE}/settings/export-data`);
    const data = await res.json();
    return JSON.stringify(data, null, 2);
  },

  async restoreBackup(backupJson: string): Promise<{ success: boolean; restoredMeetings: number; restoredTemplates: number; message: string }> {
    try {
      const parsed = JSON.parse(backupJson);
      const res = await fetch(`${API_BASE}/settings/restore-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        restoredMeetings: 0,
        restoredTemplates: 0,
        message: err.message || 'Failed to parse or restore backup'
      };
    }
  },

  // Transcription Models & Engine
  async getTranscriptionModels(): Promise<{ models: TranscriptionModel[]; activeModel: TranscriptionModel | null }> {
    const res = await fetch(`${API_BASE}/transcription/models`);
    const data = await res.json();
    return { models: data.models || [], activeModel: data.activeModel || null };
  },

  async downloadTranscriptionModel(id: string): Promise<TranscriptionModel> {
    const res = await fetch(`${API_BASE}/transcription/models/${encodeURIComponent(id)}/download`, {
      method: "POST"
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to download model");
    return data.model;
  },

  async pauseTranscriptionModel(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/transcription/models/${encodeURIComponent(id)}/pause`, {
      method: "POST"
    });
    const data = await res.json();
    return data.success;
  },

  async resumeTranscriptionModel(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/transcription/models/${encodeURIComponent(id)}/resume`, {
      method: "POST"
    });
    const data = await res.json();
    return data.success;
  },

  async stopTranscriptionModel(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/transcription/models/${encodeURIComponent(id)}/stop`, {
      method: "POST"
    });
    const data = await res.json();
    return data.success;
  },

  async deleteTranscriptionModel(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/transcription/models/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    const data = await res.json();
    return data.success;
  },

  async selectTranscriptionModel(id: string): Promise<TranscriptionModel> {
    const res = await fetch(`${API_BASE}/transcription/models/${encodeURIComponent(id)}/select`, {
      method: "POST"
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to select model");
    return data.activeModel;
  },

  async testTranscriptionEngine(): Promise<EngineDiagnosticResult> {
    const res = await fetch(`${API_BASE}/transcription/test`, {
      method: "POST"
    });
    const data = await res.json();
    return data;
  },

  async openModelsFolder(): Promise<void> {
    await fetch(`${API_BASE}/transcription/open-folder`, {
      method: "POST"
    });
  },

  async getTranscriptionEngineStatus(): Promise<TranscriptionEngineStatus> {
    const res = await fetch(`${API_BASE}/transcription/status`);
    const data = await res.json();
    return data.status;
  },

  async installPythonPackages(): Promise<{ success: boolean; output: string }> {
    const res = await fetch(`${API_BASE}/transcription/install-packages`, {
      method: 'POST'
    });
    const data = await res.json();
    return data;
  },

  async transcribeLiveChunk(payload: {
    blob: Blob;
    offsetSeconds?: number;
    model?: string;
    language?: string;
  }): Promise<TranscriptLine[]> {
    try {
      const formData = new FormData();
      formData.append('audio', payload.blob, 'chunk.webm');
      if (payload.offsetSeconds !== undefined) formData.append('offsetSeconds', String(payload.offsetSeconds));
      if (payload.model) formData.append('model', payload.model);
      if (payload.language) formData.append('language', payload.language);

      const res = await fetch(`${API_BASE}/transcription/live-chunk`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.segments || [];
    } catch {
      return [];
    }
  },

  async getAppVersion(): Promise<string> {
    return packageJson.version || '1.2.2';
  },

  async checkUpdate(force = false): Promise<UpdateCheckResult> {
    const currentVersion = await this.getAppVersion();
    const cacheKey = 'minomeet_client_last_update_check';
    const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

    if (!force && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as UpdateCheckResult;
          if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
            return { ...cached, currentVersion };
          }
        }
      } catch {}
    }

    const repoUrl = REPO_URL;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(LATEST_RELEASE_API, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        const result: UpdateCheckResult = {
          state: 'no_releases',
          currentVersion,
          releaseUrl: RELEASES_URL,
          repoUrl,
          checkedAt: Date.now(),
          message: 'No published releases yet'
        };
        try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
        return result;
      }

      if (res.status === 403 || res.status === 429) {
        return {
          state: 'rate_limited',
          currentVersion,
          releaseUrl: RELEASES_URL,
          repoUrl,
          checkedAt: Date.now(),
          message: 'GitHub limit reached, try again later'
        };
      }

      if (!res.ok) {
        return {
          state: 'error',
          currentVersion,
          releaseUrl: RELEASES_URL,
          repoUrl,
          checkedAt: Date.now(),
          message: `GitHub returned status ${res.status}`
        };
      }

      const data = await res.json();
      const latestTag = (data.tag_name || '').trim();
      const hasUpdate = isNewerVersion(latestTag, currentVersion);

      const result: UpdateCheckResult = {
        state: hasUpdate ? 'update_available' : 'up_to_date',
        currentVersion,
        latestVersion: latestTag || currentVersion,
        publishedAt: data.published_at,
        releaseName: data.name,
        releaseNotes: data.body,
        releaseUrl: data.html_url || RELEASES_URL,
        repoUrl,
        downloadUrl: data.html_url || RELEASES_URL,
        checkedAt: Date.now()
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {}

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      let lastCheckedTime: number | undefined;
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          lastCheckedTime = parsed.checkedAt;
        }
      } catch {}

      return {
        state: 'offline',
        currentVersion,
        releaseUrl: RELEASES_URL,
        repoUrl,
        checkedAt: lastCheckedTime || Date.now(),
        message: err.name === 'AbortError'
          ? 'GitHub request timed out (10s)'
          : 'Cannot reach GitHub.'
      };
    }
  },

  // ==========================================
  // CALENDAR & MEETINGS
  // ==========================================
  async getCalendarProvidersConfig(): Promise<CalendarProvidersConfig> {
    try {
      const res = await fetch(`${API_BASE}/calendar/providers-config`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      googleConfigured: true,
      microsoftConfigured: true
    };
  },

  async getCalendarAccounts(): Promise<CalendarAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/calendar/accounts`);
      if (res.ok) return await res.json();
    } catch {}
    try {
      const stored = localStorage.getItem('minomeet_calendar_accounts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async startCalendarSignIn(provider: 'google' | 'microsoft'): Promise<CalendarAccount> {
    const res = await fetch(`${API_BASE}/calendar/sign-in/${provider}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to sign in with ${provider}`);
    }
    const data = await res.json();
    return data.account || data;
  },

  async cancelCalendarSignIn(): Promise<void> {
    try {
      await fetch(`${API_BASE}/calendar/cancel-sign-in`, { method: 'POST' });
    } catch {}
  },

  async signOutCalendar(accountId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/calendar/accounts/${encodeURIComponent(accountId)}`, { method: 'DELETE' });
    } catch {}
    try {
      const stored = localStorage.getItem('minomeet_calendar_accounts');
      if (stored) {
        const accounts: CalendarAccount[] = JSON.parse(stored);
        localStorage.setItem(
          'minomeet_calendar_accounts',
          JSON.stringify(accounts.filter(a => a.id !== accountId))
        );
      }
    } catch {}
  },

  async reauthenticateCalendar(accountId: string): Promise<CalendarAccount> {
    const res = await fetch(`${API_BASE}/calendar/reauthenticate/${encodeURIComponent(accountId)}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reauthenticate calendar account');
    }
    const data = await res.json();
    return data.account || data;
  },

  async fetchCalendarEvents(dateFrom: string, dateTo: string, accountIds?: string[]): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (accountIds && accountIds.length > 0) {
        params.set('accountIds', accountIds.join(','));
      }
      const res = await fetch(`${API_BASE}/calendar/events?${params.toString()}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async clearCalendarCache(): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/calendar/cache`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.cleared || 0;
      }
    } catch {}
    return 0;
  },

  async signOutAllCalendar(): Promise<boolean> {
    try {
      const accounts = await this.getCalendarAccounts();
      for (const acc of accounts) {
        await this.signOutCalendar(acc.id);
      }
      return true;
    } catch {
      return false;
    }
  },

  async openExternalUrl(url: string): Promise<void> {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};


