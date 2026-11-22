export interface TranscriptLine {
  id: string;
  time: string;
  speaker?: string;
  text: string;
}

export interface ActionItem {
  id: string;
  owner: string;
  task: string;
  due: string;
  notes: string;
  completed?: boolean;
}

export interface MOMSummary {
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
  discussionHighlights: string[];
  nextSteps?: string[];
  template: string;
  templateId?: string;
  templateName?: string;
  sectionsData?: Record<string, any>;
  language: string;
  modelUsed: string;
  generatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  duration: string;
  transcript: TranscriptLine[];
  summary?: MOMSummary;
  summaryStatus?: 'not_generated' | 'generating' | 'completed' | 'error';
  templateId?: string;
  templateName?: string;
  sectionsData?: Record<string, any>;
  audioPath?: string;
  tags?: string[];
  isPinned?: boolean;
}

export type AIConnectionStatus = 'not_configured' | 'testing' | 'connected' | 'invalid' | 'error';

export interface ProviderCredential {
  apiKey?: string;
  baseUrl?: string;
  selectedModel?: string;
  customModelName?: string;
  fetchedModels?: string[];
  status: AIConnectionStatus;
  statusMessage?: string;
  lastTested?: string;
}

export interface AIAgentOverride {
  agentId?: string;
  useGlobal?: boolean;
  providerId?: string;
  modelId?: string;
}

export const AUDIO_CAPTURE_MODES = {
  MIXED: 'mixed',
  MICROPHONE_ONLY: 'mic',
  SYSTEM_ONLY: 'system',
} as const;

export type AudioCaptureMode = typeof AUDIO_CAPTURE_MODES[keyof typeof AUDIO_CAPTURE_MODES];
export type AudioSourceType = AudioCaptureMode;

export interface AppSettings {
  theme?: 'system' | 'light' | 'dark';
  notifications: boolean;
  storagePath: string;
  autoDeleteRecordingsDays: number;
  saveAudio: boolean;
  audioFormat: string;
  audioBitrate?: '128k' | '256k' | '320k';
  defaultAudioSource?: AudioCaptureMode;
  selectedMicDeviceId?: string;
  selectedSystemDeviceId?: string;
  systemAudioBackend?: 'screencapturekit' | 'coreaudio';
  recordingStartNotification?: boolean;
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
  transcriptionEngine: string;
  liveCaptions: boolean;
  speakerLabels: boolean;
  autoSummary: boolean;
  autoSummaryOnConclude?: boolean;
  summaryComponents?: {
    executiveSummary: boolean;
    actionItems: boolean;
    keyDecisions: boolean;
  };
  transcriptionLanguage?: string;
  summaryLanguage?: string;
  defaultLanguage: string;
  defaultTemplate: string;
  defaultTemplateId?: string;
  selectedModel: string;
  activeAIProvider?: string;
  aiProviders?: Record<string, ProviderCredential>;
  agentOverrides?: Record<string, AIAgentOverride>;
  betaDiarization: boolean;
  betaAskMeetings: boolean;
  betaAutoFollowUp: boolean;
  calendarPreferences?: CalendarPreferences;
}

export type ScreenType = 'home' | 'meetings' | 'recording' | 'notes' | 'settings';

export interface CalendarAccount {
  id: string;
  provider: 'google' | 'microsoft';
  email: string;
  displayName: string;
  color: string;
  connectedAt: string;
  lastSyncAt?: string;
  status: 'active' | 'reconnect_needed';
}

export interface CalendarProvidersConfig {
  googleConfigured: boolean;
  microsoftConfigured: boolean;
}

export interface CalendarSignInResult {
  provider: 'google' | 'microsoft';
  ok: boolean;
  account?: CalendarAccount;
  error?: string;
}

export interface CalendarEvent {
  id: string;
  accountId: string;
  provider: 'google' | 'microsoft';
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string;
  organizer?: string;
  attendeesCount: number;
  joinUrl?: string;
  joinProvider?: 'meet' | 'teams' | 'zoom' | 'webex' | 'other';
  status: 'confirmed' | 'tentative' | 'cancelled';
  webLink?: string;
}

export interface CalendarPreferences {
  meetingsEnabled: boolean;
  defaultView: 'today' | 'tomorrow' | 'last_viewed';
  timeFormat: '12h' | '24h' | 'system';
  weekStartsOn: 'monday' | 'sunday';
  showCancelled: boolean;
  showAllDay: boolean;
  autoRefreshInterval: 'off' | '5m' | '15m';
  remindersEnabled: boolean;
  reminderLeadTimeMinutes: number;
  askBeforeJoin: boolean;
  showRecordAndJoin: boolean;
}

export type SettingsTab = 'recording' | 'transcription' | 'model' | 'summary' | 'templates' | 'meetings' | 'general' | 'beta';

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export type ModelFamily = 'whisper' | 'parakeet';

export interface TranscriptionModel {
  id: string;
  name: string;
  family: ModelFamily;
  description: string;
  sizeBytes: number;
  sizeFormatted: string;
  ramRequired: string;
  speedRating: string;
  accuracyScore: number;
  rating?: number;
  tag?: string;
  fileName?: string;
  recommended?: boolean;
  status: 'not_downloaded' | 'downloading' | 'paused' | 'downloaded' | 'error';
  downloadProgress?: number;
  downloadSpeed?: string;
  downloadedMB?: number;
  totalMB?: number;
  downloadedAt?: string;
  localPath?: string;
  errorMessage?: string;
}

export interface TranscriptionEngineStatus {
  pythonInstalled: boolean;
  pythonVersion?: string;
  whisperInstalled: boolean;
  torchInstalled: boolean;
  ffmpegInstalled: boolean;
  activeModelId: string;
  modelsDir: string;
  totalModelsDownloaded: number;
}

export interface StorageStats {
  audioFilesCount: number;
  audioStorageBytes: number;
  audioStorageFormatted: string;
  modelsCount: number;
  modelsStorageBytes: number;
  modelsStorageFormatted: string;
  dbSizeBytes: number;
  dbSizeFormatted: string;
  realUploadsPath: string;
  realModelsPath: string;
  realDataPath: string;
}

export type MOMSectionType = 'text' | 'bullets' | 'table' | 'numbered';

export interface MOMTemplateSection {
  id?: string;
  title?: string;
  name?: string;
  type: MOMSectionType;
  columns?: string[];
}

export interface MOMSampleAttendee {
  name: string;
  role: string;
  attendance: 'Present' | 'Absent' | 'Remote' | string;
}

export interface MOMSampleDocument {
  meetingTitle?: string;
  title?: string;
  subtitle?: string;
  date?: string;
  duration?: string;
  location?: string;
  chair?: string;
  preparedBy?: string;
  aiModel?: string;
  attendees?: Array<MOMSampleAttendee | { name: string; role: string; attendance: string }>;
  agenda?: string[];
  sectionsData?: Record<string, any>;
  sections?: Record<string, any>;
  metadata?: Record<string, string>;
  docId?: string;
  status?: string;
  nextMeeting?: string;
  distribution?: string;
  approvedBy?: string;
  signoff?: string;
}

export interface MOMTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  accentColor?: string;
  sections: (MOMTemplateSection | string)[];
  tableColumns?: string[];
  promptInstructions: string;
  sampleDocument?: MOMSampleDocument | string;
  isBuiltIn?: boolean;
  isDefault?: boolean;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  modelUsed?: string;
  sources?: {
    meetingId: string;
    meetingTitle: string;
    snippet: string;
    timestamp?: string;
    type?: 'summary' | 'decision' | 'action_item' | 'transcript' | 'highlight';
  }[];
  suggestedFollowUps?: string[];
}

export interface AskQuestionRequest {
  query: string;
  meetingId?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  mode?: 'all' | 'action_items' | 'decisions' | 'attendees' | 'summary';
  agentId?: string;
}

export interface AskQuestionResponse {
  answer: string;
  sources: {
    meetingId: string;
    meetingTitle: string;
    snippet: string;
    timestamp?: string;
    type?: 'summary' | 'decision' | 'action_item' | 'transcript' | 'highlight';
  }[];
  suggestedFollowUps?: string[];
  modelUsed?: string;
}

export interface LanguageOption {
  code: string;
  label: string;
}

export const TRANSCRIPTION_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'auto', label: 'Auto-detect' }
];

export const ALLOWED_TRANSCRIPTION_LANGUAGES: string[] = [
  'en', 'auto', 'es', 'fr', 'de', 'pt', 'it', 'hi', 'ta', 'te', 'ml', 'kn', 'ja', 'ko', 'zh', 'ar'
];

export const SUMMARY_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'auto', label: 'Auto-detect' }
];

export const ALLOWED_SUMMARY_LANGUAGES: string[] = [
  'en', 'auto', 'same', 'es', 'fr', 'de', 'pt', 'it', 'hi', 'ta', 'te', 'ml', 'kn', 'ja', 'ko', 'zh', 'ar'
];



