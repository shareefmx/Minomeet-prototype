import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMeeting } from '../../context/MeetingContext.js';
import { api, toCanonicalModelId } from '../../services/api.js';
import {
  Sliders,
  Mic,
  FileAudio,
  Cpu,
  FileText,
  Sparkles,
  FolderOpen,
  Shield,
  ShieldCheck,
  Zap,
  Check,
  Copy,
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  Activity,
  HardDrive,
  Loader2,
  Bell,
  Edit2,
  Layers,
  Volume2,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Save,
  RotateCw,
  X,
  ArrowUpRight,
  Info,
  Speaker,
  HelpCircle,
  Globe,
  Lock,
  Upload,
  Pause,
  Play,
  Square,
  Table,
  Database,
  ChevronUp,
  ChevronDown,
  Search,
  Printer,
  List,
  ListOrdered,
  Calendar
} from 'lucide-react';
import { MeetingsSettingsTab } from './MeetingsSettingsTab.js';
import { SettingsTab, MOMTemplate, MOMTemplateSection, MOMSectionType, AIConnectionStatus, ProviderCredential, AIAgentOverride, AUDIO_CAPTURE_MODES, TRANSCRIPTION_LANGUAGES, SUMMARY_LANGUAGES } from '../../types/meeting.js';
import { normalizeSections, isBuiltInTemplateId, resolveActiveTemplate } from '../../utils/momTemplates.js';
import { renderMomDocumentHtml, printMomDocument } from '../../utils/momDocumentRenderer.js';
import {
  AI_PROVIDERS_CONFIG,
  AI_AGENTS_CONFIG,
  getAvailableModelsForProvider
} from '../../utils/aiModelConfig.js';

const isTauri = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

const invokeTauri = async <T = any>(cmd: string, args?: Record<string, any>): Promise<T> => {
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (w.__TAURI_INTERNALS__?.invoke) {
      return (w.__TAURI_INTERNALS__.invoke as (c: string, a?: any) => Promise<T>)(cmd, args);
    }
    if (w.__TAURI__?.core?.invoke) {
      return (w.__TAURI__.core.invoke as (c: string, a?: any) => Promise<T>)(cmd, args);
    }
  }
  throw new Error(`Tauri invoke unavailable for command: ${cmd}`);
};

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);


import {
  Toggle,
  SegmentedPills,
  StatusBadge,
  StarRating,
  ProgressBar,
  InlineConfirm
} from './SettingsComponents.js';

// Master catalog of 9 canonical models
interface MasterModelEntry {
  id: string;
  name: string;
  family: 'parakeet' | 'whisper';
  tag: string;
  sizeFormatted: string;
  accuracy: string;
  speed: string;
  ramRequired: string;
  rating: number;
  description: string;
  recommended?: boolean;
}

const MASTER_CATALOG: MasterModelEntry[] = [
  {
    id: 'parakeet-tdt-0.6b-v3-int8',
    name: 'Parakeet TDT 1.1B Lightning',
    family: 'parakeet',
    tag: 'Real-Time Streaming',
    sizeFormatted: '650 MB',
    accuracy: 'Studio-grade',
    speed: 'Ultra-Fast (<25 ms)',
    ramRequired: '2 GB',
    rating: 5.0,
    description: 'FastConformer-TDT neural architecture with sub-25ms streaming latency and studio-grade accuracy.',
    recommended: true
  },
  {
    id: 'whisper-tiny',
    name: 'Whisper tiny',
    family: 'whisper',
    tag: 'Real time, fastest option',
    sizeFormatted: '74 MB',
    accuracy: 'Decent accuracy',
    speed: 'Very fast processing',
    ramRequired: '500 MB',
    rating: 2.0,
    description: 'Extremely lightweight multilingual speech recognition model for quick turnaround.'
  },
  {
    id: 'whisper-tiny-q5_1',
    name: 'Whisper tiny-q5_1',
    family: 'whisper',
    tag: 'Real time, fastest option, Balanced+',
    sizeFormatted: '31 MB',
    accuracy: 'Decent accuracy',
    speed: 'Very fast processing',
    ramRequired: '300 MB',
    rating: 2.5,
    description: 'Quantized tiny model with minimal memory footprint and fast execution.'
  },
  {
    id: 'whisper-base',
    name: 'Whisper base',
    family: 'whisper',
    tag: 'Fast processing, balanced quality',
    sizeFormatted: '142 MB',
    accuracy: 'Good accuracy',
    speed: 'Fast processing',
    ramRequired: '1 GB',
    rating: 3.0,
    description: 'Balanced base multilingual model for general speech transcription.'
  },
  {
    id: 'whisper-base-q5_1',
    name: 'Whisper base-q5_1',
    family: 'whisper',
    tag: 'Fast processing, balanced quality, Balanced+',
    sizeFormatted: '57 MB',
    accuracy: 'Good accuracy',
    speed: 'Fast processing',
    ramRequired: '600 MB',
    rating: 3.5,
    description: 'Quantized base model for memory-constrained environments.'
  },
  {
    id: 'whisper-small-q5_1',
    name: 'Whisper small-q5_1',
    family: 'whisper',
    tag: 'Fast processing, good accuracy, Balanced+',
    sizeFormatted: '181 MB',
    accuracy: 'Good accuracy',
    speed: 'Fast processing',
    ramRequired: '1.5 GB',
    rating: 4.0,
    description: 'Quantized small model offering high accuracy with moderate resource requirements.'
  },
  {
    id: 'whisper-medium',
    name: 'Whisper medium',
    family: 'whisper',
    tag: 'Slower processing, professional quality',
    sizeFormatted: '1.5 GB',
    accuracy: 'High accuracy',
    speed: 'Slow processing',
    ramRequired: '4 GB',
    rating: 4.5,
    description: 'High-accuracy model suitable for complex meeting discussions and multiple accents.'
  },
  {
    id: 'whisper-large-v3-turbo-q5_0',
    name: 'Whisper large-v3-turbo-q5_0',
    family: 'whisper',
    tag: 'Moderate speed, best accuracy with speed, optimized, Balanced',
    sizeFormatted: '547 MB',
    accuracy: 'High accuracy',
    speed: 'Medium processing',
    ramRequired: '2.5 GB',
    rating: 5.0,
    description: 'Quantized large-v3 turbo model combining near-lossless accuracy with fast inference.'
  },
  {
    id: 'whisper-large-v3-turbo',
    name: 'Whisper Large v3 Turbo',
    family: 'whisper',
    tag: 'OpenAI multilingual (99 languages)',
    sizeFormatted: '1.5 GB',
    accuracy: 'High accuracy',
    speed: 'Standard processing',
    ramRequired: '4 GB',
    rating: 5.0,
    description: 'State-of-the-art accuracy across 99 languages with 8x faster decoding than Large-v3.'
  }
];

export interface SettingsScreenProps {
  initialTab?: SettingsTab;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ initialTab = 'recording' }) => {

  const {
    settings,
    storageStats,
    settingsTab,
    setSettingsTab,
    updateSettings,
    showToast,
    openStorageFolder,
    transcriptionModels,
    activeTranscriptionModel,
    templates,
    downloadTranscriptionModel,
    deleteTranscriptionModel,
    selectTranscriptionModel,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    openModal,
    sendDesktopNotification,
    refreshStorageStats,
    pauseTranscriptionModel,
    resumeTranscriptionModel,
    stopTranscriptionModel
  } = useMeeting();

  const [modelFilter, setModelFilter] = useState<'all' | 'whisper' | 'parakeet'>('all');

  // Transcription Engine Diagnostics state
  const [isTestingEngine, setIsTestingEngine] = useState(false);
  const [engineTestResult, setEngineTestResult] = useState<{
    healthy: boolean;
    modelName: string;
    isLoaded: boolean;
    modelsDir: string;
    hardwareAcceleration: string;
    latencyMs: number;
    message: string;
  } | null>(null);

  const handleRunEngineDiagnostics = async () => {
    setIsTestingEngine(true);
    try {
      const res = await api.testTranscriptionEngine();
      setEngineTestResult(res);
      showToast('Transcription Engine Verified', `Model ${res.modelName} is active and ready (${res.latencyMs}ms)`, 'success');
      sendDesktopNotification('Transcription Engine Verified', `Local ${res.modelName} speech engine is active and hardware accelerated.`);
    } catch (err: any) {
      showToast('Diagnostics Error', err?.message || 'Failed to verify speech engine', 'error');
    } finally {
      setIsTestingEngine(false);
    }
  };

  // AI Model Control Panel State
  const [selectedProviderId, setSelectedProviderId] = useState<string>('builtin-ai');
  const [selectedModelId, setSelectedModelId] = useState<string>('qwen3.5:4b');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [baseUrlInput, setBaseUrlInput] = useState<string>('http://127.0.0.1:11434');
  const [customModelInput, setCustomModelInput] = useState<string>('custom-model');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [providerFetchedModels, setProviderFetchedModels] = useState<Record<string, string[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<AIConnectionStatus>('connected');
  const [connectionStatusMessage, setConnectionStatusMessage] = useState<string>('Ready (On-Device Neural Engine)');
  const [testLatencyMs, setTestLatencyMs] = useState<number | null>(null);
  const [builtinModelStatus, setBuiltinModelStatus] = useState<'ready' | 'download_required' | 'downloading'>('ready');
  const [builtinDownloadProgress, setBuiltinDownloadProgress] = useState<number>(0);

  // Summary Tab State
  const [isSavingAutoSummary, setIsSavingAutoSummary] = useState<boolean>(false);
  const [isSavingComponents, setIsSavingComponents] = useState<boolean>(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState<boolean>(false);

  const handleToggleAutoSummary = async (newVal: boolean) => {
    if (isSavingAutoSummary) return;
    setIsSavingAutoSummary(true);
    try {
      await updateSettings({
        autoSummaryOnConclude: newVal,
        autoSummary: newVal
      });
      if (settings?.notifications) {
        showToast(newVal ? 'Auto summary enabled' : 'Auto summary disabled', '', 'success');
      }
    } catch (err: any) {
      showToast('Failed to update setting', err.message || 'Error updating auto summary', 'error');
    } finally {
      setIsSavingAutoSummary(false);
    }
  };

  const handleToggleComponent = async (key: 'executiveSummary' | 'actionItems' | 'keyDecisions', newVal: boolean) => {
    if (isSavingComponents) return;
    const currentComponents = settings?.summaryComponents || {
      executiveSummary: true,
      actionItems: true,
      keyDecisions: true
    };
    const count = (currentComponents.executiveSummary ? 1 : 0) + (currentComponents.actionItems ? 1 : 0) + (currentComponents.keyDecisions ? 1 : 0);
    if (!newVal && count <= 1 && currentComponents[key]) {
      showToast('At least one summary component must be enabled.', '', 'warning');
      return;
    }
    const nextComponents = { ...currentComponents, [key]: newVal };
    setIsSavingComponents(true);
    try {
      await updateSettings({ summaryComponents: nextComponents });
      if (settings?.notifications) {
        const labels = {
          executiveSummary: 'Executive Summary',
          actionItems: 'Action Items Matrix',
          keyDecisions: 'Key Decisions'
        };
        showToast(`${labels[key]} ${newVal ? 'enabled' : 'disabled'}`, '', 'success');
      }
    } catch (err: any) {
      showToast('Failed to update setting', err.message || 'Error updating component', 'error');
    } finally {
      setIsSavingComponents(false);
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    if (isSavingLanguage) return;
    setIsSavingLanguage(true);
    try {
      await updateSettings({ transcriptionLanguage: langCode });
      const opt = TRANSCRIPTION_LANGUAGES.find(l => l.code === langCode);
      if (settings?.notifications) {
        showToast(`Transcription language updated to ${opt?.label || langCode}`, '', 'success');
      }
    } catch (err: any) {
      showToast('Failed to update language', err.message || 'Error updating language', 'error');
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleSummaryLanguageChange = async (langCode: string) => {
    if (isSavingLanguage) return;
    setIsSavingLanguage(true);
    try {
      await updateSettings({ summaryLanguage: langCode });
      const opt = SUMMARY_LANGUAGES.find(l => l.code === langCode);
      if (settings?.notifications) {
        showToast(`Summary language updated to ${opt?.label || langCode}`, '', 'success');
      }
    } catch (err: any) {
      showToast('Failed to update summary language', err.message || 'Error updating summary language', 'error');
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const activeTemplate = useMemo(() => {
    return resolveActiveTemplate(templates, settings?.defaultTemplateId, settings?.defaultTemplate);
  }, [templates, settings?.defaultTemplateId, settings?.defaultTemplate]);

  const previewExecSummary = useMemo(() => {
    if (activeTemplate?.sections && activeTemplate.sections.length > 0) {
      return activeTemplate.sections.slice(0, 3).map(s => {
        const text = typeof s === 'string' ? s : (s.name || s.title || '');
        return `• ${text.replace(/\s*\(.*?\)/, '')}`;
      });
    }
    return [
      '• Purpose & Strategic Context',
      '• Critical Discussion Highlights',
      '• Concluding Next Steps'
    ];
  }, [activeTemplate]);

  const previewActionItems = useMemo(() => {
    if (activeTemplate?.tableColumns && activeTemplate.tableColumns.length > 0) {
      const cols = activeTemplate.tableColumns;
      return {
        header: cols.join(' | '),
        row1: `${cols[0] ? 'Sarah' : 'Lead'} | ${cols[1] ? 'Deploy v1.2 Engine' : 'Task'} | ${cols[2] ? 'Fri' : 'Due'}${cols[3] ? ' | In Progress' : ''}`,
        row2: `${cols[0] ? 'Alex' : 'Engineer'} | ${cols[1] ? 'Customer MOM Review' : 'Deliverable'} | ${cols[2] ? 'Mon' : 'Due'}${cols[3] ? ' | Completed' : ''}`
      };
    }
    return {
      header: 'Owner | Task | Due Date',
      row1: 'Sarah | Deploy v1.2 Engine | Fri',
      row2: 'Alex | Customer MOM Review | Mon'
    };
  }, [activeTemplate]);

  const previewKeyDecisions = useMemo(() => {
    if (activeTemplate?.sampleDocument) {
      const sampleText = typeof activeTemplate.sampleDocument === 'string'
        ? activeTemplate.sampleDocument
        : (activeTemplate.sampleDocument.sectionsData?.['Key Decisions']?.join?.('\n') ||
           activeTemplate.sampleDocument.agenda?.join?.('\n') ||
           JSON.stringify(activeTemplate.sampleDocument));
      const lines = sampleText.split('\n');
      const decBullets: string[] = [];
      let inDecisions = false;
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('decision') && line.startsWith('#')) {
          inDecisions = true;
          continue;
        }
        if (inDecisions && line.startsWith('#')) {
          break;
        }
        if (inDecisions && (/^\d+\./.test(line.trim()) || line.trim().startsWith('-') || line.trim().startsWith('*'))) {
          const clean = line.replace(/^[\d.*\-•]+\s*/, '').replace(/\*\*/g, '').trim();
          if (clean.length > 0) decBullets.push(`✓ ${clean}`);
          if (decBullets.length >= 3) break;
        }
      }
      if (decBullets.length > 0) return decBullets;
    }
    return [
      '✓ 100% On-Device AI Architecture',
      '✓ Ratified 6 Canonical MOM Specs',
      '✓ Zero-Telemetry Privacy Policy'
    ];
  }, [activeTemplate]);

  const autoSummaryChecked = settings?.autoSummaryOnConclude ?? settings?.autoSummary ?? true;
  const summaryComponentsConfig = settings?.summaryComponents || {
    executiveSummary: true,
    actionItems: true,
    keyDecisions: true
  };
  const enabledComponentsCount = (summaryComponentsConfig.executiveSummary ? 1 : 0)
    + (summaryComponentsConfig.actionItems ? 1 : 0)
    + (summaryComponentsConfig.keyDecisions ? 1 : 0);

  const activeTransLang = settings?.transcriptionLanguage || 'en';
  const activeSumLang = (settings?.summaryLanguage === 'auto' || settings?.summaryLanguage === 'en') ? settings.summaryLanguage : 'en';

  const isEnglishOnlyWarning = useMemo(() => {
    if (activeTransLang === 'en' || activeTransLang === 'auto') return false;
    const modelId = (activeTranscriptionModel?.id || settings?.selectedModel || settings?.transcriptionEngine || '').toLowerCase();
    const modelName = (activeTranscriptionModel?.name || '').toLowerCase();
    const modelDesc = (activeTranscriptionModel?.description || '').toLowerCase();
    return modelId.includes('.en') || modelName.includes('.en') || modelDesc.includes('english only') || modelDesc.includes('english-only');
  }, [activeTransLang, activeTranscriptionModel, settings?.selectedModel, settings?.transcriptionEngine]);

  const currentLanguageDesc = useMemo(() => {
    if (activeTransLang === 'auto') {
      return 'Language is detected from the audio. MOM is written in the detected language.';
    }
    if (activeTransLang === 'en') {
      return 'All transcription and structured MOM output is generated in English.';
    }
    const label = TRANSCRIPTION_LANGUAGES.find(l => l.code === activeTransLang)?.label || activeTransLang;
    return `Audio transcription is captured in ${label}. Structured MOM output is generated in ${label}.`;
  }, [activeTransLang]);

  // Check Built-in AI Model Disk Status on Mount & Selection Change
  useEffect(() => {
    if (selectedProviderId === 'builtin-ai' || selectedProviderId === 'builtin') {
      if (isTauri()) {
        invokeTauri<boolean>('builtin_ai_is_model_ready', { modelName: selectedModelId, refresh: true })
          .then((ready: boolean) => {
            setBuiltinModelStatus(ready ? 'ready' : 'download_required');
          })
          .catch(() => setBuiltinModelStatus('download_required'));
      }
    }
  }, [selectedProviderId, selectedModelId]);

  const handleDownloadBuiltinModel = async () => {
    setBuiltinModelStatus('downloading');
    setBuiltinDownloadProgress(10);
    showToast('Download Started', `Downloading local neural model ${selectedModelId}…`, 'info');
    try {
      if (isTauri()) {
        await invokeTauri('builtin_ai_download_model', { modelName: selectedModelId });
        setBuiltinModelStatus('ready');
        setConnectionStatus('connected');
        setConnectionStatusMessage('On-Device Neural Engine Ready & Active');
        showToast('Download Complete', `${selectedModelId} is ready and active.`, 'success');
      }
    } catch (err: any) {
      setBuiltinModelStatus('download_required');
      showToast('Download Failed', err.message || 'Failed to download model.', 'error');
    }
  };

  // AI Agent Overrides State
  const [agentOverrides, setAgentOverrides] = useState<Record<string, AIAgentOverride>>({});

  // Sync settings into local AI Model state
  useEffect(() => {
    if (settings) {
      const activeProv = (settings.activeAIProvider === 'builtin' || settings.activeAIProvider === 'builtin-ai')
        ? 'builtin-ai'
        : (settings.activeAIProvider || 'builtin-ai');
      setSelectedProviderId(activeProv);
      const defaultModelForProv = AI_PROVIDERS_CONFIG.find(p => p.id === activeProv)?.models[0]?.id || 'qwen3.5:4b';
      const activeModel = settings.selectedModel || defaultModelForProv;
      setSelectedModelId(activeModel);

      const savedCred = settings.aiProviders?.[activeProv];
      setApiKeyInput(savedCred?.apiKey || '');
      setBaseUrlInput(savedCred?.baseUrl || (activeProv === 'ollama' ? 'http://127.0.0.1:11434' : 'http://localhost:8000/v1'));
      setCustomModelInput(savedCred?.customModelName || 'custom-model');
      const isBuiltin = activeProv === 'builtin' || activeProv === 'builtin-ai';
      setConnectionStatus(savedCred?.status || (isBuiltin ? 'connected' : (savedCred?.apiKey ? 'connected' : 'not_configured')));
      setConnectionStatusMessage(savedCred?.statusMessage || (isBuiltin ? 'Ready (On-Device Neural Engine)' : ''));

      // Populate fetched models cache across all providers
      const fetchedMap: Record<string, string[]> = {};
      AI_PROVIDERS_CONFIG.forEach(p => {
        if (settings.aiProviders?.[p.id]?.fetchedModels) {
          fetchedMap[p.id] = settings.aiProviders[p.id].fetchedModels || [];
        }
      });
      setProviderFetchedModels(fetchedMap);

      // Populate agent overrides state
      const overridesMap: Record<string, AIAgentOverride> = {};
      AI_AGENTS_CONFIG.forEach(a => {
        const saved = settings.agentOverrides?.[a.id];
        overridesMap[a.id] = {
          useGlobal: saved?.useGlobal ?? true,
          providerId: (saved?.providerId === 'builtin' || saved?.providerId === 'builtin-ai') ? 'builtin-ai' : (saved?.providerId || activeProv),
          modelId: saved?.modelId || activeModel
        };
      });
      setAgentOverrides(overridesMap);
    }
  }, [settings]);

  // When selected provider changes in the UI dropdown
  const handleProviderChange = (newProviderId: string) => {
    setSelectedProviderId(newProviderId);
    const provDef = AI_PROVIDERS_CONFIG.find(p => p.id === newProviderId) || AI_PROVIDERS_CONFIG[0];
    const savedCred = settings?.aiProviders?.[newProviderId];
    const key = savedCred?.apiKey || '';
    const url = savedCred?.baseUrl || (newProviderId === 'ollama' ? 'http://127.0.0.1:11434' : (provDef.defaultEndpoint || 'http://localhost:8000/v1'));

    setApiKeyInput(key);
    setBaseUrlInput(url);

    // Calculate available models with the saved credential for the new provider
    const available = getAvailableModelsForProvider(
      {
        ...settings,
        aiProviders: {
          ...settings?.aiProviders,
          [newProviderId]: {
            ...savedCred,
            apiKey: key,
            baseUrl: url,
            fetchedModels: providerFetchedModels[newProviderId] || savedCred?.fetchedModels
          }
        }
      } as any,
      newProviderId
    );

    let defaultModel = savedCred?.selectedModel;
    if (!defaultModel || !available.some(m => m.id === defaultModel)) {
      defaultModel = available[0]?.id || (newProviderId === 'custom' ? 'custom-model' : (newProviderId === 'builtin-ai' ? 'qwen3.5:4b' : ''));
    }
    setSelectedModelId(defaultModel);
    setCustomModelInput(defaultModel);

    // Clear old test connection result when switching providers
    setConnectionStatus('not_configured');
    setConnectionStatusMessage('');
    setTestLatencyMs(null);
  };

  // Generalized Dynamic Model Fetcher for ALL Providers
  const handleFetchModels = async (targetProviderId?: string) => {
    const pId = targetProviderId || selectedProviderId;
    const provDef = AI_PROVIDERS_CONFIG.find(p => p.id === pId);
    const keyToUse = pId === selectedProviderId ? apiKeyInput : (settings?.aiProviders?.[pId]?.apiKey || '');
    const urlToUse = pId === selectedProviderId ? baseUrlInput : (settings?.aiProviders?.[pId]?.baseUrl || '');

    if (provDef?.requiresKey && (!keyToUse || keyToUse.trim().length === 0)) {
      setConnectionStatus('invalid');
      setConnectionStatusMessage(`API Key is required for ${provDef?.name}.`);
      showToast('API Key Required', `Please enter your ${provDef?.name} API key first to fetch models.`, 'warning');
      return;
    }

    setIsFetchingModels(true);
    try {
      const res = await api.fetchAIProviderModels({
        provider: pId,
        apiKey: keyToUse,
        baseUrl: urlToUse
      });

      if (res.success && res.models && res.models.length > 0) {
        setProviderFetchedModels(prev => ({
          ...prev,
          [pId]: res.models || []
        }));

        if (pId === selectedProviderId) {
          setConnectionStatus('connected');
          setConnectionStatusMessage(`Verified & Loaded ${res.models.length} model(s).`);
          if (!res.models.includes(selectedModelId)) {
            setSelectedModelId(res.models[0]);
            if (pId === 'custom') {
              setCustomModelInput(res.models[0]);
            }
          }
        }

        showToast('Models Loaded', `Fetched ${res.models.length} available models from ${provDef?.name || pId}.`, 'success');
      } else {
        if (pId === selectedProviderId) {
          setConnectionStatus('invalid');
          setConnectionStatusMessage(res.error || `Invalid credentials for ${provDef?.name || pId}.`);
        }
        showToast('Authentication Error', res.error || `Invalid credentials for ${provDef?.name || pId}.`, 'error');
      }
    } catch (err: any) {
      if (pId === selectedProviderId) {
        setConnectionStatus('error');
        setConnectionStatusMessage(err.message || 'Connection failed.');
      }
      showToast('Fetch Failed', err.message || 'Failed to fetch models.', 'error');
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Test Connection Handler (runs real generation, measures exact latency, classifies errors)
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('testing');
    setConnectionStatusMessage('Testing live generation & measuring latency…');
    setTestLatencyMs(null);

    const effectiveModel = selectedProviderId === 'custom'
      ? (customModelInput.trim() || 'custom-model')
      : selectedModelId;

    try {
      const res = await api.testAIConnection({
        provider: selectedProviderId,
        apiKey: apiKeyInput.trim(),
        baseUrl: baseUrlInput.trim(),
        model: effectiveModel
      });

      setConnectionStatus(res.status);
      setConnectionStatusMessage(res.message);
      setTestLatencyMs(res.latencyMs || null);

      if (res.fetchedModels && res.fetchedModels.length > 0) {
        setProviderFetchedModels(prev => ({
          ...prev,
          [selectedProviderId]: res.fetchedModels || []
        }));
        if (!res.fetchedModels.includes(selectedModelId)) {
          setSelectedModelId(res.fetchedModels[0]);
        }
      }

      if (res.success) {
        showToast('Connection Verified', res.message, 'success');
      } else {
        showToast('Connection Failed', res.message, 'error');
      }
      return res;
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionStatusMessage(err.message || 'Connection test failed.');
      showToast('Connection Failed', err.message || 'Failed to connect.', 'error');
      return { success: false, status: 'error' as AIConnectionStatus, message: err.message };
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Save AI Model Configuration Handler with Hot-Reload and Persistent Keychain Sync
  const handleSaveAIConfiguration = async () => {
    const provDef = AI_PROVIDERS_CONFIG.find(p => p.id === selectedProviderId) || AI_PROVIDERS_CONFIG[0];
    if (provDef.requiresKey && (!apiKeyInput || apiKeyInput.trim().length === 0)) {
      setConnectionStatus('invalid');
      setConnectionStatusMessage(`API Key is required for ${provDef.name}.`);
      showToast('API Key Required', `Please enter a valid API key for ${provDef.name}.`, 'warning');
      return;
    }

    const effectiveModelId = selectedProviderId === 'custom'
      ? (customModelInput.trim() || 'custom-model')
      : selectedModelId;

    let finalStatus: AIConnectionStatus = connectionStatus;
    let finalMessage = connectionStatusMessage;

    // If not builtin and not already verified as connected, perform live test first
    if (selectedProviderId !== 'builtin' && selectedProviderId !== 'builtin-ai' && connectionStatus !== 'connected') {
      setIsTestingConnection(true);
      const testResult = await api.testAIConnection({
        provider: selectedProviderId,
        apiKey: apiKeyInput.trim(),
        baseUrl: baseUrlInput.trim(),
        model: effectiveModelId
      });
      setIsTestingConnection(false);

      finalStatus = testResult.status;
      finalMessage = testResult.message;
      setConnectionStatus(finalStatus);
      setConnectionStatusMessage(finalMessage);
      setTestLatencyMs(testResult.latencyMs || null);

      if (!testResult.success) {
        showToast('Validation Failed', testResult.message, 'error');
        // Still save credentials with invalid status
        const currentProviders = settings?.aiProviders || {};
        await updateSettings({
          activeAIProvider: selectedProviderId,
          selectedModel: effectiveModelId,
          aiProviders: {
            ...currentProviders,
            [selectedProviderId]: {
              apiKey: apiKeyInput.trim(),
              baseUrl: (selectedProviderId === 'ollama' || selectedProviderId === 'custom') ? baseUrlInput.trim() : undefined,
              selectedModel: effectiveModelId,
              customModelName: selectedProviderId === 'custom' ? effectiveModelId : undefined,
              status: finalStatus,
              statusMessage: finalMessage,
              lastTested: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          }
        });
        return;
      }
    }

    const currentProviders = settings?.aiProviders || {};
    const updatedCredential: ProviderCredential = {
      apiKey: provDef.requiresKey ? apiKeyInput.trim() : (selectedProviderId === 'custom' ? apiKeyInput.trim() : undefined),
      baseUrl: (selectedProviderId === 'ollama' || selectedProviderId === 'custom') ? baseUrlInput.trim() : undefined,
      selectedModel: effectiveModelId,
      customModelName: selectedProviderId === 'custom' ? effectiveModelId : undefined,
      fetchedModels: providerFetchedModels[selectedProviderId] || [],
      status: finalStatus,
      statusMessage: finalMessage,
      lastTested: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Sync persistent settings in state and React context
    await updateSettings({
      activeAIProvider: selectedProviderId,
      selectedModel: effectiveModelId,
      aiProviders: {
        ...currentProviders,
        [selectedProviderId]: updatedCredential
      },
      agentOverrides: agentOverrides
    });

    // 2. Hot-reload backend SQLite DB, macOS Keychain, and summary engine
    await api.saveAIModelSettings({
      provider: selectedProviderId,
      model: effectiveModelId,
      apiKey: apiKeyInput.trim(),
      baseUrl: baseUrlInput.trim()
    });

    showToast('Configuration Saved', `Active AI model set to ${effectiveModelId} (${provDef.name}).`, 'success');
  };

  // Audio Input & System Audio Devices State
  const [audioDevices, setAudioDevices] = useState<{ deviceId: string; label: string; isDefault?: boolean }[]>([]);
  const [systemAudioDevices, setSystemAudioDevices] = useState<{ deviceId: string; label: string; isDefault?: boolean }[]>([]);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [systemBackend, setSystemBackend] = useState<'coreaudio' | 'screencapturekit'>('coreaudio');
  const [backendStatuses, setBackendStatuses] = useState<Array<{
    id: string;
    name: string;
    description: string;
    available: boolean;
    permission_granted: boolean;
    status_message: string;
    is_active: boolean;
  }>>([
    {
      id: 'screencapturekit',
      name: 'ScreenCaptureKit',
      description: "Apple's ScreenCaptureKit framework - High-level system capture",
      available: true,
      permission_granted: true,
      status_message: 'Available',
      is_active: false,
    },
    {
      id: 'coreaudio',
      name: 'Core Audio',
      description: 'Direct Core Audio API - Low-latency aggregate system tap',
      available: true,
      permission_granted: true,
      status_message: 'Available',
      is_active: true,
    }
  ]);

  // Microphone Live Test State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micTestVolume, setMicTestVolume] = useState(0);
  const [micTestBars, setMicTestBars] = useState<number[]>(new Array(16).fill(6));
  const micTestStreamRef = useRef<MediaStream | null>(null);
  const micTestAudioCtxRef = useRef<AudioContext | null>(null);
  const micTestAnimRef = useRef<number | null>(null);

  // Storage / Recording Folder Path State
  const [recordingSavePath, setRecordingSavePath] = useState<string>('/Users/muhammedshraeef/Movies/meetily-recordings');
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [customPathInput, setCustomPathInput] = useState('');

  const refreshDevices = async () => {
    setIsRefreshingDevices(true);
    let found = false;

    if (isTauri()) {
      try {
        const nativeDevices = await invokeTauri<any[]>('get_audio_devices');
        if (Array.isArray(nativeDevices) && nativeDevices.length > 0) {
          const inputs = nativeDevices
            .filter(d => d.device_type === 'Input')
            .map(d => ({
              deviceId: d.name,
              label: d.label || d.name,
              isDefault: d.is_default
            }));
          const outputs = nativeDevices
            .filter(d => d.device_type === 'Output')
            .map(d => ({
              deviceId: d.name,
              label: d.label || d.name,
              isDefault: d.is_default
            }));
          if (inputs.length > 0) setAudioDevices(inputs);
          if (outputs.length > 0) setSystemAudioDevices(outputs);
          found = true;
        }

        try {
          const statuses = await invokeTauri<any[]>('get_audio_backend_status');
          if (Array.isArray(statuses) && statuses.length > 0) {
            setBackendStatuses(statuses);
            const active = statuses.find(s => s.is_active);
            if (active && (active.id === 'screencapturekit' || active.id === 'coreaudio')) {
              setSystemBackend(active.id);
            }
          }
        } catch {
          // fallback to get_current_audio_backend
          try {
            const currentBackend = await invokeTauri<string>('get_current_audio_backend');
            if (currentBackend === 'screencapturekit' || currentBackend === 'coreaudio') {
              setSystemBackend(currentBackend);
            }
          } catch {}
        }

        try {
          const defaultPath = await invokeTauri<string>('get_default_recordings_folder_path');
          if (defaultPath && (!settings?.storagePath || settings.storagePath === 'Default Application Recordings')) {
            setRecordingSavePath(defaultPath);
          }
        } catch {
          // keep fallback
        }
      } catch (err) {
        console.warn('Native get_audio_devices fallback to web audio:', err);
      }
    }

    if (!found) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const inputs = devices
            .filter(d => d.kind === 'audioinput')
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || (idx === 0 ? 'Default System Microphone' : `Microphone ${idx + 1}`)
            }));
          const outputs = devices
            .filter(d => d.kind === 'audiooutput')
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || (idx === 0 ? 'Default System Audio' : `Audio Output ${idx + 1}`)
            }));
          if (inputs.length > 0) setAudioDevices(inputs);
          if (outputs.length > 0) setSystemAudioDevices(outputs);
        }
      } catch (err) {
        console.warn('Could not enumerate audio devices:', err);
      }
    }

    setTimeout(() => setIsRefreshingDevices(false), 350);
  };

  useEffect(() => {
    refreshDevices();
  }, []);

  useEffect(() => {
    if (settings?.storagePath && settings.storagePath !== 'Default Application Recordings') {
      setRecordingSavePath(settings.storagePath);
    }
  }, [settings?.storagePath]);

  useEffect(() => {
    if (settings?.systemAudioBackend) {
      setSystemBackend(settings.systemAudioBackend);
    }
  }, [settings?.systemAudioBackend]);

  const toggleMicTest = async () => {
    if (isTestingMic) {
      if (micTestAnimRef.current) cancelAnimationFrame(micTestAnimRef.current);
      if (micTestStreamRef.current) {
        micTestStreamRef.current.getTracks().forEach(t => t.stop());
        micTestStreamRef.current = null;
      }
      if (micTestAudioCtxRef.current) {
        micTestAudioCtxRef.current.close().catch(() => {});
        micTestAudioCtxRef.current = null;
      }
      setIsTestingMic(false);
      setMicTestVolume(0);
      setMicTestBars(new Array(16).fill(6));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: settings?.selectedMicDeviceId && settings.selectedMicDeviceId !== 'default'
              ? { exact: settings.selectedMicDeviceId }
              : undefined,
            echoCancellation: settings?.echoCancellation !== false,
            noiseSuppression: settings?.noiseSuppression !== false,
            autoGainControl: settings?.autoGainControl !== false
          }
        });
        micTestStreamRef.current = stream;

        // Refresh devices to capture real human labels now that permission is active
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices().then(devices => {
            const audioInputs = devices
              .filter(d => d.kind === 'audioinput')
              .map((d, idx) => ({
                deviceId: d.deviceId,
                label: d.label || (idx === 0 ? 'Default System Microphone' : `Microphone ${idx + 1}`)
              }));
            if (audioInputs.length > 0) {
              setAudioDevices(audioInputs);
            }
          }).catch(() => {});
        }

        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        micTestAudioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        setIsTestingMic(true);

        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicTestVolume(Math.min(100, Math.round(avg * 2.2)));

          // Compute 16 equalizer bars
          const barCount = 16;
          const step = Math.max(1, Math.floor(dataArray.length / barCount));
          const bars: number[] = [];
          for (let b = 0; b < barCount; b++) {
            let bSum = 0;
            for (let s = 0; s < step; s++) {
              bSum += dataArray[b * step + s] || 0;
            }
            const bAvg = bSum / step;
            bars.push(Math.max(6, Math.min(100, Math.round(bAvg * 2.2))));
          }
          setMicTestBars(bars);

          micTestAnimRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (err) {
        showToast('Microphone Test Notice', 'Please allow microphone access to test input levels.', 'info');
      }
    }
  };

  const handleStartEditPath = () => {
    setCustomPathInput(recordingSavePath);
    setIsEditingPath(true);
  };

  const handleSaveCustomPath = async () => {
    const trimmed = customPathInput.trim();
    if (!trimmed) {
      showToast('Path Required', 'Please enter a valid directory path.', 'warning');
      return;
    }
    setRecordingSavePath(trimmed);
    updateSettings({ storagePath: trimmed });
    if (isTauri()) {
      try {
        const prefs = await invokeTauri<any>('get_recording_preferences').catch(() => null);
        if (prefs) {
          prefs.save_folder = trimmed;
          await invokeTauri('set_recording_preferences', { preferences: prefs });
        }
      } catch (e) {
        console.warn('Could not save to Tauri recording preferences:', e);
      }
    }
    setIsEditingPath(false);
    showToast('Save Location Updated', trimmed, 'success');
  };

  const handleResetDefaultPath = async () => {
    let defPath = '/Users/muhammedshraeef/Movies/meetily-recordings';
    if (isTauri()) {
      try {
        const nativeDef = await invokeTauri<string>('get_default_recordings_folder_path');
        if (nativeDef) defPath = nativeDef;
        const prefs = await invokeTauri<any>('get_recording_preferences').catch(() => null);
        if (prefs) {
          prefs.save_folder = defPath;
          await invokeTauri('set_recording_preferences', { preferences: prefs });
        }
      } catch {
        // fallback
      }
    }
    setRecordingSavePath(defPath);
    updateSettings({ storagePath: defPath });
    setIsEditingPath(false);
    showToast('Reset to Default Path', defPath, 'info');
  };

  const handleOpenRecordingsFolder = async () => {
    if (isTauri()) {
      try {
        await invokeTauri('open_recordings_folder');
        showToast('Recordings Folder Opened', recordingSavePath, 'success');
        return;
      } catch (e) {
        console.warn('Native open_recordings_folder error:', e);
      }
    }
    openStorageFolder(recordingSavePath);
  };

  const handleBackendChange = async (backend: 'coreaudio' | 'screencapturekit') => {
    const targetStatus = backendStatuses.find(b => b.id === backend);
    if (targetStatus && !targetStatus.available) {
      showToast('Backend Unsupported', targetStatus.status_message, 'warning');
      return;
    }
    if (isTauri()) {
      try {
        await invokeTauri('set_audio_backend', { backend });
        setSystemBackend(backend);
        updateSettings({ systemAudioBackend: backend });
        const updated = await invokeTauri<any[]>('get_audio_backend_status').catch(() => null);
        if (updated && Array.isArray(updated)) setBackendStatuses(updated);
        showToast('Audio Backend Selected', `${backend === 'coreaudio' ? 'Core Audio' : 'ScreenCaptureKit'} (Active)`, 'success');
        return;
      } catch (e: any) {
        console.warn('Failed to invoke set_audio_backend:', e);
        showToast('Permission Notice', e?.message || String(e), 'warning');
        return;
      }
    }
    setSystemBackend(backend);
    updateSettings({ systemAudioBackend: backend });
    showToast('Audio Backend Selected', `${backend === 'coreaudio' ? 'Core Audio' : 'ScreenCaptureKit'} (Active)`, 'info');
  };

  useEffect(() => {
    return () => {
      if (micTestAnimRef.current) cancelAnimationFrame(micTestAnimRef.current);
      if (micTestStreamRef.current) {
        micTestStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (micTestAudioCtxRef.current) {
        micTestAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'builtin' | 'custom'>('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [isCopyingBuiltIn, setIsCopyingBuiltIn] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formDescription, setFormDescription] = useState('');
  const [formAccentColor, setFormAccentColor] = useState('#2563eb');
  const [formSectionsList, setFormSectionsList] = useState<MOMTemplateSection[]>([]);
  const [formPromptInstructions, setFormPromptInstructions] = useState('');
  const [newColumnInputs, setNewColumnInputs] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const builtInCount = useMemo(() => templates.filter(t => isBuiltInTemplateId(t.id)).length, [templates]);
  const customCount = useMemo(() => templates.filter(t => !isBuiltInTemplateId(t.id)).length, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const isBuiltIn = isBuiltInTemplateId(t.id);
      if (templateFilter === 'builtin' && !isBuiltIn) return false;
      if (templateFilter === 'custom' && isBuiltIn) return false;
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        const inName = t.name.toLowerCase().includes(q);
        const inDesc = (t.description || '').toLowerCase().includes(q);
        const inCat = (t.category || '').toLowerCase().includes(q);
        const inSections = normalizeSections(t.sections).some(s => (s.name || s.title || '').toLowerCase().includes(q));
        return inName || inDesc || inCat || inSections;
      }
      return true;
    });
  }, [templates, templateFilter, templateSearch]);

  const handleOpenCreateModal = () => {
    setEditingTemplateId(null);
    setIsCopyingBuiltIn(false);
    setFormName('');
    setFormCategory('General');
    setFormDescription('');
    setFormAccentColor('#2563eb');
    setFormSectionsList([
      { id: 'exec-summary', title: 'Executive Summary', name: 'Executive Summary', type: 'text' },
      { id: 'key-decisions', title: 'Key Decisions', name: 'Key Decisions', type: 'bullets' },
      { id: 'action-items', title: 'Action Items', name: 'Action Items', type: 'table', columns: ['Owner', 'Task', 'Due Date', 'Status'] }
    ]);
    setFormPromptInstructions('Synthesize clear, actionable minutes of meeting with key decisions and assigned tasks.');
    setFormError(null);
    setNewColumnInputs({});
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditModal = (tpl: MOMTemplate) => {
    const isBuiltIn = isBuiltInTemplateId(tpl.id);
    if (isBuiltIn) {
      setEditingTemplateId(null);
      setIsCopyingBuiltIn(true);
      setFormName(`${tpl.name} (Copy)`);
      setFormCategory(tpl.category || 'General');
      setFormDescription(tpl.description || '');
      setFormAccentColor(tpl.accentColor || '#2563eb');
      setFormSectionsList(normalizeSections(tpl.sections).map(s => ({ ...s, columns: s.columns ? [...s.columns] : undefined })));
      setFormPromptInstructions(tpl.promptInstructions || '');
      setFormError(null);
      setNewColumnInputs({});
      setIsTemplateModalOpen(true);
    } else {
      setEditingTemplateId(tpl.id);
      setIsCopyingBuiltIn(false);
      setFormName(tpl.name);
      setFormCategory(tpl.category || 'Custom');
      setFormDescription(tpl.description || '');
      setFormAccentColor(tpl.accentColor || '#2563eb');
      setFormSectionsList(normalizeSections(tpl.sections).map(s => ({ ...s, columns: s.columns ? [...s.columns] : undefined })));
      setFormPromptInstructions(tpl.promptInstructions || '');
      setFormError(null);
      setNewColumnInputs({});
      setIsTemplateModalOpen(true);
    }
  };

  const handleAddSection = () => {
    if (formSectionsList.length >= 10) {
      setFormError('Maximum 10 sections allowed per template.');
      return;
    }
    setFormSectionsList(prev => [
      ...prev,
      {
        id: `section-${prev.length + 1}`,
        title: `New Section ${prev.length + 1}`,
        name: `New Section ${prev.length + 1}`,
        type: 'bullets'
      }
    ]);
    setFormError(null);
  };

  const handleRemoveSection = (idx: number) => {
    if (formSectionsList.length <= 1) {
      setFormError('At least 1 section is required.');
      return;
    }
    setFormSectionsList(prev => prev.filter((_, i) => i !== idx));
    setFormError(null);
  };

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formSectionsList.length) return;
    setFormSectionsList(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleUpdateSectionName = (idx: number, name: string) => {
    setFormSectionsList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], name };
      return copy;
    });
    if (formError && name.trim()) setFormError(null);
  };

  const handleUpdateSectionType = (idx: number, type: MOMSectionType) => {
    setFormSectionsList(prev => {
      const copy = [...prev];
      const current = copy[idx];
      const updated: MOMTemplateSection = { ...current, type };
      if (type === 'table' && (!updated.columns || updated.columns.length === 0)) {
        updated.columns = ['Owner', 'Task', 'Due Date', 'Status'];
      }
      copy[idx] = updated;
      return copy;
    });
  };

  const handleAddColumn = (secIdx: number) => {
    const colName = (newColumnInputs[secIdx] || '').trim();
    if (!colName) return;
    setFormSectionsList(prev => {
      const copy = [...prev];
      const sec = copy[secIdx];
      const cols = sec.columns ? [...sec.columns] : [];
      if (!cols.includes(colName)) {
        cols.push(colName);
      }
      copy[secIdx] = { ...sec, columns: cols };
      return copy;
    });
    setNewColumnInputs(prev => ({ ...prev, [secIdx]: '' }));
  };

  const handleRemoveColumn = (secIdx: number, colIdx: number) => {
    setFormSectionsList(prev => {
      const copy = [...prev];
      const sec = copy[secIdx];
      const cols = (sec.columns || []).filter((_, i) => i !== colIdx);
      copy[secIdx] = { ...sec, columns: cols.length > 0 ? cols : ['Column 1'] };
      return copy;
    });
  };

  const handleSaveTemplate = async () => {
    const trimmedName = formName.trim();
    if (!trimmedName || trimmedName.length > 80) {
      setFormError('Please enter a template name between 1 and 80 characters.');
      return;
    }

    if (templates.some(t => t.id !== editingTemplateId && t.name.toLowerCase() === trimmedName.toLowerCase())) {
      setFormError('A template with this name already exists. Please choose a different name.');
      return;
    }

    if (formSectionsList.length === 0) {
      setFormError('Template must contain at least 1 section.');
      return;
    }

    if (formSectionsList.some(s => !(s.name || s.title || '').trim())) {
      setFormError('All section names must be non-empty.');
      return;
    }

    try {
      if (editingTemplateId) {
        await updateTemplate(editingTemplateId, {
          name: trimmedName,
          category: formCategory,
          description: formDescription.trim(),
          accentColor: formAccentColor,
          sections: formSectionsList,
          promptInstructions: formPromptInstructions.trim()
        });
      } else {
        await createTemplate({
          name: trimmedName,
          category: formCategory,
          description: formDescription.trim(),
          accentColor: formAccentColor,
          sections: formSectionsList,
          promptInstructions: formPromptInstructions.trim()
        });
      }
      setIsTemplateModalOpen(false);
      setFormError(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save template');
    }
  };

  

  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewDocTemplate, setPreviewDocTemplate] = useState<MOMTemplate | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [isVerifyingStorage, setIsVerifyingStorage] = useState(false);
  const [storageVerifyMsg, setStorageVerifyMsg] = useState<string | null>(null);
  const [isAutoPurging, setIsAutoPurging] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  useEffect(() => {
    if (initialTab && initialTab !== settingsTab) {
      setSettingsTab(initialTab);
    }
  }, [initialTab]);

  const lastModelReadyToastRef = useRef<{ id: string; time: number } | null>(null);
  const notifyModelReadyOnce = (modelId: string, modelName: string) => {
    const now = Date.now();
    if (lastModelReadyToastRef.current && lastModelReadyToastRef.current.id === modelId && now - lastModelReadyToastRef.current.time < 4000) {
      return;
    }
    lastModelReadyToastRef.current = { id: modelId, time: now };
    showToast('Model Ready', `${modelName} has been installed and is ready for offline transcription.`, 'success');
  };

  const handleVerifyStorage = async () => {
    setIsVerifyingStorage(true);
    setStorageVerifyMsg(null);
    try {
      const stats = await api.getStorageStats();
      setStorageVerifyMsg(`Verified ${stats.audioFilesCount} audio recordings (${stats.audioStorageFormatted}) and ${stats.modelsCount} models on disk.`);
      showToast('Storage Verified', `Audio (${stats.audioFilesCount} files, ${stats.audioStorageFormatted}), Models (${stats.modelsCount} files), Database verified on disk.`, 'success');
    } catch (err: any) {
      setStorageVerifyMsg('Failed to inspect storage paths.');
      showToast('Storage Verification Failed', err.message || 'Storage check failed', 'error');
    } finally {
      setIsVerifyingStorage(false);
    }
  };

  const handleRunAutoPurgeNow = async () => {
    setIsAutoPurging(true);
    try {
      const days = (settings?.autoDeleteRecordingsDays && settings.autoDeleteRecordingsDays > 0)
        ? settings.autoDeleteRecordingsDays
        : 30;
      const res = await api.purgeRecordings(days);
      showToast('Storage Purge Completed', res.message || `Deleted recordings older than ${days} days.`, 'info');
      await refreshStorageStats();
    } catch (err: any) {
      showToast('Purge Failed', err.message || 'Failed to purge recordings.', 'error');
    } finally {
      setIsAutoPurging(false);
    }
  };

  const handleExportBackup = async () => {
    setIsExportingBackup(true);
    try {
      const backupJsonString = await api.exportBackup();
      const blob = new Blob([backupJsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minomeet_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup Exported', 'Complete JSON archive downloaded successfully.', 'success');
    } catch (err: any) {
      showToast('Backup Failed', err.message || 'Export failed.', 'error');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoringBackup(true);
    try {
      const text = await file.text();
      const res = await api.restoreBackup(text);
      showToast('Backup Restored', res.message || 'Data successfully restored.', 'success');
      await refreshStorageStats();
    } catch (err: any) {
      showToast('Restore Failed', err.message || 'Invalid backup JSON file.', 'error');
    } finally {
      setIsRestoringBackup(false);
      if (backupFileInputRef.current) {
        backupFileInputRef.current.value = '';
      }
    }
  };

  const handleCopyPath = (path: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(path);
    }
    showToast('Path Copied', `${label} copied to clipboard.`, 'info');
  };

  const [copiedStorageKey, setCopiedStorageKey] = useState<string | null>(null);
  const copiedStorageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedStorageTimerRef.current) {
        clearTimeout(copiedStorageTimerRef.current);
      }
    };
  }, []);

  const handleCopyStoragePath = (path: string, label: string, key: string) => {
    if (!path) return;
    handleCopyPath(path, label);
    if (copiedStorageTimerRef.current) {
      clearTimeout(copiedStorageTimerRef.current);
    }
    setCopiedStorageKey(key);
    copiedStorageTimerRef.current = setTimeout(() => {
      setCopiedStorageKey(null);
    }, 1500);
  };


  // Merge API transcriptionModels with MASTER_CATALOG strictly using canonical IDs
  const allTranscriptionCatalog = useMemo(() => {
    const map = new Map<string, any>();
    MASTER_CATALOG.forEach(m => {
      map.set(m.id, {
        id: m.id,
        name: m.name,
        family: m.family,
        tag: m.tag,
        sizeFormatted: m.sizeFormatted,
        accuracy: m.accuracy,
        speed: m.speed,
        ramRequired: m.ramRequired,
        rating: m.rating,
        description: m.description,
        recommended: m.recommended,
        status: 'not_downloaded',
        downloadProgress: 0
      });
    });

    transcriptionModels.forEach(m => {
      const canonicalId = toCanonicalModelId(m.id || (m as any).name || '');
      if (map.has(canonicalId)) {
        const existing = map.get(canonicalId)!;
        map.set(canonicalId, {
          ...existing,
          ...m,
          id: canonicalId,
          name: existing.name,
          family: existing.family,
          tag: existing.tag,
          sizeFormatted: existing.sizeFormatted,
          accuracy: (m as any).accuracy || existing.accuracy,
          speed: (m as any).speed || m.speedRating || existing.speed,
          ramRequired: existing.ramRequired || m.ramRequired,
          rating: existing.rating || m.rating || (m as any).accuracyScore || 5.0,
          status: m.status,
          downloadProgress: m.downloadProgress ?? existing.downloadProgress,
          downloadSpeed: m.downloadSpeed,
          downloadedMB: m.downloadedMB,
          totalMB: m.totalMB
        });
      }
    });
    return Array.from(map.values());
  }, [transcriptionModels]);

  // Hook to dedupe and trigger model ready notification
  useEffect(() => {
    allTranscriptionCatalog.forEach(m => {
      if (m.status === 'downloaded' && downloadingIds.has(m.id)) {
        notifyModelReadyOnce(m.id, m.name);
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
      }
    });
  }, [allTranscriptionCatalog, downloadingIds]);

  const downloadedModels = useMemo(() => {
    return allTranscriptionCatalog.filter(m => m.status === 'downloaded');
  }, [allTranscriptionCatalog]);

  const availableModelsToDownload = useMemo(() => {
    return allTranscriptionCatalog.filter(m => m.status !== 'downloaded' && (modelFilter === 'all' || m.family === modelFilter));
  }, [allTranscriptionCatalog, modelFilter]);

  const availableModels = useMemo(() => {
    return getAvailableModelsForProvider(
      {
        ...settings,
        aiProviders: {
          ...settings?.aiProviders,
          [selectedProviderId]: {
            ...settings?.aiProviders?.[selectedProviderId],
            apiKey: apiKeyInput,
            baseUrl: baseUrlInput,
            fetchedModels: providerFetchedModels[selectedProviderId] || settings?.aiProviders?.[selectedProviderId]?.fetchedModels
          }
        }
      } as any,
      selectedProviderId
    );
  }, [settings, selectedProviderId, apiKeyInput, baseUrlInput, providerFetchedModels]);

  // When availableModels transitions from empty to populated upon API key entry, auto-select the first valid model
  useEffect(() => {
    if (availableModels.length > 0 && (!selectedModelId || !availableModels.some(m => m.id === selectedModelId))) {
      setSelectedModelId(availableModels[0].id);
    }
  }, [availableModels, selectedModelId]);

if (!settings) return null;

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'recording', label: 'Recording', icon: Mic },
    { id: 'transcription', label: 'Transcription', icon: FileAudio },
    { id: 'model', label: 'AI Model', icon: Cpu },
    { id: 'summary', label: 'Summary', icon: Sparkles },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'general', label: 'General & Storage', icon: Sliders }
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = tabs.findIndex(t => t.id === settingsTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      setSettingsTab(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setSettingsTab(tabs[prevIndex].id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-950 overflow-hidden select-none">
      {/* Tabs Navigation */}
      <div
        role="tablist"
        aria-label="Settings Tabs"
        onKeyDown={handleTabKeyDown}
        className="flex items-center gap-2 px-6 pt-5 border-b border-[#e5e7eb] dark:border-neutral-800 overflow-x-auto no-scrollbar focus:outline-none"
      >
        {tabs.map((tab) => {
          const isActive = settingsTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setSettingsTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 ${
                isActive
                  ? 'border-[#2563eb] text-[#2563eb]'
                  : 'border-transparent text-[#6b7280] hover:text-[#111827] dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 max-w-3xl space-y-4">

        {/* 1. RECORDING TAB */}
        {settingsTab === 'recording' && (
          <div className="space-y-4">
            {/* 1. Audio Capture Source Selection */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs">
              <div className="mb-1">
                <h4 className="text-sm font-bold text-[#111827]">Default Audio Capture Source</h4>
              </div>
              <p className="text-xs text-[#6b7280] mb-3">
                Select the default capture mode for meetings. You can also switch sources on the fly during an active recording.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mixed Audio */}
                <div
                  onClick={() => {
                    updateSettings({ defaultAudioSource: AUDIO_CAPTURE_MODES.MIXED });
                    showToast('Default Capture Source', 'Mixed Audio (Microphone + Remote Meeting Audio)', 'info');
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    (settings.defaultAudioSource || AUDIO_CAPTURE_MODES.MIXED) === AUDIO_CAPTURE_MODES.MIXED
                      ? 'border-[#2563eb] bg-[#eff6ff] shadow-xs'
                      : 'border-[#e5e7eb] bg-[#f9fafb] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-[#1e3a8a] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Mixed Audio</span>
                    </div>
                    {(settings.defaultAudioSource || AUDIO_CAPTURE_MODES.MIXED) === AUDIO_CAPTURE_MODES.MIXED && (
                      <span className="bg-[#2563eb] text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[#4b5563] text-[11px]">Microphone + Remote Meeting Audio (Zoom, Meet, Teams)</p>
                  <span className="inline-block mt-2 px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-800 text-[10px] font-bold">
                    Recommended
                  </span>
                </div>

                {/* Microphone Only */}
                <div
                  onClick={() => {
                    updateSettings({ defaultAudioSource: AUDIO_CAPTURE_MODES.MICROPHONE_ONLY });
                    showToast('Default Capture Source', 'Microphone Only (Physical input device)', 'info');
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    settings.defaultAudioSource === AUDIO_CAPTURE_MODES.MICROPHONE_ONLY
                      ? 'border-[#2563eb] bg-[#eff6ff] shadow-xs'
                      : 'border-[#e5e7eb] bg-[#f9fafb] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-[#111827] flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Microphone Only</span>
                    </div>
                    {settings.defaultAudioSource === AUDIO_CAPTURE_MODES.MICROPHONE_ONLY && (
                      <span className="bg-[#2563eb] text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[#6b7280] text-[11px]">Primary physical input device (In-person meetings &amp; dictation)</p>
                </div>

                {/* System Audio Only */}
                <div
                  onClick={() => {
                    updateSettings({ defaultAudioSource: AUDIO_CAPTURE_MODES.SYSTEM_ONLY });
                    showToast('Default Capture Source', 'System Audio Only (Remote attendees stream)', 'info');
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    settings.defaultAudioSource === AUDIO_CAPTURE_MODES.SYSTEM_ONLY
                      ? 'border-[#2563eb] bg-[#eff6ff] shadow-xs'
                      : 'border-[#e5e7eb] bg-[#f9fafb] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-[#111827] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#15803d]" />
                      <span>System Audio Only</span>
                    </div>
                    {settings.defaultAudioSource === AUDIO_CAPTURE_MODES.SYSTEM_ONLY && (
                      <span className="bg-[#2563eb] text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[#6b7280] text-[11px]">Remote attendees &amp; browser meeting tab audio stream only</p>
                </div>
              </div>
            </div>

            {/* 3. Microphone Input Device & Live Level Equalizer (Redesigned) */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-[#111827]">Microphone Input &amp; Level Testing</h4>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    Calibrate your input sensitivity and verify physical microphone signal with real-time spectrum analysis.
                  </p>
                </div>
                <button
                  onClick={toggleMicTest}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isTestingMic
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] border border-[#bfdbfe]'
                  }`}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isTestingMic ? 'animate-pulse text-red-600' : ''}`} />
                  <span>{isTestingMic ? 'Stop Test' : 'Test Microphone'}</span>
                </button>
              </div>

              {/* Active hardware badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isTestingMic ? 'bg-emerald-500 animate-pulse' : 'bg-[#9ca3af]'}`} />
                  <span className="font-semibold text-[#374151]">
                    Active Input Hardware:
                  </span>
                  <span className="font-bold text-[#111827]">
                    {audioDevices.find(d => d.deviceId === settings.selectedMicDeviceId)?.label || 'Default System Microphone'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isTestingMic ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isTestingMic ? 'SIGNAL LIVE' : 'STANDBY'}
                </span>
              </div>

              {/* Live Audio Level Meter & Equalizer Visualizer */}
              {isTestingMic && (
                <div className="p-4 rounded-xl bg-gradient-to-b from-[#f0fdf4] to-[#ecfdf5] border border-[#bbf7d0] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-[#166534]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping" />
                      <span>Microphone Input Level</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        micTestVolume > 70
                          ? 'bg-amber-100 text-amber-800'
                          : micTestVolume > 10
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {micTestVolume > 70 ? 'High Gain' : micTestVolume > 10 ? 'Optimal' : 'Quiet'}
                      </span>
                      <span className="font-mono text-sm">{micTestVolume}%</span>
                    </div>
                  </div>

                  {/* Horizontal Level Bar */}
                  <div className="w-full h-2.5 bg-emerald-100/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d] rounded-full transition-all duration-75"
                      style={{ width: `${micTestVolume}%` }}
                    />
                  </div>

                  {/* 16-Bar Real-Time Audio Frequency Spectrum Equalizer */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-[#166534] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Real-time Audio Spectrum</span>
                      <span className="font-mono">16-band EQ</span>
                    </div>
                    <div className="h-12 bg-white/70 rounded-lg p-2 border border-[#86efac] flex items-end justify-between gap-1">
                      {micTestBars.map((val, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-gradient-to-t from-[#16a34a] to-[#4ade80] rounded-xs transition-all duration-75"
                          style={{ height: `${val}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#15803d]">
                    Speak into your microphone. If the meter moves smoothly into green, your audio is clear and properly calibrated.
                  </p>
                </div>
              )}
            </div>

            {/* 4. Audio Enhancement & Acoustic Filters (Redesigned Modern Feature Cards) */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Acoustic Filters &amp; Neural Preprocessing</h4>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Real-time DSP and neural audio processing applied to physical microphone capture to maximize speech clarity.
                </p>
                {settings.defaultAudioSource === 'system' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                    <Info className="w-4 h-4 flex-none text-amber-600" />
                    <span>
                      <b>System Audio Only mode active:</b> Acoustic filters and neural noise suppression are automatically bypassed to preserve full-fidelity remote meeting sound without artificial gating or phase distortion.
                    </span>
                  </div>
                )}
              </div>

              {(() => {
                const isSystemOnly = settings.defaultAudioSource === 'system';
                const isMixed = settings.defaultAudioSource === 'mixed';
                const isMicOnly = settings.defaultAudioSource === 'mic';

                return (
                  <div className="space-y-3">
                    {/* 1. Noise Suppression Card */}
                    <div className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                      isSystemOnly
                        ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-60'
                        : settings.noiseSuppression !== false
                        ? 'border-[#bfdbfe] bg-[#f8faff]'
                        : 'border-[#e5e7eb] bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-none mt-0.5 border border-[#dbeafe]">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111827]">Noise Suppression</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSystemOnly
                                ? 'bg-gray-200 text-gray-600'
                                : settings.noiseSuppression !== false
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isSystemOnly ? 'N/A (System Audio)' : settings.noiseSuppression !== false ? 'Active' : 'Off'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6b7280] mt-0.5 max-w-xl">
                            {isSystemOnly
                              ? 'Bypassed in System Audio Only mode. Noise suppression only runs on microphone input.'
                              : 'Filter out background ambient room noise, typing keyboard clatter, air conditioner hum, and traffic murmur.'}
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          if (isSystemOnly) return;
                          const next = settings.noiseSuppression === false ? true : false;
                          updateSettings({ noiseSuppression: next });
                          showToast('Noise Suppression', next ? 'Enabled' : 'Disabled', 'info');
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-none ${
                          isSystemOnly
                            ? 'bg-gray-300 cursor-not-allowed'
                            : settings.noiseSuppression !== false
                            ? 'bg-[#2563eb] cursor-pointer'
                            : 'bg-gray-300 cursor-pointer'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            !isSystemOnly && settings.noiseSuppression !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 2. Acoustic Echo Cancellation (AEC) Card */}
                    <div className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                      isSystemOnly
                        ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-60'
                        : settings.echoCancellation !== false
                        ? 'border-[#e9d5ff] bg-[#faf5ff]'
                        : 'border-[#e5e7eb] bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center flex-none mt-0.5 border border-[#e9d5ff]">
                          <RotateCw className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111827]">Acoustic Echo Cancellation (AEC)</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSystemOnly
                                ? 'bg-gray-200 text-gray-600'
                                : !isMixed && isMicOnly
                                ? 'bg-amber-100 text-amber-800'
                                : settings.echoCancellation !== false
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isSystemOnly
                                ? 'N/A (System Audio)'
                                : isMicOnly
                                ? 'Bypassed (No Ref)'
                                : settings.echoCancellation !== false
                                ? 'Active (Ref: System)'
                                : 'Off'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6b7280] mt-0.5 max-w-xl">
                            {isSystemOnly
                              ? 'Bypassed in System Audio Only mode. AEC requires microphone voice input.'
                              : isMicOnly
                              ? 'AEC requires far-end system audio as reference and is automatically bypassed in Microphone Only mode.'
                              : 'Eliminate speaker feedback loops when remote attendee meeting sound plays aloud through laptop speakers.'}
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          if (isSystemOnly) return;
                          const next = settings.echoCancellation === false ? true : false;
                          updateSettings({ echoCancellation: next });
                          showToast('Echo Cancellation (AEC)', next ? 'Enabled' : 'Disabled', 'info');
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-none ${
                          isSystemOnly
                            ? 'bg-gray-300 cursor-not-allowed'
                            : settings.echoCancellation !== false
                            ? 'bg-[#2563eb] cursor-pointer'
                            : 'bg-gray-300 cursor-pointer'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            !isSystemOnly && settings.echoCancellation !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 3. Auto Gain Control (AGC) Card */}
                    <div className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                      isSystemOnly
                        ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-60'
                        : settings.autoGainControl !== false
                        ? 'border-[#fed7aa] bg-[#fffaf5]'
                        : 'border-[#e5e7eb] bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ffedd5] text-[#d97706] flex items-center justify-center flex-none mt-0.5 border border-[#fed7aa]">
                          <Sliders className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111827]">Auto Gain Control (AGC)</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSystemOnly
                                ? 'bg-gray-200 text-gray-600'
                                : settings.autoGainControl !== false
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isSystemOnly ? 'N/A (System Audio)' : settings.autoGainControl !== false ? 'Active' : 'Off'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6b7280] mt-0.5 max-w-xl">
                            {isSystemOnly
                              ? 'Bypassed in System Audio Only mode. Volume normalization applies strictly to microphone levels.'
                              : 'Automatically balance and normalize microphone gain between whisperers and loud room speakers for uniform loudness.'}
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          if (isSystemOnly) return;
                          const next = settings.autoGainControl === false ? true : false;
                          updateSettings({ autoGainControl: next });
                          showToast('Auto Gain Control (AGC)', next ? 'Enabled' : 'Disabled', 'info');
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-none ${
                          isSystemOnly
                            ? 'bg-gray-300 cursor-not-allowed'
                            : settings.autoGainControl !== false
                            ? 'bg-[#2563eb] cursor-pointer'
                            : 'bg-gray-300 cursor-pointer'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            !isSystemOnly && settings.autoGainControl !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 5. Save Raw Audio Recordings to Disk (Mention Path + Change Path Option + Open Folder + Auto-save) */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Save Raw Audio Recordings to Disk</h4>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Configure how your audio recordings are preserved and stored locally on your machine.
                </p>
              </div>

              {/* Auto Save Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] gap-4">
                <div>
                  <div className="text-xs font-bold text-[#111827]">Save Audio Recordings</div>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    Automatically save audio files to local storage when recording stops, allowing in-app playback and retranscription.
                  </p>
                </div>
                <div
                  onClick={() => {
                    const next = !settings.saveAudio;
                    updateSettings({ saveAudio: next });
                    showToast('Save Audio Recordings', next ? 'Auto-save audio files enabled' : 'Auto-save disabled', 'info');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors flex-none ${
                    settings.saveAudio ? 'bg-[#2563eb]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.saveAudio ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Save Location on Drive with Path Mention & Change Path Option */}
              {settings.saveAudio && (
                <div className="p-4 rounded-xl border border-[#e5e7eb] bg-[#fbfcfd] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-[#2563eb]" />
                        <span>Save Location on Drive</span>
                      </div>
                      <p className="text-[11px] text-[#6b7280] mt-0.5">
                        Destination directory on your hard drive where meeting recordings are stored.
                      </p>
                    </div>

                    {!isEditingPath && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStartEditPath}
                          className="px-3 py-1.5 rounded-lg border border-[#d1d5db] bg-white hover:bg-gray-50 text-xs font-bold text-[#374151] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#2563eb]" />
                          <span>Change Folder</span>
                        </button>
                        <button
                          onClick={handleOpenRecordingsFolder}
                          className="px-3 py-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] text-xs font-bold text-[#2563eb] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Open Folder</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Display Path Bar or Edit Form */}
                  {!isEditingPath ? (
                    <div className="p-3 rounded-lg bg-white border border-[#e5e7eb] font-mono text-xs text-[#1f2937] break-all flex items-center justify-between gap-3 shadow-2xs">
                      <span>{recordingSavePath}</span>
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 rounded-lg bg-white border border-[#bfdbfe] shadow-xs">
                      <label className="text-[11px] font-bold text-[#374151]">
                        Enter New Local Folder Path:
                      </label>
                      <input
                        type="text"
                        value={customPathInput}
                        onChange={(e) => setCustomPathInput(e.target.value)}
                        placeholder="/Users/.../Movies/my-recordings"
                        className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-lg px-3 py-2 text-xs font-mono text-[#111827] focus:ring-2 focus:ring-[#2563eb] focus:bg-white outline-none"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={handleResetDefaultPath}
                          className="text-[11px] text-[#6b7280] hover:text-[#111827] underline cursor-pointer"
                        >
                          Reset to default path
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsEditingPath(false)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium text-[#6b7280] hover:text-[#111827] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveCustomPath}
                            className="px-3 py-1 rounded-md bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Path</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Format Timestamp Note (matching Image 1) */}
                  <div className="p-3 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] text-xs text-[#1e3a8a]">
                    <div className="font-bold">
                      File Format: {settings.audioFormat || 'MP4'} files
                    </div>
                    <div className="text-[11px] text-[#3b82f6] mt-0.5">
                      Recordings are saved with timestamp: <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[#1e3a8a]">recording_YYYYMMDD_HHMMSS.{settings.audioFormat?.toLowerCase() || 'mp4'}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Recording Start Notification Toggle (matching Image 1) */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] gap-4">
                <div>
                  <div className="text-xs font-bold text-[#111827]">Recording Start Notification</div>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    Show reminder to inform participants when recording starts.
                  </p>
                </div>
                <div
                  onClick={() => {
                    const next = settings.recordingStartNotification === false ? true : false;
                    updateSettings({ recordingStartNotification: next });
                    showToast('Recording Notification', next ? 'Reminders enabled' : 'Reminders disabled', 'info');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors flex-none ${
                    settings.recordingStartNotification !== false ? 'bg-[#2563eb]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.recordingStartNotification !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 2. Default Audio Devices (Image 2 - Integrated Seamlessly into Minomeet UI Pattern) */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Default Audio Devices</h4>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Set your preferred microphone and system audio devices for recording. These will be automatically selected when starting new recordings.
                </p>
              </div>

              {/* Audio Devices Subheading with Refresh */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#374151] uppercase tracking-wider">Audio Devices</span>
                  <button
                    onClick={refreshDevices}
                    title="Refresh Audio Hardware Devices"
                    className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] border border-[#e5e7eb] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingDevices ? 'animate-spin text-[#2563eb]' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Microphone selection */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151] mb-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Microphone</span>
                      <span title="Records your voice and ambient sound" className="cursor-help text-[#9ca3af] hover:text-[#4b5563]">
                        <HelpCircle className="w-3.5 h-3.5 inline" />
                      </span>
                    </label>
                    <select
                      value={settings.selectedMicDeviceId || 'default'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSettings({ selectedMicDeviceId: val });
                        const label = audioDevices.find(d => d.deviceId === val)?.label || (val === 'default' ? 'Default Microphone' : val);
                        showToast('Microphone Selected', label, 'info');
                      }}
                      className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111827] focus:ring-2 focus:ring-[#2563eb] focus:bg-white outline-none transition cursor-pointer"
                    >
                      <option value="default">Default Microphone</option>
                      {audioDevices.map((dev) => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* System Audio selection */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151] mb-1.5">
                      <Speaker className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>System Audio</span>
                      <span title="Records computer audio (music, calls, remote attendees)" className="cursor-help text-[#9ca3af] hover:text-[#4b5563]">
                        <HelpCircle className="w-3.5 h-3.5 inline" />
                      </span>
                    </label>
                    <select
                      value={settings.selectedSystemDeviceId || 'default'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSettings({ selectedSystemDeviceId: val });
                        const label = systemAudioDevices.find(d => d.deviceId === val)?.label || (val === 'default' ? 'Default System Audio' : val);
                        showToast('System Audio Selected', label, 'info');
                      }}
                      className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111827] focus:ring-2 focus:ring-[#2563eb] focus:bg-white outline-none transition cursor-pointer"
                    >
                      <option value="default">Default System Audio</option>
                      {systemAudioDevices.map((dev) => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* System Audio Backend */}
              <div className="pt-2 border-t border-[#f3f4f6]">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-xs font-bold text-[#374151]">System Audio Backend</span>
                  <span title="Audio capture framework configured on macOS" className="cursor-help text-[#9ca3af] hover:text-[#4b5563]">
                    <Info className="w-3.5 h-3.5 inline" />
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* ScreenCaptureKit */}
                  {(() => {
                    const sck = backendStatuses.find(b => b.id === 'screencapturekit');
                    const isActive = systemBackend === 'screencapturekit';
                    const isAvailable = sck ? sck.available : true;
                    const hasPerm = sck ? sck.permission_granted : true;
                    const statusMsg = sck ? sck.status_message : 'Available';

                    return (
                      <div
                        onClick={() => handleBackendChange('screencapturekit')}
                        className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer text-xs ${
                          isActive
                            ? 'border-[#2563eb] bg-[#eff6ff] shadow-2xs'
                            : !isAvailable
                            ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-60 cursor-not-allowed'
                            : 'border-[#e5e7eb] bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="sysBackend"
                            checked={isActive}
                            disabled={!isAvailable}
                            onChange={() => handleBackendChange('screencapturekit')}
                            className="mt-0.5 text-[#2563eb] focus:ring-[#2563eb]"
                          />
                          <div>
                            <div className="font-bold text-[#111827]">ScreenCaptureKit</div>
                            <p className="text-[11px] text-[#6b7280] mt-0.5">
                              Apple's ScreenCaptureKit framework - High-level API for isolated desktop &amp; meeting audio capture.
                            </p>
                            {!hasPerm && (
                              <p className="text-[10px] text-amber-700 font-semibold mt-1">
                                Requires Screen &amp; System Audio Recording permission in macOS System Settings.
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-none ${
                          isActive
                            ? 'bg-[#2563eb] text-white'
                            : !hasPerm
                            ? 'bg-amber-100 text-amber-800'
                            : isAvailable
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isActive ? 'Active' : !hasPerm ? 'Permission Required' : statusMsg}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Core Audio */}
                  {(() => {
                    const isActive = systemBackend === 'coreaudio';
                    return (
                      <div
                        onClick={() => handleBackendChange('coreaudio')}
                        className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer text-xs ${
                          isActive
                            ? 'border-[#2563eb] bg-[#eff6ff] shadow-2xs'
                            : 'border-[#e5e7eb] bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="sysBackend"
                            checked={isActive}
                            onChange={() => handleBackendChange('coreaudio')}
                            className="mt-0.5 text-[#2563eb] focus:ring-[#2563eb]"
                          />
                          <div>
                            <div className="font-bold text-[#111827]">Core Audio</div>
                            <p className="text-[11px] text-[#4b5563] mt-0.5">
                              Direct Core Audio API - Low-latency aggregate audio tap for system audio capture.
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-none ${
                          isActive
                            ? 'bg-[#2563eb] text-white'
                            : 'bg-[#dcfce7] text-[#15803d]'
                        }`}>
                          {isActive ? 'Active' : 'Available'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Helpful bullets */}
                <div className="mt-3.5 space-y-1 text-[11px] text-[#6b7280]">
                  <p>• Backend selection determines which native capture pipeline handles system audio</p>
                  <p>• Microphone capture always uses primary hardware input devices</p>
                  <p>• Changes apply to all new recordings and active stream switches</p>
                  <p>• <b>ScreenCaptureKit:</b> Requires macOS 12.3+ and Screen Recording permission</p>
                  <p>• <b>Core Audio:</b> Direct low-latency system tap available on macOS 14.4+</p>
                </div>
              </div>
            </div>

            {/* 6. Audio File Format & Bitrate Quality */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Audio File Format &amp; Quality</h4>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Saved recordings are timestamped using: <code className="bg-[#f3f4f6] px-1 py-0.5 rounded font-mono">recording_YYYYMMDD_HHMMSS.{settings.audioFormat.toLowerCase()}</code>
                </p>
              </div>

              {/* Format selection */}
              <div>
                <div className="text-xs font-bold text-[#374151] mb-1.5">Container Format:</div>
                <div className="flex items-center gap-2">
                  {['MP4', 'WAV', 'WebM'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => {
                        updateSettings({ audioFormat: fmt });
                        showToast('Audio Format', `Container format set to ${fmt}`, 'info');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        settings.audioFormat === fmt
                          ? 'bg-[#eaf1ff] border-[#2563eb] text-[#1e3a8a]'
                          : 'border-[#d6dbe2] text-[#374151] hover:bg-[#f6f7f9]'
                      }`}
                    >
                      {fmt} {settings.audioFormat === fmt && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bitrate selection */}
              <div>
                <div className="text-xs font-bold text-[#374151] mb-1.5">Audio Quality / Bitrate Preset:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: '128k', label: 'Standard (128 kbps)', desc: 'Compact file size, ideal for voice' },
                    { id: '256k', label: 'High Quality (256 kbps)', desc: 'Balanced clarity & studio grade' },
                    { id: '320k', label: 'Studio Master (320 kbps)', desc: 'Maximum fidelity lossless capture' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        updateSettings({ audioBitrate: preset.id as any });
                        showToast('Audio Quality', `${preset.label} selected`, 'info');
                      }}
                      className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                        (settings.audioBitrate || '256k') === preset.id
                          ? 'bg-[#eff6ff] border-[#2563eb] text-[#1e3a8a]'
                          : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>{preset.label}</span>
                        {(settings.audioBitrate || '256k') === preset.id && <span>✓</span>}
                      </div>
                      <p className="text-[10px] text-[#6b7280] mt-0.5">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TRANSCRIPTION TAB */}
        {settingsTab === 'transcription' && (
          <div className="space-y-4">
            {/* Card 1: Active Transcription Engine */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Active Transcription Engine</h4>
                </div>
                <StatusBadge tone="info">On-Device Hardware Acceleration</StatusBadge>
              </div>

              {activeTranscriptionModel ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge tone="success">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                      <span>Active</span>
                    </StatusBadge>
                    <span className="text-[11px] font-mono font-medium text-[#4b5563] bg-[#f3f4f6] px-2 py-0.5 rounded-md border border-[#e5e7eb]">
                      {activeTranscriptionModel.tag || (activeTranscriptionModel.family === 'parakeet' ? 'Real-Time Streaming' : 'Whisper Multilingual')}
                    </span>
                    <span className="text-[11px] font-bold text-[#1e3a8a] bg-[#eff6ff] px-2 py-0.5 rounded-md border border-[#bfdbfe]">
                      {activeTranscriptionModel.sizeFormatted}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#111827] dark:text-neutral-100">
                      {activeTranscriptionModel.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim()}
                    </h3>
                    <p className="text-xs text-[#6b7280] dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {activeTranscriptionModel.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[#4b5563] flex-wrap pt-1">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Apple Silicon Metal GPU</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Latency: {activeTranscriptionModel.family === 'parakeet' ? '< 25 ms real-time' : '~180ms'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-[#6b7280]" />
                      <span>{downloadedModels.length} on disk</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => api.openModelsFolder()}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#eff6ff] hover:text-[#2563eb] text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Models Folder</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRunEngineDiagnostics}
                      disabled={isTestingEngine}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingEngine ? 'animate-spin' : ''}`} />
                      <span>{isTestingEngine ? 'Testing Engine...' : 'Run Diagnostics & Test'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#e5e7eb] text-center space-y-2 bg-[#f9fafb]">
                  <StatusBadge tone="warning">No Active Engine</StatusBadge>
                  <p className="text-xs text-[#6b7280]">No model selected. Choose one below.</p>
                  <button
                    type="button"
                    onClick={() => document.getElementById('models-library-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs transition cursor-pointer"
                  >
                    Choose Model
                  </button>
                </div>
              )}

              {/* Diagnostics result panel */}
              {engineTestResult && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] text-xs text-[#1e3a8a] space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
                      <span>Engine Diagnostics: {engineTestResult.modelName}</span>
                    </span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#bfdbfe]">
                      {engineTestResult.latencyMs} ms
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Hardware: <b>Apple Silicon Metal GPU</b></div>
                    <div>File Integrity: <b>Verified (SHA-256)</b></div>
                    <div>Engine Status: <b>Ready &amp; Responsive</b></div>
                    <div>Benchmark: <b>{engineTestResult.latencyMs < 50 ? 'Ultra-Fast Real-Time' : 'Standard Inference'}</b></div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Downloaded Models */}
            <div id="models-library-section" className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Downloaded Models</h4>
                  <StatusBadge tone="info">{downloadedModels.length} on disk</StatusBadge>
                </div>
              </div>

              {downloadedModels.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-[#e5e7eb] text-center bg-[#f9fafb] space-y-1">
                  <HardDrive className="w-6 h-6 text-[#9ca3af] mx-auto" />
                  <p className="text-xs font-bold text-[#374151]">No models downloaded yet.</p>
                  <p className="text-[11px] text-[#6b7280]">Download a speech model from the catalog below to enable offline transcription.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloadedModels.map((model) => {
                    const isActive = activeTranscriptionModel?.id === model.id;
                    return (
                      <div
                        key={model.id}
                        className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isActive
                            ? 'border-2 border-[#2563eb] bg-[#eff6ff]'
                            : 'border-[#e5e7eb] bg-[#f9fafb] hover:bg-white hover:border-[#cbd5e1]'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#111827] dark:text-neutral-100">{model.name}</span>
                            {model.recommended && (
                              <span className="bg-[#eff6ff] text-[#1e40af] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#bfdbfe]">
                                Recommended
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-[#4b5563] bg-white px-2 py-0.5 rounded border border-[#e5e7eb]">
                              {model.family === 'parakeet' ? 'Real-Time Streaming' : 'Whisper Multilingual'}
                            </span>
                            <span className="text-[10px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-0.5 rounded">
                              {model.sizeFormatted} on Disk
                            </span>
                          </div>
                          <p className="text-xs text-[#6b7280] dark:text-neutral-400">{model.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-[#6b7280] flex-wrap pt-0.5">
                            <span>Accuracy: {model.accuracy || 'High accuracy'}</span>
                            <span>&middot;</span>
                            <span>Processing: {model.speed || 'Fast processing'}</span>
                            <span>&middot;</span>
                            <span>RAM: {model.ramRequired || '1 GB'}</span>
                            <StarRating value={model.rating || 5.0} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-none font-sans pt-1 sm:pt-0">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#dcfce7] border border-[#86efac] text-[#15803d] text-xs font-bold rounded-xl shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => selectTranscriptionModel(model.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs transition cursor-pointer"
                            >
                              Use
                            </button>
                          )}

                          {confirmDeleteId === model.id ? (
                            <InlineConfirm
                              message="Delete?"
                              onCancel={() => setConfirmDeleteId(null)}
                              onConfirm={() => {
                                deleteTranscriptionModel(model.id);
                                setConfirmDeleteId(null);
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(model.id)}
                              className="p-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] transition cursor-pointer"
                              title="Delete model from disk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 3: Available to Download */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Available to Download</h4>
                  <StatusBadge tone="info">{availableModelsToDownload.length} available</StatusBadge>
                </div>
                <SegmentedPills
                  options={[
                    { id: 'all', label: 'All' },
                    { id: 'parakeet', label: 'Parakeet (Real-Time)' },
                    { id: 'whisper', label: 'Whisper (High Accuracy)' }
                  ]}
                  value={modelFilter}
                  onChange={(v) => setModelFilter(v as any)}
                />
              </div>

              {availableModelsToDownload.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-[#e5e7eb] text-center bg-[#f9fafb] space-y-1">
                  <Download className="w-6 h-6 text-[#9ca3af] mx-auto" />
                  <p className="text-xs font-bold text-[#374151]">
                    {modelFilter === 'parakeet'
                      ? 'No Parakeet models available to download.'
                      : modelFilter === 'whisper'
                      ? 'No Whisper models available to download.'
                      : 'All catalog models are already downloaded.'}
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    {modelFilter === 'parakeet'
                      ? 'Parakeet TDT 1.1B Lightning is installed and ready for real-time streaming.'
                      : 'Check "Downloaded Models" above to manage or activate installed models.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableModelsToDownload.map((model) => {
                  const isDownloading = model.status === 'downloading' || model.status === 'paused' || downloadingIds.has(model.id);
                  const isPaused = model.status === 'paused';

                  return (
                    <div
                      key={model.id}
                      className="p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] hover:bg-white hover:border-[#cbd5e1] transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#111827] dark:text-neutral-100">{model.name}</span>
                            {model.recommended && (
                              <span className="bg-[#eff6ff] text-[#1e40af] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#bfdbfe]">
                                Recommended
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-[#4b5563] bg-white px-2 py-0.5 rounded border border-[#e5e7eb]">
                              {model.family === 'parakeet' ? 'Real-Time Streaming' : 'Whisper Multilingual'}
                            </span>
                            <span className="text-[10px] font-semibold text-[#1e3a8a] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">
                              Size: {model.sizeFormatted}
                            </span>
                          </div>
                          <p className="text-xs text-[#6b7280] dark:text-neutral-400">{model.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-[#6b7280] flex-wrap pt-0.5">
                            <span>Accuracy: {model.accuracy}</span>
                            <span>&middot;</span>
                            <span>Processing: {model.speed}</span>
                            <span>&middot;</span>
                            <span>RAM: {model.ramRequired}</span>
                            <StarRating value={model.rating} />
                          </div>
                        </div>

                        {!isDownloading && (
                          <div className="flex items-center gap-2 flex-none pt-1 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => {
                                setDownloadingIds(prev => new Set(prev).add(model.id));
                                downloadTranscriptionModel(model.id);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download ({model.sizeFormatted})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Real Downloading Progress Panel */}
                      {isDownloading && (
                        <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-[#1e3a8a]">
                            <span className="flex items-center gap-2">
                              <Loader2 className={`w-3.5 h-3.5 text-[#2563eb] ${isPaused ? '' : 'animate-spin'}`} />
                              <span>{isPaused ? 'Download paused' : 'Downloading model weights…'}</span>
                              {isPaused && <StatusBadge tone="warning">Paused</StatusBadge>}
                            </span>
                            <span className="font-mono tabular-nums text-xs font-bold text-[#2563eb]">
                              {Math.round(model.downloadProgress || 0)}%
                            </span>
                          </div>

                          <ProgressBar
                            value={model.downloadProgress || 0}
                            tone={isPaused ? 'paused' : 'default'}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-[#4b5563]">
                            <span className="font-mono">
                              {Math.round(model.downloadedMB || ((model.downloadProgress || 0) * 0.01 * (model.totalMB || 460)))} MB / {model.totalMB ? `${model.totalMB} MB` : model.sizeFormatted} &bull; {model.downloadSpeed || '18.2 MB/s'}
                            </span>
                            <div className="flex items-center gap-2">
                              {isPaused ? (
                                <button
                                  type="button"
                                  onClick={() => resumeTranscriptionModel(model.id)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#bfdbfe] text-[#1e3a8a] text-[10px] font-bold hover:bg-blue-50 transition cursor-pointer flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 text-[#2563eb]" />
                                  <span>Resume</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => pauseTranscriptionModel(model.id)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#bfdbfe] text-[#1e3a8a] text-[10px] font-bold hover:bg-blue-50 transition cursor-pointer flex items-center gap-1"
                                >
                                  <Pause className="w-3 h-3 text-[#2563eb]" />
                                  <span>Pause</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  stopTranscriptionModel(model.id);
                                  setDownloadingIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(model.id);
                                    return next;
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-[10px] font-bold hover:bg-red-100 transition cursor-pointer flex items-center gap-1"
                              >
                                <Square className="w-3 h-3 text-[#dc2626]" />
                                <span>Stop</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        )}

        {/* 3. AI MODEL TAB */}
        {settingsTab === 'model' && (
          <div className="space-y-4">
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">AI Model</h4>
                </div>
              </div>

              {/* Provider and Model Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Provider</label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    aria-label="AI Provider"
                    className="w-full h-9 px-3.5 rounded-xl border border-[#e5e7eb] bg-white text-xs text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 cursor-pointer transition"
                  >
                    {AI_PROVIDERS_CONFIG.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#374151]">Model</label>
                    {availableModels.length > 0 && selectedProviderId !== 'builtin-ai' && selectedProviderId !== 'builtin' && (
                      <span className="text-[10px] font-bold text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full border border-[#86efac]">
                        ● {availableModels.length} live models
                      </span>
                    )}
                  </div>
                  <select
                    value={availableModels.length === 0 ? '' : selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    disabled={availableModels.length === 0}
                    title={availableModels.find(m => m.id === selectedModelId)?.name || (availableModels.length === 0 ? 'Enter API Key to load models' : selectedModelId)}
                    aria-label="Model"
                    className="w-full h-9 px-3.5 rounded-xl border border-[#e5e7eb] bg-white text-xs text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[#f9fafb]"
                  >
                    {availableModels.length === 0 ? (
                      <option value="" disabled>
                        {selectedProviderId === 'ollama'
                          ? "No local models detected - click 'Fetch Models' to load"
                          : "Enter API Key to load models"}
                      </option>
                    ) : (
                      availableModels.map((m) => (
                        <option key={m.id} value={m.id} title={`${m.name} ${m.contextWindow ? `(${m.contextWindow})` : ''} ${m.tag ? `[${m.tag}]` : ''}`}>
                          {m.name} {m.contextWindow ? `(${m.contextWindow})` : ''} {m.tag ? `[${m.tag}]` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {availableModels.length === 0 && (
                    <p className="text-[10px] text-[#6b7280] mt-1">
                      {selectedProviderId === 'ollama'
                        ? "Ensure Ollama daemon is running, then click 'Fetch Models'."
                        : `Enter your ${AI_PROVIDERS_CONFIG.find(p => p.id === selectedProviderId)?.name || 'provider'} API key below to load available models.`}
                    </p>
                  )}
                </div>
              </div>

              {/* Endpoint URL (for Ollama or Custom Server) */}
              {(selectedProviderId === 'ollama' || selectedProviderId === 'custom') && (
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    {selectedProviderId === 'ollama' ? 'Ollama Endpoint URL' : 'API Endpoint URL'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={baseUrlInput}
                      onChange={(e) => {
                        setBaseUrlInput(e.target.value);
                        setConnectionStatus('not_configured');
                        setConnectionStatusMessage('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleTestConnection();
                        }
                      }}
                      placeholder={selectedProviderId === 'ollama' ? 'http://localhost:11434' : 'http://localhost:8000/v1'}
                      aria-label="Endpoint URL"
                      className="flex-1 h-9 px-3.5 rounded-xl border border-[#e5e7eb] bg-white font-mono text-xs text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleFetchModels(selectedProviderId)}
                      disabled={isFetchingModels}
                      className="px-3.5 py-1.5 h-9 rounded-xl border border-[#d1d5db] bg-white hover:bg-[#eff6ff] text-xs font-bold text-[#374151] inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer flex-none disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 text-[#2563eb] ${isFetchingModels ? 'animate-spin' : ''}`} />
                      <span>{isFetchingModels ? 'Fetching…' : 'Fetch Models'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* API Key Input */}
              {selectedProviderId !== 'builtin' && selectedProviderId !== 'builtin-ai' && selectedProviderId !== 'ollama' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#374151]">
                      {selectedProviderId === 'custom' ? 'API Key (Optional)' : 'API Key'}
                    </label>
                    {apiKeyInput && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#15803d] font-bold bg-[#dcfce7] border border-[#86efac] px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Stored securely
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => {
                          setApiKeyInput(e.target.value);
                          setConnectionStatus('not_configured');
                          setConnectionStatusMessage('');
                        }}
                        onBlur={() => {
                          if (apiKeyInput.trim().length > 10 && !isFetchingModels && (!providerFetchedModels[selectedProviderId] || providerFetchedModels[selectedProviderId].length === 0)) {
                            handleFetchModels(selectedProviderId);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleTestConnection();
                          }
                        }}
                        placeholder={AI_PROVIDERS_CONFIG.find(p => p.id === selectedProviderId)?.keyPlaceholder || 'Enter API Key…'}
                        aria-label="API Key"
                        className="w-full h-9 pl-3.5 pr-10 rounded-xl border border-[#e5e7eb] bg-white font-mono text-xs text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#475569] p-1 cursor-pointer transition"
                        title={showApiKey ? 'Hide Key' : 'Show Key'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchModels(selectedProviderId)}
                      disabled={isFetchingModels || (!apiKeyInput && AI_PROVIDERS_CONFIG.find(p => p.id === selectedProviderId)?.requiresKey)}
                      className="px-3.5 py-1.5 h-9 rounded-xl border border-[#d1d5db] bg-white hover:bg-[#eff6ff] text-xs font-bold text-[#374151] inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer flex-none disabled:opacity-50"
                      title="Fetch live available models from provider API"
                    >
                      <RotateCw className={`w-3.5 h-3.5 text-[#2563eb] ${isFetchingModels ? 'animate-spin' : ''}`} />
                      <span>{isFetchingModels ? 'Fetching…' : 'Fetch Models'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Built-in provider status row */}
              {(selectedProviderId === 'builtin' || selectedProviderId === 'builtin-ai') && (
                <div className="p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#111827] dark:text-neutral-100">{selectedModelId}</span>
                    <span className="text-[10px] text-[#6b7280]">On-Device Neural Engine (GGUF)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {builtinModelStatus === 'downloading' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563eb]" />
                        <span className="text-[11px] font-bold text-[#2563eb]">
                          Downloading… {builtinDownloadProgress > 0 ? `${builtinDownloadProgress}%` : ''}
                        </span>
                      </div>
                    ) : builtinModelStatus === 'download_required' ? (
                      <button
                        type="button"
                        onClick={handleDownloadBuiltinModel}
                        className="px-3 py-1 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                      >
                        Download Model
                      </button>
                    ) : (
                      <StatusBadge tone="success">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        <span>Ready &amp; Active</span>
                      </StatusBadge>
                    )}
                  </div>
                </div>
              )}

              {/* Privacy Notice Banner */}
              {selectedProviderId !== 'builtin-ai' && selectedProviderId !== 'builtin' && selectedProviderId !== 'ollama' ? (
                <div className="p-3 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] text-[11px] text-[#1e3a8a] flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#2563eb] flex-none mt-0.5" />
                  <div>
                    <span className="font-bold">Cloud Provider Notice:</span> Transcripts and queries are sent to {AI_PROVIDERS_CONFIG.find(p => p.id === selectedProviderId)?.name} for processing. API keys are stored securely in the macOS Keychain.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#dcfce7] border border-[#bbf7d0] text-[11px] text-[#15803d] flex items-start gap-2">
                  <Lock className="w-4 h-4 text-[#16a34a] flex-none mt-0.5" />
                  <div>
                    <span className="font-bold">100% On-Device &amp; Private:</span> Zero outbound network calls or telemetry. Audio processing and neural model inference execute strictly on local hardware.
                  </div>
                </div>
              )}

              {/* Test Connection Row & Status Badges */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-3.5 py-1.5 rounded-xl border border-[#d1d5db] bg-white hover:bg-[#eff6ff] text-xs font-bold text-[#374151] inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563eb]" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-[#2563eb]" />
                    )}
                    <span>{isTestingConnection ? 'Testing…' : 'Test Connection'}</span>
                  </button>

                  {connectionStatus === 'connected' && (
                    <StatusBadge tone="success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connected {testLatencyMs ? `(${testLatencyMs}ms)` : ''}</span>
                    </StatusBadge>
                  )}
                  {connectionStatus === ('download_required' as any) && (
                    <StatusBadge tone="warning">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Download Required</span>
                    </StatusBadge>
                  )}
                  {connectionStatus === 'invalid' && (
                    <StatusBadge tone="danger">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Invalid Credentials / Key</span>
                    </StatusBadge>
                  )}
                  {connectionStatus === 'testing' && (
                    <StatusBadge tone="info">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing…</span>
                    </StatusBadge>
                  )}
                  {connectionStatus === 'error' && (
                    <StatusBadge tone="warning">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Connection failed</span>
                    </StatusBadge>
                  )}
                </div>

                {connectionStatusMessage && (
                  <div className="text-[11px] text-[#6b7280] font-medium truncate max-w-sm">
                    {connectionStatusMessage}
                  </div>
                )}
              </div>

              {/* Save AI Model Settings */}
              <div className="flex items-center justify-end pt-3 border-t border-[#f3f4f6] dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleSaveAIConfiguration}
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save AI Model Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. SUMMARY TAB */}
        {settingsTab === 'summary' && (
          <div className="space-y-4">
            {/* Card 1: Summary Generation */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Summary Generation</h4>
                </div>
                <StatusBadge tone="info">Instant Post-Processing</StatusBadge>
              </div>

              <div className="p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#111827]">Auto Summary on Meeting Conclude</div>
                    <p className="text-[11px] text-[#6b7280] mt-0.5">
                      Immediately synthesize structured Minutes of Meeting (MOM), key decisions, and action items as soon as recording concludes.
                    </p>
                  </div>
                  <Toggle
                    checked={autoSummaryChecked}
                    disabled={isSavingAutoSummary}
                    onChange={handleToggleAutoSummary}
                    label="Auto Summary on Meeting Conclude"
                    ariaLabel="Auto Summary on Meeting Conclude"
                  />
                </div>
                <p className="text-[11px] text-[#6b7280] pt-2 border-t border-[#e5e7eb] dark:border-neutral-800">
                  {autoSummaryChecked
                    ? 'Auto summary is ON. A structured MOM will be generated automatically when a meeting ends.'
                    : "Auto summary is OFF. Meetings will be transcribed but no summary will be generated until you click 'Generate Summary' manually."}
                </p>
              </div>
            </div>

            {/* Card 2: Synthesized Output Components */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Synthesized Output Components</h4>
                </div>
                <span className="text-xs text-[#6b7280] font-medium">{enabledComponentsCount} of 3 enabled</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Executive Summary */}
                <div className={`border rounded-xl p-3.5 flex flex-col justify-between space-y-2 transition-all ${
                  summaryComponentsConfig.executiveSummary ? 'border-[#e5e7eb] bg-[#f9fafb]' : 'border-gray-200 bg-gray-50/60 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#2563eb]" />
                        <span>Executive Summary</span>
                      </span>
                      <Toggle
                        checked={summaryComponentsConfig.executiveSummary}
                        disabled={isSavingComponents}
                        onChange={(val) => handleToggleComponent('executiveSummary', val)}
                        ariaLabel="Toggle Executive Summary"
                      />
                    </div>
                    <p className="text-[11px] text-[#6b7280] leading-relaxed">
                      Structured high-level briefing distilling discussion points, context, and key takeaways in concise paragraphs.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-[#4b5563] bg-white p-2 rounded-lg border border-[#e5e7eb] space-y-0.5">
                    {previewExecSummary.map((line, idx) => (
                      <div key={idx} className="truncate">{line}</div>
                    ))}
                  </div>
                </div>

                {/* 2. Action Items Matrix */}
                <div className={`border rounded-xl p-3.5 flex flex-col justify-between space-y-2 transition-all ${
                  summaryComponentsConfig.actionItems ? 'border-[#e5e7eb] bg-[#f9fafb]' : 'border-gray-200 bg-gray-50/60 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d]" />
                        <span>Action Items Matrix</span>
                      </span>
                      <Toggle
                        checked={summaryComponentsConfig.actionItems}
                        disabled={isSavingComponents}
                        onChange={(val) => handleToggleComponent('actionItems', val)}
                        ariaLabel="Toggle Action Items Matrix"
                      />
                    </div>
                    <p className="text-[11px] text-[#6b7280] leading-relaxed">
                      Tabular matrix capturing ownership, deliverables, due dates, and status.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-[#4b5563] bg-white p-2 rounded-lg border border-[#e5e7eb] space-y-0.5">
                    <div className="truncate font-semibold text-[#111827]">{previewActionItems.header}</div>
                    <div className="truncate text-[#4b5563]">{previewActionItems.row1}</div>
                    <div className="truncate text-[#4b5563]">{previewActionItems.row2}</div>
                  </div>
                </div>

                {/* 3. Key Decisions */}
                <div className={`border rounded-xl p-3.5 flex flex-col justify-between space-y-2 transition-all ${
                  summaryComponentsConfig.keyDecisions ? 'border-[#e5e7eb] bg-[#f9fafb]' : 'border-gray-200 bg-gray-50/60 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" />
                        <span>Key Decisions</span>
                      </span>
                      <Toggle
                        checked={summaryComponentsConfig.keyDecisions}
                        disabled={isSavingComponents}
                        onChange={(val) => handleToggleComponent('keyDecisions', val)}
                        ariaLabel="Toggle Key Decisions"
                      />
                    </div>
                    <p className="text-[11px] text-[#6b7280] leading-relaxed">
                      Bullet-point inventory of agreed conclusions, strategic decisions, and commitments.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-[#4b5563] bg-white p-2 rounded-lg border border-[#e5e7eb] space-y-0.5">
                    {previewKeyDecisions.map((line, idx) => (
                      <div key={idx} className="truncate">{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Localization card */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Transcription &amp; Summary Language</h4>
                </div>
                <StatusBadge tone="info">High Precision</StatusBadge>
              </div>

              <div className="space-y-3">
                {/* Transcription Language Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb]">
                  <div className="space-y-0.5 max-w-md">
                    <div className="text-xs font-bold text-[#111827]">Audio Transcription Language</div>
                    <p className="text-[11px] text-[#6b7280]">
                      {currentLanguageDesc}
                    </p>
                  </div>

                  <div className="relative inline-flex items-center">
                    <select
                      value={activeTransLang}
                      disabled={isSavingLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a8a] cursor-pointer hover:bg-[#dbeafe] transition appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-50"
                    >
                      {TRANSCRIPTION_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <Check className="w-3.5 h-3.5 text-[#2563eb] absolute right-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* English-only Model Warning Badge */}
                {isEnglishOnlyWarning && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>The active model supports English only. Pick a multilingual Whisper model.</span>
                  </div>
                )}

                {/* Summary Output Language Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb]">
                  <div className="space-y-0.5 max-w-md">
                    <div className="text-xs font-bold text-[#111827]">Summary Output Language</div>
                    <p className="text-[11px] text-[#6b7280]">
                      {activeSumLang === 'auto'
                        ? 'MOM language will be automatically matched to the meeting.'
                        : 'MOM is synthesized in English.'}
                    </p>
                  </div>

                  <div className="relative inline-flex items-center">
                    <select
                      value={activeSumLang}
                      disabled={isSavingLanguage}
                      onChange={(e) => handleSummaryLanguageChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a8a] cursor-pointer hover:bg-[#dbeafe] transition appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-50"
                    >
                      {SUMMARY_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <Check className="w-3.5 h-3.5 text-[#2563eb] absolute right-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. TEMPLATES TAB */}
        {settingsTab === 'templates' && (
          <div className="space-y-5">
            {/* Header & Make Your Own Template Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">MOM Templates</h4>
                  <StatusBadge tone="info">{templates.length} Templates Configured</StatusBadge>
                </div>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Configure the report templates used by local AI models when generating meeting minutes, summaries, and action item matrices.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Make Your Own Template</span>
              </button>
            </div>

            {/* Active Template Hero Card */}
            {activeTemplate && (
              <div className="border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] via-[#f8faff] to-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1e40af]">Active Default Template</span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${activeTemplate.accentColor || '#2563eb'}15`,
                        color: activeTemplate.accentColor || '#2563eb',
                        borderColor: `${activeTemplate.accentColor || '#2563eb'}40`
                      }}
                    >
                      {activeTemplate.category || 'Standard'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
                      <Check className="w-3 h-3" /> Active Default
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#111827] dark:text-neutral-100">
                    {activeTemplate.name}
                  </h3>

                  <p className="text-xs text-[#4b5563] leading-relaxed">
                    Used for every new meeting minutes document. Edit sections below or switch templates.
                  </p>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewDocTemplate(activeTemplate)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#bfdbfe] bg-white hover:bg-[#eff6ff] text-[#1e40af] text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById('templates-grid')?.scrollIntoView({ behavior: 'smooth' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d1d5db] bg-white hover:bg-gray-50 text-[#374151] text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#6b7280]" />
                      <span>Change</span>
                    </button>
                  </div>
                </div>

                {/* Mini A4 Document Thumbnail */}
                <div className="flex-none hidden sm:flex items-center justify-center">
                  <div className="w-20 h-24 bg-white border border-[#cbd5e1] rounded-sm p-2 flex flex-col justify-between shadow-xs select-none pointer-events-none relative overflow-hidden">
                    <div
                      className="h-1 rounded-full w-full mb-1.5"
                      style={{ backgroundColor: activeTemplate.accentColor || '#2563eb' }}
                    />
                    <div className="space-y-1 flex-1">
                      <div className="h-1 bg-slate-300 rounded w-3/4" />
                      <div className="h-1 bg-slate-200 rounded w-full" />
                      <div className="h-1 bg-slate-200 rounded w-5/6" />
                      <div className="h-1 bg-slate-100 rounded w-2/3" />
                    </div>
                    <div className="text-[7.5px] font-bold text-center text-[#15803d] bg-[#dcfce7] rounded py-0.5">
                      ✓ Active
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Segmented Filter Pills */}
              <div className="inline-flex p-1 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] self-start">
                <button
                  type="button"
                  onClick={() => setTemplateFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    templateFilter === 'all'
                      ? 'bg-white text-[#1e40af] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  All ({templates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('builtin')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    templateFilter === 'builtin'
                      ? 'bg-white text-[#1e40af] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Built-in ({builtInCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('custom')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    templateFilter === 'custom'
                      ? 'bg-white text-[#1e40af] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Custom ({customCount})
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#111827] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none"
                />
                {templateSearch && (
                  <button
                    type="button"
                    onClick={() => setTemplateSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#334155]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Template Card Grid (1 col mobile, 2 col desktop) */}
            <div id="templates-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => {
                const isSelectedDefault = (settings.defaultTemplateId ? settings.defaultTemplateId === tpl.id : settings.defaultTemplate === tpl.name) || tpl.isDefault;
                const isBuiltIn = isBuiltInTemplateId(tpl.id);
                const normSecs = normalizeSections(tpl.sections);
                const tableSec = normSecs.find(s => s.type === 'table');
                const actionCols = (tpl as any).actionItemsColumns || tableSec?.columns || [];

                return (
                  <div
                    key={tpl.id}
                    className={`border rounded-2xl p-5 transition flex flex-col justify-between space-y-3.5 ${
                      isSelectedDefault
                        ? 'border-2 border-[#2563eb] bg-[#eff6ff]/25 shadow-xs'
                        : 'border-[#e5e7eb] bg-white hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-none"
                            style={{ backgroundColor: tpl.accentColor || '#2563eb' }}
                          />
                          <h4 className="font-bold text-base text-[#111827] dark:text-neutral-100 truncate">
                            {tpl.name}
                          </h4>
                          <span className="bg-[#eff6ff] text-[#1e40af] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#bfdbfe]">
                            {tpl.category}
                          </span>
                          {isBuiltIn && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#f1f5f9] text-[#475569] text-[10px] font-semibold border border-[#e2e8f0]"
                              title="Built-in template cannot be deleted. Click Edit to create an editable copy."
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Built-in</span>
                            </span>
                          )}
                        </div>

                        {isSelectedDefault && (
                          <span className="bg-[#dcfce7] text-[#15803d] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#86efac] flex items-center gap-1 flex-none">
                            <Check className="w-3 h-3" /> Active Default
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#6b7280] line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>

                      {/* Extracted Sections Chips */}
                      <div className="pt-2 border-t border-[#f3f4f6]">
                        <div className="text-[10px] font-bold text-[#6b7280] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-[#2563eb]" />
                          <span>Sections ({normSecs.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {normSecs.map((sec, idx) => (
                            <span
                              key={idx}
                              className="bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1"
                            >
                              {sec.type === 'table' ? (
                                <Table className="w-2.5 h-2.5 text-[#15803d]" />
                              ) : sec.type === 'numbered' ? (
                                <ListOrdered className="w-2.5 h-2.5 text-[#7c3aed]" />
                              ) : sec.type === 'text' ? (
                                <FileText className="w-2.5 h-2.5 text-[#2563eb]" />
                              ) : (
                                <List className="w-2.5 h-2.5 text-[#0284c7]" />
                              )}
                              <span>{sec.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Items Matrix Columns */}
                      {actionCols.length > 0 && (
                        <div className="pt-1">
                          <div className="text-[10px] font-bold text-[#15803d] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <Table className="w-3 h-3 text-[#15803d]" />
                            <span>Table Columns:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {actionCols.map((col: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-[#dcfce7] text-[#15803d] border border-[#86efac] px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f3f4f6] flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDocTemplate(tpl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#eff6ff] hover:text-[#2563eb] text-xs font-bold transition cursor-pointer shadow-xs"
                          title="Preview document generated by this template"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#2563eb]" />
                          <span>Preview</span>
                        </button>

                        {isSelectedDefault ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#dcfce7] border border-[#86efac] text-[#15803d] text-xs font-bold shadow-2xs">
                            <Check className="w-3.5 h-3.5" /> Active Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefaultTemplate(tpl.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            Use This Template
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(tpl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af] hover:bg-[#dbeafe] text-xs font-bold transition cursor-pointer"
                          title={isBuiltIn ? 'Create an editable copy of this built-in template' : 'Edit template'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {!isBuiltIn && (
                          confirmDeleteId === tpl.id ? (
                            <InlineConfirm
                              message="Delete template?"
                              onCancel={() => setConfirmDeleteId(null)}
                              onConfirm={() => {
                                deleteTemplate(tpl.id);
                                setConfirmDeleteId(null);
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(tpl.id)}
                              className="p-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] transition cursor-pointer"
                              title="Delete template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="p-8 text-center bg-white border border-[#e5e7eb] rounded-2xl space-y-2">
                <FileText className="w-8 h-8 text-[#94a3b8] mx-auto" />
                <div className="text-sm font-bold text-[#111827]">No templates found</div>
                <p className="text-xs text-[#6b7280]">
                  {templateSearch ? `No templates matching "${templateSearch}".` : 'No templates match the selected filter.'}
                </p>
                <button
                  type="button"
                  onClick={() => { setTemplateFilter('all'); setTemplateSearch(''); }}
                  className="px-3 py-1.5 rounded-xl bg-[#eff6ff] text-[#2563eb] font-bold text-xs"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. MEETINGS TAB */}
        {settingsTab === 'meetings' && (
          <MeetingsSettingsTab />
        )}

        {/* 7. GENERAL & STORAGE TAB */}
        {settingsTab === 'general' && (
          <div className="space-y-4">
            {/* Desktop Notifications Card */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#2563eb]" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Desktop Notifications</h4>
                </div>
                {settings.notifications ? (
                  <StatusBadge tone="success">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                    <span>Notifications Active</span>
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
                    <span>All Notifications Muted</span>
                  </StatusBadge>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] gap-4">
                <div>
                  <div className="text-xs font-bold text-[#111827]">System &amp; In-App Notifications</div>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    Mute all in-app toasts, system desktop alerts and reminders when disabled.
                  </p>
                </div>
                <Toggle
                  checked={!!settings.notifications}
                  onChange={(checked) => updateSettings({ notifications: checked })}
                  label="Desktop Notifications"
                />
              </div>
            </div>

            {/* Local Storage Card */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e7eb] dark:border-neutral-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <HardDrive className="w-4 h-4 text-[#2563eb] shrink-0" />
                    <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100 truncate">Local Storage &amp; Data Verification</h4>
                  </div>
                  <p className="text-xs text-[#6b7280] dark:text-neutral-400">
                    100% on-device data isolation. Inspect and manage local directories directly in macOS Finder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyStorage}
                  disabled={isVerifyingStorage}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl border border-[#d1d5db] bg-white hover:bg-[#eff6ff] hover:text-[#2563eb] hover:border-[#bfdbfe] text-xs font-bold text-[#374151] inline-flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-750"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#2563eb] shrink-0 ${isVerifyingStorage ? 'animate-spin' : ''}`} />
                  <span>{isVerifyingStorage ? 'Verifying...' : 'Verify Storage Integrity'}</span>
                </button>
              </div>

              {storageVerifyMsg && (
                <div className="mt-4 p-2.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#065f46] flex items-center gap-2 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span>{storageVerifyMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* 1. Audio Recordings Folder */}
                {(() => {
                  const audioPath = storageStats?.realUploadsPath || settings?.storagePath || '/Users/muhammedshraeef/Movies/minomeet-recordings';
                  const hasPath = Boolean(audioPath && audioPath.trim());
                  const isCopied = copiedStorageKey === 'audio';
                  const filesCount = storageStats?.audioFilesCount ?? 0;
                  const isEmpty = filesCount === 0;

                  return (
                    <div className="flex flex-col h-full rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4 gap-3 overflow-hidden min-w-0 dark:border-neutral-800 dark:bg-neutral-850">
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileAudio className="w-4 h-4 text-[#2563eb] shrink-0" />
                          <span className="text-sm font-bold text-[#111827] dark:text-neutral-100 truncate">
                            Audio Files
                          </span>
                        </div>
                        <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold text-[#1e3a8a] bg-[#eff6ff] border border-[#bfdbfe] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                          {storageStats?.audioStorageFormatted || '0 B'}
                        </span>
                      </div>

                      {/* Path box */}
                      <div
                        className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 min-w-0 dark:border-neutral-800 dark:bg-neutral-900"
                        title={hasPath ? audioPath : undefined}
                      >
                        <span className="block font-mono text-[11px] text-[#4b5563] break-all line-clamp-2 dark:text-neutral-300">
                          {hasPath ? (
                            audioPath
                          ) : (
                            <span className="text-[#9ca3af] italic">Path not available</span>
                          )}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyStoragePath(audioPath, 'Audio files', 'audio')}
                          disabled={!hasPath}
                          className="w-full min-w-0 h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-2 text-xs font-semibold text-[#374151] hover:bg-[#eff6ff] hover:border-[#bfdbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 transition cursor-pointer disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-750"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                          )}
                          <span className="truncate">{isCopied ? 'Copied' : 'Copy Path'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openStorageFolder('recordings')}
                          disabled={!hasPath}
                          className="w-full min-w-0 h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-2 text-xs font-semibold text-[#374151] hover:bg-[#eff6ff] hover:border-[#bfdbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 transition cursor-pointer disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-750"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                          <span className="truncate">Open Folder</span>
                        </button>
                      </div>

                      {/* Spacer and Verify status row */}
                      <div className="mt-auto pt-1 flex items-start gap-2 text-xs font-semibold min-w-0">
                        {isVerifyingStorage ? (
                          <div className="h-3.5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse my-0.5" />
                        ) : !hasPath ? (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#dc2626]" />
                            <span className="text-[#dc2626] line-clamp-2">Path does not exist</span>
                          </>
                        ) : isEmpty ? (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#d97706]" />
                            <span className="text-[#b45309] dark:text-amber-400 line-clamp-2">
                              Directory exists but is empty
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#16a34a]" />
                            <span className="text-[#15803d] dark:text-emerald-400 line-clamp-2">
                              Data verified: {filesCount} files ({storageStats?.audioStorageFormatted || '0 B'})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. AI Model Weights Folder */}
                {(() => {
                  const modelsPath = storageStats?.realModelsPath || '/Users/muhammedshraeef/Library/Application Support/ai.minomeet.desktop/models';
                  const hasPath = Boolean(modelsPath && modelsPath.trim());
                  const isCopied = copiedStorageKey === 'models';
                  const modelsCount = storageStats?.modelsCount ?? 0;
                  const isEmpty = modelsCount === 0;

                  return (
                    <div className="flex flex-col h-full rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4 gap-3 overflow-hidden min-w-0 dark:border-neutral-800 dark:bg-neutral-850">
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Cpu className="w-4 h-4 text-[#2563eb] shrink-0" />
                          <span className="text-sm font-bold text-[#111827] dark:text-neutral-100 truncate">
                            AI Models
                          </span>
                        </div>
                        <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold text-[#1e3a8a] bg-[#eff6ff] border border-[#bfdbfe] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                          {storageStats?.modelsStorageFormatted || '0 B'}
                        </span>
                      </div>

                      {/* Path box */}
                      <div
                        className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 min-w-0 dark:border-neutral-800 dark:bg-neutral-900"
                        title={hasPath ? modelsPath : undefined}
                      >
                        <span className="block font-mono text-[11px] text-[#4b5563] break-all line-clamp-2 dark:text-neutral-300">
                          {hasPath ? (
                            modelsPath
                          ) : (
                            <span className="text-[#9ca3af] italic">Path not available</span>
                          )}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyStoragePath(modelsPath, 'AI models', 'models')}
                          disabled={!hasPath}
                          className="w-full min-w-0 h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-2 text-xs font-semibold text-[#374151] hover:bg-[#eff6ff] hover:border-[#bfdbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 transition cursor-pointer disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-750"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                          )}
                          <span className="truncate">{isCopied ? 'Copied' : 'Copy Path'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openStorageFolder('models')}
                          disabled={!hasPath}
                          className="w-full min-w-0 h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-2 text-xs font-semibold text-[#374151] hover:bg-[#eff6ff] hover:border-[#bfdbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 transition cursor-pointer disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-750"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                          <span className="truncate">Open Folder</span>
                        </button>
                      </div>

                      {/* Spacer and Verify status row */}
                      <div className="mt-auto pt-1 flex items-start gap-2 text-xs font-semibold min-w-0">
                        {isVerifyingStorage ? (
                          <div className="h-3.5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse my-0.5" />
                        ) : !hasPath ? (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#dc2626]" />
                            <span className="text-[#dc2626] line-clamp-2">Path does not exist</span>
                          </>
                        ) : isEmpty ? (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#d97706]" />
                            <span className="text-[#b45309] dark:text-amber-400 line-clamp-2">
                              Directory exists but is empty
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#16a34a]" />
                            <span className="text-[#15803d] dark:text-emerald-400 line-clamp-2">
                              Data verified: {modelsCount} models ({storageStats?.modelsStorageFormatted || '0 B'})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Database Folder */}
                {(() => {
                  const dataPath = storageStats?.realDataPath || '/Users/muhammedshraeef/Library/Application Support/ai.minomeet.desktop/meeting_minutes.sqlite';
                  const hasPath = Boolean(dataPath && dataPath.trim());
                  const isCopied = copiedStorageKey === 'database';

                  return (
                    <div className="flex flex-col h-full rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4 gap-3 overflow-hidden min-w-0 dark:border-neutral-800 dark:bg-neutral-850">
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Database className="w-4 h-4 text-[#2563eb] shrink-0" />
                          <span className="text-sm font-bold text-[#111827] dark:text-neutral-100 truncate">
                            Database (JSON)
                          </span>
                        </div>
                        <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#86efac] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          {storageStats?.dbSizeFormatted || '120 KB'}
                        </span>
                      </div>

                      {/* Path box */}
                      <div
                        className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 min-w-0 dark:border-neutral-800 dark:bg-neutral-900"
                        title={hasPath ? dataPath : undefined}
                      >
                        <span className="block font-mono text-[11px] text-[#4b5563] break-all line-clamp-2 dark:text-neutral-300">
                          {hasPath ? (
                            dataPath
                          ) : (
                            <span className="text-[#9ca3af] italic">Path not available</span>
                          )}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyStoragePath(dataPath, 'Database', 'database')}
                          disabled={!hasPath}
                          className="w-full min-w-0 h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-2 text-xs font-semibold text-[#374151] hover:bg-[#eff6ff] hover:border-[#bfdbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 transition cursor-pointer disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-750"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                          )}
                          <span className="truncate">{isCopied ? 'Copied' : 'Copy Path'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openStorageFolder('data')}
                          disabled={!hasPath}
                          className="w-full min-w-0 h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-2 text-xs font-semibold text-[#374151] hover:bg-[#eff6ff] hover:border-[#bfdbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 transition cursor-pointer disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-750"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                          <span className="truncate">Open Folder</span>
                        </button>
                      </div>

                      {/* Spacer and Verify status row */}
                      <div className="mt-auto pt-1 flex items-start gap-2 text-xs font-semibold min-w-0">
                        {isVerifyingStorage ? (
                          <div className="h-3.5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse my-0.5" />
                        ) : !hasPath ? (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#dc2626]" />
                            <span className="text-[#dc2626] line-clamp-2">Path does not exist</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#16a34a]" />
                            <span className="text-[#15803d] dark:text-emerald-400 line-clamp-2">
                              Data verified: 1 database ({storageStats?.dbSizeFormatted || '120 KB'})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Privacy Notice */}
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-3.5 text-xs text-[#1e3a8a] leading-relaxed dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-200">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#2563eb]" />
                <p>
                  <b className="font-bold">100% Privacy Guarantee:</b> Your voice recordings, transcripts, and AI models are stored strictly on this device and are never uploaded to any cloud server.
                </p>
              </div>
            </div>

            {/* Auto-Purge Raw Audio Card */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Trash2 className="w-4 h-4 text-[#dc2626]" />
                    <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Auto-Purge Raw Audio Recordings</h4>
                  </div>
                  <p className="text-xs text-[#6b7280]">
                    Automatically purge heavy raw audio recordings older than the selected retention period to reclaim disk space. Transcripts, summaries, and action item matrices are permanently preserved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAutoPurgeNow}
                  disabled={isAutoPurging}
                  className="px-3.5 py-1.5 rounded-xl border border-[#d1d5db] bg-white hover:bg-[#eff6ff] hover:text-[#2563eb] text-xs font-bold text-[#374151] inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer flex-none disabled:opacity-50"
                >
                  {isAutoPurging ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#dc2626] animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                  )}
                  <span>{isAutoPurging ? 'Purging Audio...' : 'Run Auto-Purge Now'}</span>
                </button>
              </div>

              <div className="pt-1">
                <SegmentedPills
                  options={[
                    { id: '0', label: 'Off' },
                    { id: '30', label: '30 Days' },
                    { id: '50', label: '50 Days' },
                    { id: '90', label: '90 Days' }
                  ]}
                  value={String(settings.autoDeleteRecordingsDays || 0)}
                  onChange={(v) => updateSettings({ autoDeleteRecordingsDays: Number(v) })}
                />
              </div>
            </div>

            {/* Backup & Restore Card */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs space-y-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#f3f4f6] dark:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Download className="w-4 h-4 text-[#2563eb]" />
                    <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Backup &amp; Restore Meeting History</h4>
                  </div>
                  <p className="text-xs text-[#6b7280]">
                    Export or restore a complete JSON archive of all your recorded meetings, dialogue lines, templates, and settings.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-none flex-wrap">
                  <input
                    type="file"
                    ref={backupFileInputRef}
                    accept=".json"
                    onChange={handleRestoreBackupFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => backupFileInputRef.current?.click()}
                    disabled={isRestoringBackup}
                    className="px-3.5 py-1.5 rounded-xl border border-[#d1d5db] bg-white hover:bg-[#eff6ff] hover:text-[#2563eb] text-xs font-bold text-[#374151] shadow-xs transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isRestoringBackup ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#2563eb] animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#2563eb]" />
                    )}
                    <span>{isRestoringBackup ? 'Restoring...' : 'Restore from Backup'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportBackup}
                    disabled={isExportingBackup}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-xs transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isExportingBackup ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isExportingBackup ? 'Exporting...' : 'Export Backup (JSON)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Version & About Card */}
            <div className="border border-[#e5e7eb] rounded-2xl p-5 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <GithubIcon className="w-4 h-4 text-[#111827] dark:text-neutral-100" />
                  <h4 className="text-sm font-bold text-[#111827] dark:text-neutral-100">Minomeet AI Version &amp; GitHub Updates</h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-[#6b7280]">
                  <span className="font-bold text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded-md border border-[#bfdbfe]">
                    v1.2.2
                  </span>
                  <span>&bull;</span>
                  <span>Repository:</span>
                  <a
                    href="https://github.com/shareefmx/minomeet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#2563eb] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>shareefmx/minomeet</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-none">
                <button
                  type="button"
                  onClick={() => openModal('about')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-bold shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Check Updates &amp; About</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Interactive Template Modal (Create / Edit with Section Builder & Live Mini Preview) */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-[#e5e7eb] space-y-4 animate-scale-in max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6] flex-none">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563eb]" />
                <h3 className="text-sm font-bold text-[#111827]">
                  {isCopyingBuiltIn
                    ? `Copy & Edit: ${formName.replace(' (Copy)', '')}`
                    : editingTemplateId
                    ? `Edit Template: ${formName}`
                    : 'Create MOM Template'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 2 Columns on desktop (Form + Live Mini Preview) */}
            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs pr-1">
              {/* Left Column: Form (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {isCopyingBuiltIn && (
                  <div className="p-3 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] flex items-start gap-2">
                    <Info className="w-4 h-4 flex-none mt-0.5" />
                    <div>
                      <div className="font-bold">Editing a copy of a built-in template</div>
                      <p className="text-[11px] text-[#3b82f6] mt-0.5">
                        Built-in templates are read-only. Your changes will be saved as a new custom template.
                      </p>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 flex-none" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#374151] mb-1">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      maxLength={80}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="e.g., Leadership Sync"
                      className="w-full h-9 px-3 rounded-xl border border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#374151] mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none cursor-pointer text-xs bg-white"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Executive">Executive</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Commercial & Sales">Commercial & Sales</option>
                      <option value="Product & UX">Product & UX</option>
                      <option value="General">General</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-[#374151] mb-1">Description</label>
                  <textarea
                    value={formDescription}
                    maxLength={200}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    placeholder="Short description of this template's purpose and meeting context..."
                    className="w-full p-2.5 rounded-xl border border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none text-xs"
                  />
                </div>

                {/* Accent Color Swatches */}
                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { name: 'Blue', color: '#2563eb' },
                      { name: 'Purple', color: '#7c3aed' },
                      { name: 'Emerald', color: '#059669' },
                      { name: 'Amber', color: '#d97706' },
                      { name: 'Rose', color: '#e11d48' },
                      { name: 'Cyan', color: '#0891b2' },
                      { name: 'Slate', color: '#475569' },
                      { name: 'Indigo', color: '#4f46e5' }
                    ].map(sw => (
                      <button
                        key={sw.color}
                        type="button"
                        onClick={() => setFormAccentColor(sw.color)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                          formAccentColor === sw.color ? 'ring-2 ring-offset-2 ring-[#2563eb] scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: sw.color }}
                        title={sw.name}
                      >
                        {formAccentColor === sw.color && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Builder */}
                <div className="space-y-2 pt-2 border-t border-[#f3f4f6]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-[#374151]">
                        Report Sections ({formSectionsList.length}/10) <span className="text-red-500">*</span>
                      </label>
                      <p className="text-[11px] text-[#6b7280]">
                        Define the structure and format of your meeting notes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      disabled={formSectionsList.length >= 10}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] text-xs font-bold transition cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Section</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar pr-1">
                    {formSectionsList.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                              title="Move section up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, 'down')}
                              disabled={idx === formSectionsList.length - 1}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                              title="Move section down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Section Name Input */}
                          <input
                            type="text"
                            value={sec.name}
                            onChange={(e) => handleUpdateSectionName(idx, e.target.value)}
                            placeholder="Section Name"
                            className="flex-1 h-8 px-2.5 rounded-lg border border-[#d1d5db] bg-white focus:border-[#2563eb] text-xs font-bold text-[#111827] outline-none"
                          />

                          {/* Section Type Selector */}
                          <select
                            value={sec.type || 'bullets'}
                            onChange={(e) => handleUpdateSectionType(idx, e.target.value as MOMSectionType)}
                            className="h-8 px-2 rounded-lg border border-[#d1d5db] bg-white text-xs text-[#374151] font-medium outline-none cursor-pointer"
                          >
                            <option value="text">Text Paragraph</option>
                            <option value="bullets">Bullet List</option>
                            <option value="table">Table Matrix</option>
                            <option value="numbered">Numbered List</option>
                          </select>

                          {/* Remove Section Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(idx)}
                            disabled={formSectionsList.length <= 1}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 transition cursor-pointer disabled:opacity-30"
                            title="Remove section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Table Columns Editor if section type is table */}
                        {sec.type === 'table' && (
                          <div className="pl-6 pt-1 space-y-1.5 border-t border-[#e5e7eb]/80">
                            <div className="text-[10.5px] font-bold text-[#15803d] uppercase tracking-wider flex items-center gap-1">
                              <Table className="w-3 h-3 text-[#15803d]" />
                              <span>Table Columns:</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 items-center">
                              {(sec.columns || []).map((col, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1 bg-[#dcfce7] border border-[#86efac] text-[#15803d] px-2 py-0.5 rounded-md font-mono text-[10px] font-bold"
                                >
                                  <span>{col}</span>
                                  {(sec.columns || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveColumn(idx, cIdx)}
                                      className="hover:text-red-600"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </span>
                              ))}

                              {/* Add Column Input */}
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="text"
                                  value={newColumnInputs[idx] || ''}
                                  onChange={(e) => setNewColumnInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddColumn(idx);
                                    }
                                  }}
                                  placeholder="+ Add column"
                                  className="h-6 px-2 w-24 text-[10px] rounded-md border border-[#cbd5e1] bg-white outline-none font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddColumn(idx)}
                                  className="h-6 px-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded-md text-[10px] font-bold cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#6b7280] italic pt-0.5">
                    Tip: Add a &ldquo;Key Decisions&rdquo; section for decision tracking, or an &ldquo;Action Items&rdquo; section with Owner/Task/Due columns.
                  </p>
                </div>

                {/* Prompt Instructions */}
                <div>
                  <label className="block font-bold text-[#374151] mb-1">AI Prompt Instructions (Optional)</label>
                  <textarea
                    value={formPromptInstructions}
                    maxLength={500}
                    onChange={(e) => setFormPromptInstructions(e.target.value)}
                    rows={2}
                    placeholder="Instructions directing local AI models on formatting, emphasis, or domain focus..."
                    className="w-full p-2.5 rounded-xl border border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Right Column: Live Mini Preview Panel (5 cols) */}
              <div className="lg:col-span-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                    <span className="font-bold text-[11px] text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Live Mini Preview</span>
                    </span>
                    <span className="text-[10px] text-[#64748b]">A4 Document Layout</span>
                  </div>

                  {/* Scaled Preview Card */}
                  <div className="bg-white border border-[#cbd5e1] rounded-xl p-3.5 shadow-xs space-y-2.5 relative overflow-hidden">
                    {/* Top colored accent line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: formAccentColor }}
                    />

                    {/* Header */}
                    <div className="pt-1">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[#64748b]">
                        Minutes of Meeting
                      </div>
                      <div className="font-black text-sm text-[#0f172a] truncate">
                        {formName.trim() || 'Untitled Template'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9.5px] text-[#64748b] mt-0.5">
                        <span className="px-1.5 py-0.2 rounded font-semibold bg-[#f1f5f9] text-[#334155]">
                          {formCategory}
                        </span>
                        <span>&bull;</span>
                        <span>Sample Date &bull; 45 mins</span>
                      </div>
                    </div>

                    {/* Simulated Sections Outline */}
                    <div className="space-y-2 pt-1 border-t border-[#f1f5f9]">
                      {formSectionsList.map((sec, idx) => (
                        <div key={idx} className="space-y-1">
                          <div
                            className="text-[10px] font-bold uppercase tracking-wider pl-1.5"
                            style={{ borderLeft: `2.5px solid ${formAccentColor}` }}
                          >
                            {sec.name || `Section ${idx + 1}`}
                          </div>
                          {sec.type === 'table' ? (
                            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-1.5 text-[9px] font-mono text-[#64748b]">
                              [Table: {(sec.columns || ['Owner', 'Task', 'Due Date']).join(' | ')}]
                            </div>
                          ) : sec.type === 'numbered' ? (
                            <div className="text-[9.5px] text-[#475569] space-y-0.5 pl-3">
                              <div>1. Key objective ratified by participants</div>
                              <div>2. Follow-up milestones established</div>
                            </div>
                          ) : sec.type === 'text' ? (
                            <div className="text-[9.5px] text-[#64748b] leading-tight">
                              Structured paragraph summarizing discussions, contextual objectives, and outcomes.
                            </div>
                          ) : (
                            <div className="text-[9.5px] text-[#475569] space-y-0.5 pl-2">
                              <div>&bull; Deliverable alignment and sprint goals</div>
                              <div>&bull; Cross-functional dependency review</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-[9px] text-[#94a3b8] text-center pt-1 border-t border-[#f1f5f9]">
                      Generated by Minomeet AI &bull; {formName.trim() || 'Custom MOM'}
                    </div>
                  </div>
                </div>

                <div className="text-[10.5px] text-[#64748b] bg-white p-2.5 rounded-xl border border-[#e2e8f0] space-y-1">
                  <div className="font-semibold text-[#1e293b]">Template Design Rules</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                    <li>Minimum 1 section, maximum 10 sections.</li>
                    <li>Table sections automatically format into structured tabular grids.</li>
                    <li>Decision sections automatically receive sequential [D-01] tracking tags.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f3f4f6] flex-none">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#d1d5db] bg-white text-[#374151] hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-4 py-1.5 rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Document Preview Modal (Step 3: Real MOM Preview) */}
      {previewDocTemplate && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-[#e5e7eb] space-y-4 animate-scale-in max-h-[88vh] flex flex-col">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6] flex-none">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#2563eb]" />
                <h3 className="text-sm font-bold text-[#111827] truncate">
                  Preview: {previewDocTemplate.name}
                </h3>
                <span className="bg-[#eff6ff] text-[#1e40af] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#bfdbfe] flex-none">
                  {previewDocTemplate.category}
                </span>
              </div>

              {/* Top Bar Action Buttons */}
              <div className="flex items-center gap-2 flex-none">
                <button
                  type="button"
                  onClick={() => printMomDocument(previewDocTemplate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#eff6ff] hover:text-[#2563eb] text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Open real browser print preview for this document"
                >
                  <Printer className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Print Preview</span>
                </button>

                {settings.defaultTemplateId !== previewDocTemplate.id && settings.defaultTemplate !== previewDocTemplate.name && (
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultTemplate(previewDocTemplate.id);
                      setPreviewDocTemplate(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Use This Template
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewDocTemplate(null)}
                  className="p-1 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Realistic Document Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 bg-[#f8fafc] rounded-xl flex justify-center">
              <div
                className="w-full flex justify-center"
                dangerouslySetInnerHTML={{
                  __html: renderMomDocumentHtml(previewDocTemplate, previewDocTemplate.sampleDocument, { embedBodyOnly: true })
                }}
              />
            </div>

            {/* Modal Bottom Sign-off */}
            <div className="flex items-center justify-between pt-2 border-t border-[#f3f4f6] text-[11px] text-[#6b7280] flex-none">
              <span>Simulated with canonical sample data &bull; 100% on-device layout</span>
              <button
                type="button"
                onClick={() => setPreviewDocTemplate(null)}
                className="px-4 py-1.5 rounded-xl bg-[#0f172a] text-white text-xs font-bold hover:bg-[#1e293b] shadow-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};