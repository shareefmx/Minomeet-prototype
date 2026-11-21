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
}

export interface SummarizeRequest {
  transcript: TranscriptLine[];
  title?: string;
  template?: string;
  language?: string;
  model?: string;
  customPrompt?: string;
  agentId?: string;
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
  meetingId?: string; // If omitted, queries across all meetings
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

export interface FollowUpEmailRequest {
  meetingId: string;
  tone?: 'professional' | 'concise' | 'action-oriented';
  recipientGroup?: string;
}

export interface FollowUpEmailResponse {
  subject: string;
  body: string;
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

