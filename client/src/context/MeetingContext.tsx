import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Meeting, AppSettings, ScreenType, SettingsTab, ToastMessage, TranscriptLine, MOMSummary, TranscriptionModel, TranscriptionEngineStatus, StorageStats, MOMTemplate, AudioCaptureMode, AUDIO_CAPTURE_MODES, CalendarAccount, CalendarProvidersConfig } from '../types/meeting.js';
import { api } from '../services/api.js';
import { speechService } from '../services/speech.js';

interface MeetingContextType {
  meetings: Meeting[];
  activeMeeting: Meeting | null;
  currentScreen: ScreenType;
  settingsTab: SettingsTab;
  searchQuery: string;
  isRecording: boolean;
  recordingTimer: number;
  liveTranscript: TranscriptLine[];
  interimTranscript: string;
  audioSource: AudioCaptureMode;
  isGeneratingSummary: boolean;
  settings: AppSettings | null;
  storageStats: StorageStats | null;
  toasts: ToastMessage[];
  meetingToDelete: Meeting | null;
  meetingToRename: Meeting | null;
  transcriptionModels: TranscriptionModel[];
  activeTranscriptionModel: TranscriptionModel | null;
  engineStatus: TranscriptionEngineStatus | null;
  templates: MOMTemplate[];
  hasDraftRecovery: boolean;
  modals: {
    import: boolean;
    model: boolean;
    about: boolean;
    ask: boolean;
    email: boolean;
    delete: boolean;
    rename: boolean;
    connectCalendar: boolean;
    calendarSignOut: boolean;
  };
  calendarAccounts: CalendarAccount[];
  isCalendarConnected: boolean;
  calendarProvidersConfig: CalendarProvidersConfig;
  calendarSignInState: {
    status: 'idle' | 'authorizing' | 'error' | 'success';
    provider?: 'google' | 'microsoft';
    error?: string;
  };
  hasSeenMeetingsNav: boolean;
  markMeetingsNavSeen: () => void;
  refreshCalendarAccounts: () => Promise<void>;
  startCalendarSignIn: (provider: 'google' | 'microsoft') => Promise<void>;
  cancelCalendarSignIn: () => Promise<void>;
  signOutCalendarAccount: (accountId: string) => Promise<void>;
  // Actions
  setCurrentScreen: (screen: ScreenType) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setSearchQuery: (query: string) => void;
  setAudioSource: (src: AudioCaptureMode) => void;
  selectMeeting: (meeting: Meeting) => void;
  startRecording: (sourceType?: AudioCaptureMode) => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  generateSummaryForActive: (template?: string, language?: string, model?: string) => Promise<void>;
  updateActiveMeeting: (updates: Partial<Meeting>) => Promise<void>;
  updateActiveSummary: (updates: Partial<MOMSummary>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  togglePinMeeting: (id: string) => Promise<void>;
  openDeleteModal: (meeting: Meeting) => void;
  closeDeleteModal: () => void;
  openStorageFolder: (target?: string) => Promise<void>;
  purgeOldRecordings: (days: number) => Promise<void>;
  refreshStorageStats: () => Promise<void>;
  confirmDeleteMeeting: () => Promise<void>;
  openRenameModal: (meeting: Meeting) => void;
  closeRenameModal: () => void;
  confirmRenameMeeting: (newTitle: string) => Promise<void>;
  openModal: (modal: keyof MeetingContextType['modals']) => void;
  closeModal: (modal: keyof MeetingContextType['modals']) => void;
  closeAllModals: () => void;
  showToast: (title: string, subtitle?: string, type?: ToastMessage['type']) => void;
  sendDesktopNotification: (title: string, body: string) => void;
  removeToast: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  refreshMeetings: () => Promise<void>;
  refreshTranscriptionModels: () => Promise<void>;
  downloadTranscriptionModel: (id: string) => Promise<void>;
  pauseTranscriptionModel: (id: string) => Promise<void>;
  resumeTranscriptionModel: (id: string) => Promise<void>;
  stopTranscriptionModel: (id: string) => Promise<void>;
  deleteTranscriptionModel: (id: string) => Promise<void>;
  selectTranscriptionModel: (id: string) => Promise<void>;
  installPythonPackages: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  createTemplate: (template: Partial<MOMTemplate>) => Promise<MOMTemplate | null>;
  updateTemplate: (id: string, updates: Partial<MOMTemplate>) => Promise<MOMTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  setDefaultTemplate: (id: string) => Promise<void>;
  recoverDraft: () => void;
  dismissDraft: () => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{
  children: ReactNode;
  initialModals?: Partial<MeetingContextType['modals']>;
  initialAccounts?: CalendarAccount[];
}> = ({ children, initialModals, initialAccounts }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTimer, setRecordingTimer] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptLine[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioSource, setAudioSource] = useState<AudioCaptureMode>(AUDIO_CAPTURE_MODES.MIXED);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [timerInterval, setTimerInterval] = useState<any>(null);

  const [transcriptionModels, setTranscriptionModels] = useState<TranscriptionModel[]>([]);
  const [activeTranscriptionModel, setActiveTranscriptionModel] = useState<TranscriptionModel | null>(null);
  const [engineStatus, setEngineStatus] = useState<TranscriptionEngineStatus | null>(null);
  const [templates, setTemplates] = useState<MOMTemplate[]>([]);
  const lastModelReadyToastRef = useRef<{ [key: string]: number }>({});

  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [meetingToRename, setMeetingToRename] = useState<Meeting | null>(null);
  const [hasDraftRecovery, setHasDraftRecovery] = useState<boolean>(false);

  const [modals, setModals] = useState({
    import: false,
    model: false,
    about: false,
    ask: false,
    email: false,
    delete: false,
    rename: false,
    connectCalendar: false,
    calendarSignOut: false,
    ...(initialModals || {})
  });

  const [calendarAccounts, setCalendarAccounts] = useState<CalendarAccount[]>(initialAccounts || []);
  const [calendarProvidersConfig, setCalendarProvidersConfig] = useState<CalendarProvidersConfig>({
    googleConfigured: true,
    microsoftConfigured: true
  });
  const [calendarSignInState, setCalendarSignInState] = useState<{
    status: 'idle' | 'authorizing' | 'error' | 'success';
    provider?: 'google' | 'microsoft';
    error?: string;
  }>({ status: 'idle' });
  const [hasSeenMeetingsNav, setHasSeenMeetingsNav] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('minomeet_has_seen_meetings') === 'true';
      }
    } catch {}
    return false;
  });

  const markMeetingsNavSeen = () => {
    setHasSeenMeetingsNav(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('minomeet_has_seen_meetings', 'true');
      }
    } catch {}
  };

  const refreshCalendarAccounts = async () => {
    try {
      const [accounts, config] = await Promise.all([
        api.getCalendarAccounts(),
        api.getCalendarProvidersConfig()
      ]);
      if (initialAccounts && initialAccounts.length > 0 && accounts.length === 0) {
        setCalendarAccounts(initialAccounts);
      } else {
        setCalendarAccounts(accounts);
      }
      setCalendarProvidersConfig(config);
    } catch (e) {
      console.warn('Failed to refresh calendar accounts:', e);
    }
  };

  const signInTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancelCalendarSignIn = async () => {
    if (signInTimeoutRef.current) {
      clearTimeout(signInTimeoutRef.current);
      signInTimeoutRef.current = null;
    }
    setCalendarSignInState({ status: 'idle' });
    try {
      await api.cancelCalendarSignIn();
    } catch {}
  };

  const startCalendarSignIn = async (provider: 'google' | 'microsoft') => {
    if (provider === 'google' && !calendarProvidersConfig.googleConfigured) {
      setCalendarSignInState({
        status: 'error',
        provider,
        error: 'Google sign-in is not configured. Add MINOMEET_GOOGLE_CLIENT_ID to your environment or .env file.'
      });
      return;
    }
    if (provider === 'microsoft' && !calendarProvidersConfig.microsoftConfigured) {
      setCalendarSignInState({
        status: 'error',
        provider,
        error: 'Microsoft sign-in is not configured. Add MINOMEET_MICROSOFT_CLIENT_ID to your environment or .env file.'
      });
      return;
    }

    setCalendarSignInState({ status: 'authorizing', provider });

    if (signInTimeoutRef.current) clearTimeout(signInTimeoutRef.current);
    signInTimeoutRef.current = setTimeout(() => {
      setCalendarSignInState({
        status: 'error',
        provider,
        error: 'Sign-in timed out after 3 minutes. Please try again.'
      });
      api.cancelCalendarSignIn().catch(() => {});
    }, 180000);

    try {
      const account = await api.startCalendarSignIn(provider);
      if (signInTimeoutRef.current) {
        clearTimeout(signInTimeoutRef.current);
        signInTimeoutRef.current = null;
      }
      setCalendarSignInState({ status: 'success', provider });
      setCalendarAccounts(prev => {
        const filtered = prev.filter(a => a.id !== account.id && a.provider !== account.provider);
        return [...filtered, account];
      });
      showToast('Calendar connected', `Signed in as ${account.email}`, 'success');
      closeModal('connectCalendar');
      setCurrentScreen('meetings');
    } catch (err: any) {
      if (signInTimeoutRef.current) {
        clearTimeout(signInTimeoutRef.current);
        signInTimeoutRef.current = null;
      }
      const msg = err?.message || 'Authentication was cancelled or failed.';
      setCalendarSignInState({
        status: 'error',
        provider,
        error: msg
      });
    }
  };

  const signOutCalendarAccount = async (accountId: string) => {
    const prevAccounts = [...calendarAccounts];
    const target = calendarAccounts.find(a => a.id === accountId);
    const email = target ? target.email : 'account';
    const remaining = calendarAccounts.filter(a => a.id !== accountId);

    // Optimistic update
    setCalendarAccounts(remaining);

    try {
      await api.signOutCalendar(accountId);
      showToast(`Signed out of ${email}`, 'Account disconnected', 'info');
      if (remaining.length === 0) {
        openModal('connectCalendar');
      }
    } catch (err: any) {
      // Rollback on failure
      setCalendarAccounts(prevAccounts);
      showToast('Failed to sign out', err?.message || 'Unknown error', 'error');
    }
  };

  // Meeting reminders check
  useEffect(() => {
    if (!settings?.calendarPreferences?.remindersEnabled || !settings?.notifications || calendarAccounts.length === 0) {
      return;
    }
    const leadTimeMin = settings.calendarPreferences.reminderLeadTimeMinutes || 5;
    const notifiedEvents = new Set<string>();

    const checkReminders = async () => {
      try {
        const now = new Date();
        const lookahead = new Date(now.getTime() + (leadTimeMin + 2) * 60 * 1000);
        const events = await api.fetchCalendarEvents(now.toISOString(), lookahead.toISOString());
        for (const ev of events) {
          if (ev.isAllDay || ev.status === 'cancelled') continue;
          if (notifiedEvents.has(ev.id)) continue;
          const start = new Date(ev.start);
          const diffMin = Math.round((start.getTime() - now.getTime()) / (60 * 1000));
          if (diffMin >= 0 && diffMin <= leadTimeMin) {
            notifiedEvents.add(ev.id);
            sendDesktopNotification(
              `Upcoming Meeting: ${ev.title}`,
              `Starts in ${diffMin === 0 ? 'less than a minute' : `${diffMin} minute${diffMin === 1 ? '' : 's'}`}`
            );
          }
        }
      } catch {}
    };

    const interval = setInterval(checkReminders, 60 * 1000);
    checkReminders();
    return () => clearInterval(interval);
  }, [settings?.calendarPreferences?.remindersEnabled, settings?.calendarPreferences?.reminderLeadTimeMinutes, settings?.notifications, calendarAccounts.length]);

  // Initial load
  useEffect(() => {
    refreshMeetings();
    loadSettings();
    refreshTranscriptionModels();
    refreshTemplates();
  }, []);

  // Enforce Clean Light Theme permanently across entire application
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }, []);

  // Auto-save draft transcript to localStorage every 30s during recording
  useEffect(() => {
    if (!isRecording || liveTranscript.length === 0) return;
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem('minomeet_draft', JSON.stringify({
          transcript: liveTranscript,
          timer: recordingTimer,
          savedAt: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Draft auto-save failed:', e);
      }
    }, 30000);
    return () => clearInterval(saveInterval);
  }, [isRecording, liveTranscript, recordingTimer]);

  // Check for draft recovery on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('minomeet_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.transcript && parsed.transcript.length > 0) {
          setHasDraftRecovery(true);
        }
      }
    } catch (e) {
      localStorage.removeItem('minomeet_draft');
    }
  }, []);

  const recoverDraft = () => {
    try {
      const draft = localStorage.getItem('minomeet_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.transcript && parsed.transcript.length > 0) {
          const m = String(Math.floor((parsed.timer || 0) / 60)).padStart(2, '0');
          const s = String((parsed.timer || 0) % 60).padStart(2, '0');
          api.createMeeting({
            title: `Recovered Draft ${new Date(parsed.savedAt || Date.now()).toISOString().slice(0, 10)}`,
            transcript: parsed.transcript,
            duration: `${m}:${s}`,
            autoSummarize: false
          }).then(newMeeting => {
            setMeetings(prev => [newMeeting, ...prev]);
            setActiveMeeting(newMeeting);
            setCurrentScreen('notes');
            showToast('Draft recovered!', `${parsed.transcript.length} transcript segments restored.`, 'success');
            localStorage.removeItem('minomeet_draft');
            setHasDraftRecovery(false);
          });
        }
      }
    } catch (e) {
      showToast('Recovery failed', 'Could not recover draft.', 'error');
      localStorage.removeItem('minomeet_draft');
      setHasDraftRecovery(false);
    }
  };

  const dismissDraft = () => {
    localStorage.removeItem('minomeet_draft');
    setHasDraftRecovery(false);
  };

  const refreshMeetings = async () => {
    try {
      const data = await api.getMeetings();
      setMeetings(data);
      if (data.length > 0 && !activeMeeting) {
        setActiveMeeting(data[0]);
      }
    } catch (err) {
      console.error('Failed to load meetings:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
      if (res.storageStats) {
        setStorageStats(res.storageStats);
      }
      if (res.settings && typeof res.settings.autoDeleteRecordingsDays === 'number' && res.settings.autoDeleteRecordingsDays > 0) {
        api.purgeRecordings(res.settings.autoDeleteRecordingsDays).catch(err => {
          console.warn('[MeetingContext] auto-purge on startup error:', err);
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const refreshStorageStats = async () => {
    try {
      const stats = await api.getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    }
  };

  const refreshTranscriptionModels = async () => {
    try {
      const { models, activeModel } = await api.getTranscriptionModels();
      setTranscriptionModels(models);
      setActiveTranscriptionModel(activeModel);

      const status = await api.getTranscriptionEngineStatus();
      setEngineStatus(status);
    } catch (err) {
      console.error('Failed to load transcription models:', err);
    }
  };

  // Polling for in-flight model downloads (Web server)
  useEffect(() => {
    const hasInFlight = transcriptionModels.some(m => m.status === 'downloading' || m.status === 'paused');
    if (!hasInFlight) return;

    const interval = setInterval(async () => {
      try {
        const { models, activeModel } = await api.getTranscriptionModels();
        setTranscriptionModels(models);
        if (activeModel) setActiveTranscriptionModel(activeModel);

        for (const m of models) {
          if (m.status === 'downloaded') {
            const now = Date.now();
            const lastTime = lastModelReadyToastRef.current[m.id] || 0;
            if (now - lastTime > 4000) {
              lastModelReadyToastRef.current[m.id] = now;
              showToast('Model Ready!', `${m.name} downloaded and ready for offline use.`, 'success');
            }
          }
        }
      } catch (err) {
        console.warn('[MeetingContext] Error polling model downloads:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [transcriptionModels]);

  const downloadTranscriptionModel = async (id: string) => {
    try {
      showToast('Download started', `Downloading model weights to local storage…`, 'info');
      setTranscriptionModels(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'downloading', downloadProgress: 0, errorMessage: undefined } : m)
      );

      const updated = await api.downloadTranscriptionModel(id);
      setTranscriptionModels(prev =>
        prev.map(m => m.id === id ? { ...updated, status: 'downloaded', downloadProgress: 100 } : m)
      );

      const now = Date.now();
      const lastTime = lastModelReadyToastRef.current[id] || 0;
      if (now - lastTime > 4000) {
        lastModelReadyToastRef.current[id] = now;
        showToast('Model Ready!', `${updated.name} downloaded and ready for offline use.`, 'success');
      }

      await refreshTranscriptionModels();
    } catch (err: any) {
      showToast('Download failed', err.message, 'error');
      setTranscriptionModels(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'error', errorMessage: err.message, downloadProgress: 0 } : m)
      );
    }
  };

  const pauseTranscriptionModel = async (id: string) => {
    try {
      await api.pauseTranscriptionModel(id);
      setTranscriptionModels(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'paused' } : m)
      );
      showToast('Download Paused', 'Model download paused.', 'info');
    } catch (err: any) {
      showToast('Failed to pause download', err.message, 'error');
    }
  };

  const resumeTranscriptionModel = async (id: string) => {
    try {
      await api.resumeTranscriptionModel(id);
      setTranscriptionModels(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'downloading' } : m)
      );
      showToast('Download Resumed', 'Model download resumed.', 'info');
    } catch (err: any) {
      showToast('Failed to resume download', err.message, 'error');
    }
  };

  const stopTranscriptionModel = async (id: string) => {
    try {
      await api.stopTranscriptionModel(id);
      setTranscriptionModels(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'not_downloaded', downloadProgress: 0, downloadSpeed: undefined } : m)
      );
      showToast('Download Stopped', 'Model download stopped and partial weights cleaned up.', 'info');
    } catch (err: any) {
      showToast('Failed to stop download', err.message, 'error');
    }
  };

  const deleteTranscriptionModel = async (id: string) => {
    try {
      await api.deleteTranscriptionModel(id);
      showToast('Model cache cleared', 'Weights removed from local disk.', 'info');
      await refreshTranscriptionModels();
    } catch (err: any) {
      showToast('Failed to delete model', err.message, 'error');
    }
  };

  const selectTranscriptionModel = async (id: string) => {
    try {
      const active = await api.selectTranscriptionModel(id);
      setActiveTranscriptionModel(active);
      if (settings) {
        setSettings({ ...settings, transcriptionEngine: active.name });
      }
      showToast('Transcription Engine Selected', active.name, 'success');
      await refreshTranscriptionModels();
    } catch (err: any) {
      showToast('Failed to select model', err.message, 'error');
    }
  };

  const installPythonPackages = async () => {
    try {
      showToast('Installing AI Packages…', 'Installing openai-whisper, torch, torchaudio, and ffmpeg-python', 'info');
      const res = await api.installPythonPackages();
      if (res.success) {
        showToast('Packages Installed Successfully!', 'OpenAI Whisper & PyTorch ready.', 'success');
      } else {
        showToast('Installation Note', res.output || 'Check terminal output', 'info');
      }
      await refreshTranscriptionModels();
    } catch (err: any) {
      showToast('Installation error', err.message, 'error');
    }
  };


  const showToast = (title: string, subtitle = '', type: ToastMessage['type'] = 'success') => {
    if (settings?.notifications === false) return;
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, title, subtitle, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const openModal = (modal: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof modals) => {
    if (modal === 'connectCalendar') {
      if (calendarSignInState.status === 'authorizing') {
        cancelCalendarSignIn();
      } else {
        setCalendarSignInState({ status: 'idle' });
      }
    }
    setModals(prev => ({ ...prev, [modal]: false }));
  };

  const closeAllModals = () => {
    if (calendarSignInState.status === 'authorizing') {
      cancelCalendarSignIn();
    } else {
      setCalendarSignInState({ status: 'idle' });
    }
    setModals({
      import: false,
      model: false,
      about: false,
      ask: false,
      email: false,
      delete: false,
      rename: false,
      connectCalendar: false,
      calendarSignOut: false
    });
    setMeetingToDelete(null);
    setMeetingToRename(null);
  };

  const selectMeeting = (meeting: Meeting) => {
    setActiveMeeting(meeting);
    setCurrentScreen('notes');
    closeAllModals();
  };

  const startRecording = async (sourceType?: AudioCaptureMode) => {
    const chosenSource = sourceType || settings?.defaultAudioSource || 'mixed';
    setAudioSource(chosenSource);
    speechService.setAudioSource(chosenSource).catch(() => {});
    setLiveTranscript([]);
    setInterimTranscript('');
    setRecordingTimer(0);
    setIsRecording(true);
    setCurrentScreen('recording');
    closeAllModals();

    const interval = setInterval(() => {
      setRecordingTimer(t => t + 1);
    }, 1000);
    setTimerInterval(interval);

    const captureRes = await speechService.startCapture(
      (line) => {
        setLiveTranscript(prev => [...prev, line]);
      },
      chosenSource,
      undefined,
      (interim) => {
        if (settings?.liveCaptions !== false) {
          setInterimTranscript(interim);
        }
      },
      {
        sourceType: chosenSource,
        deviceId: settings?.selectedMicDeviceId,
        noiseSuppression: settings?.noiseSuppression,
        echoCancellation: settings?.echoCancellation,
        autoGainControl: settings?.autoGainControl,
        audioFormat: settings?.audioFormat,
        audioBitrate: settings?.audioBitrate,
        sampleRate: settings?.sampleRate
      }
    );

    if (chosenSource === 'mixed') {
      if (captureRes?.hasSystemAudio) {
        showToast('Parakeet Real-Time Engine Active', 'Streaming live speech & mixed meeting audio (<50ms latency)', 'success');
      } else {
        showToast('Parakeet Real-Time Active', 'Streaming live transcript in real-time', 'info');
      }
    } else if (chosenSource === 'system') {
      showToast('System Audio Capture Active', 'Capturing meeting audio stream', 'info');
    } else {
      showToast('Microphone Active', 'Capturing local voice', 'info');
    }
    sendDesktopNotification('Minomeet Recording Active', 'Live speech transcription in progress…');
  };

  const stopRecording = async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    const audioBlob = await speechService.stopCapture(settings?.audioFormat || 'MP4');
    setIsRecording(false);
    setInterimTranscript('');

    const m = String(Math.floor(recordingTimer / 60)).padStart(2, '0');
    const s = String(recordingTimer % 60).padStart(2, '0');
    const duration = `${m}:${s}`;

    const lines = liveTranscript.length > 0 ? liveTranscript : [
      { id: 't-default-1', time: '00:04', speaker: 'Speaker', text: 'Meeting discussion session concluded.' }
    ];

    try {
      let audioPath: string | undefined = undefined;
      if (settings?.saveAudio && audioBlob && audioBlob.size > 0) {
        try {
          const ext = (settings?.audioFormat || 'mp4').toLowerCase();
          const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 15);
          const filename = `recording_${timestamp}.${ext}`;
          const file = new File([audioBlob], filename, { type: audioBlob.type });
          const uploadRes = await api.uploadAudio(file);
          audioPath = uploadRes.filePath;
        } catch (uploadErr) {
          console.warn('Could not persist audio recording to disk:', uploadErr);
        }
      }

      const shouldAutoSummarize = settings?.autoSummaryOnConclude ?? settings?.autoSummary ?? true;

      const newMeeting = await api.createMeeting({
        title: `Meeting ${new Date().toISOString().slice(0, 10)}_${m}-${s}`,
        transcript: lines,
        duration,
        audioPath,
        autoSummarize: false,
        template: settings?.defaultTemplate,
        language: settings?.defaultLanguage
      });

      if (!shouldAutoSummarize) {
        newMeeting.summaryStatus = 'not_generated';
        try {
          await api.updateMeeting(newMeeting.id, { summaryStatus: 'not_generated' });
        } catch (e) {}
      }

      setMeetings(prev => [newMeeting, ...prev]);
      setActiveMeeting(newMeeting);
      setCurrentScreen('notes');
      showToast('Recording saved successfully!', `${lines.length} transcript segments captured.${audioPath ? ' Audio file saved.' : ''}`, 'success');
      sendDesktopNotification('Meeting Saved Successfully', `Recorded ${duration} with ${lines.length} transcript lines.`);
      await refreshStorageStats();
      localStorage.removeItem('minomeet_draft');

      // Trigger AI Minutes of Meeting generation with live progress animation
      if (shouldAutoSummarize && lines.length > 0) {
        setIsGeneratingSummary(true);
        try {
          const summary = await api.summarize({
            transcript: newMeeting.transcript,
            title: newMeeting.title,
            template: settings?.defaultTemplate || 'Standard Meeting Notes & MOM',
            language: settings?.defaultLanguage || 'English',
            agentId: 'mom_synthesis'
          });

          const updated = await api.updateMeeting(newMeeting.id, { summary, summaryStatus: 'completed' });
          setActiveMeeting(updated);
          setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
          showToast('Summary generated successfully!', 'Your meeting minutes are ready.', 'success');
          sendDesktopNotification('AI Minutes of Meeting Ready', `Summary generated for "${newMeeting.title}"`);
        } catch (sumErr: any) {
          console.error('Auto summary generation error:', sumErr);
          showToast('Summary Notice', sumErr.message || 'Could not generate summary.', 'warning');
        } finally {
          setIsGeneratingSummary(false);
        }
      }
    } catch (err: any) {
      showToast('Failed to save meeting', err.message, 'error');
    }
  };

  const cancelRecording = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    speechService.stopCapture().catch(() => {});
    setIsRecording(false);
    setLiveTranscript([]);
    setInterimTranscript('');
    setRecordingTimer(0);
    setCurrentScreen('home');
    showToast('Recording cancelled', '', 'info');
  };

  const generateSummaryForActive = async (template?: string, language?: string) => {
    if (!activeMeeting || isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    try {
      const summary = await api.summarize({
        transcript: activeMeeting.transcript,
        title: activeMeeting.title,
        template: template || activeMeeting.summary?.template || settings?.defaultTemplate || 'Standard Meeting Notes & MOM',
        language: language || activeMeeting.summary?.language || settings?.defaultLanguage || 'English',
        agentId: 'mom_synthesis'
      });

      const updated = await api.updateMeeting(activeMeeting.id, { summary, summaryStatus: 'completed' });
      setActiveMeeting(updated);
      setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('Summary generated successfully!', 'Your meeting minutes are ready.', 'success');
      sendDesktopNotification('AI Minutes of Meeting Ready', `Summary generated for "${activeMeeting.title}"`);
    } catch (err: any) {
      showToast('Generation failed', err.message, 'error');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const updateActiveMeeting = async (updates: Partial<Meeting>) => {
    if (!activeMeeting) return;
    try {
      const updated = await api.updateMeeting(activeMeeting.id, updates);
      setActiveMeeting(updated);
      setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
      showToast('Saved', 'Your changes have been saved.', 'success');
    } catch (err: any) {
      showToast('Save failed', err.message, 'error');
    }
  };

  const updateActiveSummary = async (summaryUpdates: Partial<MOMSummary>) => {
    if (!activeMeeting || !activeMeeting.summary) return;
    const newSummary: MOMSummary = { ...activeMeeting.summary, ...summaryUpdates };
    await updateActiveMeeting({ summary: newSummary });
  };

  // Delete modal flow
  const openDeleteModal = (meeting: Meeting) => {
    setMeetingToDelete(meeting);
    openModal('delete');
  };

  const closeDeleteModal = () => {
    closeModal('delete');
    setMeetingToDelete(null);
  };

  const confirmDeleteMeeting = async () => {
    if (!meetingToDelete) return;
    const id = meetingToDelete.id;
    try {
      await api.deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      if (activeMeeting?.id === id) {
        const remaining = meetings.filter(m => m.id !== id);
        setActiveMeeting(remaining.length > 0 ? remaining[0] : null);
        setCurrentScreen('home');
      }
      showToast('Meeting deleted permanently', meetingToDelete.title, 'info');
    } catch (err: any) {
      showToast('Delete failed', err.message, 'error');
    } finally {
      closeDeleteModal();
    }
  };

  // Rename modal flow
  const openRenameModal = (meeting: Meeting) => {
    setMeetingToRename(meeting);
    openModal('rename');
  };

  const closeRenameModal = () => {
    closeModal('rename');
    setMeetingToRename(null);
  };

  const confirmRenameMeeting = async (newTitle: string) => {
    if (!meetingToRename || !newTitle.trim()) return;
    const id = meetingToRename.id;
    try {
      const updated = await api.updateMeeting(id, { title: newTitle.trim() });
      setMeetings(prev => prev.map(m => m.id === id ? updated : m));
      if (activeMeeting?.id === id) {
        setActiveMeeting(updated);
      }
      showToast('Meeting renamed successfully', newTitle.trim(), 'success');
    } catch (err: any) {
      showToast('Rename failed', err.message, 'error');
    } finally {
      closeRenameModal();
    }
  };

  const deleteMeeting = async (id: string) => {
    const target = meetings.find(m => m.id === id);
    if (target) {
      openDeleteModal(target);
    }
  };

  const togglePinMeeting = async (id: string) => {
    const target = meetings.find(m => m.id === id);
    if (!target) return;
    try {
      const updated = await api.updateMeeting(id, { isPinned: !target.isPinned });
      setMeetings(prev => prev.map(m => m.id === id ? updated : m));
      if (activeMeeting?.id === id) {
        setActiveMeeting(updated);
      }
      showToast(updated.isPinned ? 'Meeting pinned' : 'Meeting unpinned', target.title, 'success');
    } catch (err: any) {
      showToast('Pin failed', err.message, 'error');
    }
  };

  const sendDesktopNotification = (title: string, body: string) => {
    if (!settings?.notifications) return;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        });
      }
    }
  };

  const openStorageFolder = async (target?: string) => {
    try {
      const res = await api.openFolder(target || settings?.storagePath);
      showToast('Folder Opened in Finder', res.path, 'success');
    } catch (err: any) {
      showToast('Could not open folder', err.message, 'error');
    }
  };

  const purgeOldRecordings = async (days: number) => {
    try {
      const res = await api.purgeRecordings(days);
      showToast('Storage Optimized', res.message, 'info');
      await refreshStorageStats();
    } catch (err: any) {
      showToast('Purge Failed', err.message, 'error');
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      // If user toggles notifications on, proactively request browser permission
      if (updates.notifications && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          await Notification.requestPermission();
        }
      }

      const updated = await api.updateSettings(updates);
      setSettings(updated);
      showToast('Settings updated', 'Configuration saved.', 'success');
      await refreshStorageStats();
    } catch (err: any) {
      showToast('Failed to update settings', err.message, 'error');
    }
  };

  const refreshTemplates = async () => {
    try {
      const list = await api.getTemplates();
      setTemplates(list);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const createTemplate = async (templateData: Partial<MOMTemplate>): Promise<MOMTemplate | null> => {
    try {
      const created = await api.createTemplate(templateData);
      setTemplates(prev => [...prev, created]);
      showToast('Template Created', created.name, 'success');
      return created;
    } catch (err: any) {
      showToast('Failed to create template', err.message, 'error');
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<MOMTemplate>): Promise<MOMTemplate | null> => {
    try {
      const updated = await api.updateTemplate(id, updates);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      showToast('Template Updated', updated.name, 'success');
      return updated;
    } catch (err: any) {
      showToast('Failed to update template', err.message, 'error');
      return null;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const target = templates.find(t => t.id === id);
      const success = await api.deleteTemplate(id);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        showToast('Template Deleted', target?.name || '', 'info');
        await loadSettings();
      }
      return success;
    } catch (err: any) {
      showToast('Failed to delete template', err.message, 'error');
      return false;
    }
  };

  const setDefaultTemplate = async (id: string): Promise<void> => {
    try {
      const updated = await api.setDefaultTemplate(id);
      setTemplates(prev => prev.map(t => ({ ...t, isDefault: t.id === id })));
      if (settings) {
        setSettings({ ...settings, defaultTemplateId: updated.id, defaultTemplate: updated.name });
      }
      showToast('Default Template Set', updated.name, 'success');
    } catch (err: any) {
      showToast('Failed to set default template', err.message, 'error');
    }
  };

  return (
    <MeetingContext.Provider
      value={{
        meetings,
        activeMeeting,
        currentScreen,
        settingsTab,
        searchQuery,
        isRecording,
        recordingTimer,
        liveTranscript,
        interimTranscript,
        audioSource,
        isGeneratingSummary,
        settings,
        storageStats,
        toasts,
        meetingToDelete,
        meetingToRename,
        transcriptionModels,
        activeTranscriptionModel,
        engineStatus,
        templates,
        hasDraftRecovery,
        modals,
        setCurrentScreen,
        setSettingsTab,
        setSearchQuery,
        setAudioSource,
        selectMeeting,
        startRecording,
        stopRecording,
        cancelRecording,
        generateSummaryForActive,
        updateActiveMeeting,
        updateActiveSummary,
        deleteMeeting,
        togglePinMeeting,
        openDeleteModal,
        closeDeleteModal,
        confirmDeleteMeeting,
        openRenameModal,
        closeRenameModal,
        confirmRenameMeeting,
        openModal,
        closeModal,
        closeAllModals,
        showToast,
        sendDesktopNotification,
        removeToast,
        updateSettings,
        openStorageFolder,
        purgeOldRecordings,
        refreshStorageStats,
        refreshMeetings,
        refreshTranscriptionModels,
        downloadTranscriptionModel,
        pauseTranscriptionModel,
        resumeTranscriptionModel,
        stopTranscriptionModel,
        deleteTranscriptionModel,
        selectTranscriptionModel,
        installPythonPackages,
        refreshTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        setDefaultTemplate,
        recoverDraft,
        dismissDraft,
        calendarAccounts,
        isCalendarConnected: calendarAccounts.length > 0,
        calendarProvidersConfig,
        calendarSignInState,
        hasSeenMeetingsNav,
        markMeetingsNavSeen,
        refreshCalendarAccounts,
        startCalendarSignIn,
        cancelCalendarSignIn,
        signOutCalendarAccount
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};
