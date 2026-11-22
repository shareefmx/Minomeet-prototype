import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMeeting } from '../../context/MeetingContext.js';
import { api, UpdateCheckResult } from '../../services/api';
import {
  REPO_URL,
  RELEASES_URL,
  CHANGELOG_URL,
  AUTHOR_URL,
  buildNewIssueUrl,
  isSafeGithubUrl
} from '../../config/app.js';
import {
  Sparkles,
  X,
  Shield,
  Cpu,
  Calendar,
  CheckCircle2,
  RefreshCw,
  GitBranch,
  Terminal,
  Zap,
  ArrowUpRight,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  HelpCircle,
  Download,
  BookOpen
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const AboutModal: React.FC = () => {
  const { modals, closeModal, showToast } = useMeeting();
  const [appVersion, setAppVersion] = useState<string>('1.2.2');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [copiedSysInfo, setCopiedSysInfo] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [autoUpdateCheck, setAutoUpdateCheck] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('minomeet_client_auto_update_check') === 'true';
    }
    return false;
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    api.getAppVersion().then((v) => setAppVersion(v));
    try {
      const raw = localStorage.getItem('minomeet_client_last_update_check');
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached) {
          setUpdateInfo(cached);
          setHasChecked(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (autoUpdateCheck) {
      api.checkUpdate(false).then((res) => {
        setUpdateInfo(res);
        setHasChecked(true);
      });
    }
  }, [autoUpdateCheck]);

  useEffect(() => {
    if (!modals.about) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeModal('about');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modals.about, closeModal]);

  const handleToggleAutoCheck = (enabled: boolean) => {
    setAutoUpdateCheck(enabled);
    try {
      localStorage.setItem('minomeet_client_auto_update_check', enabled ? 'true' : 'false');
    } catch {}
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const data = await api.checkUpdate(true);
      setUpdateInfo(data);
      setHasChecked(true);

      if (data.state === 'update_available') {
        showToast('New Update Available!', `Minomeet ${data.latestVersion} is available on GitHub.`, 'info');
      } else if (data.state === 'up_to_date') {
        showToast('Up to Date!', `Minomeet v${data.currentVersion} is the latest release.`, 'success');
      } else if (data.state === 'rate_limited') {
        showToast('Update Check', 'GitHub API rate limit reached. Try again later.', 'warning');
      } else if (data.state === 'offline') {
        showToast('Update Check', 'Cannot reach GitHub. Check your network connection.', 'warning');
      }
    } catch (err: any) {
      setHasChecked(true);
      showToast('Update Check Failed', err.message || 'Network error querying GitHub.', 'warning');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleOpenLink = (url: string) => {
    if (isSafeGithubUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const systemInfo = useMemo(() => {
    let osStr = 'Browser';
    let archStr = 'unknown';
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    if (ua.includes('Win')) osStr = 'Windows';
    else if (ua.includes('Linux')) osStr = 'Linux';
    else if (ua.includes('Mac')) osStr = 'macOS';

    return {
      version: appVersion,
      os: osStr,
      arch: archStr,
      stack: 'Vite 6 · React 18 · Express · TypeScript',
      locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US'
    };
  }, [appVersion]);

  const handleCopySystemInfo = () => {
    const text = [
      `### Minomeet Web Client System Diagnostics`,
      `- **Client Version:** v${systemInfo.version}`,
      `- **OS Platform:** ${systemInfo.os}`,
      `- **Stack:** ${systemInfo.stack}`,
      `- **Locale:** ${systemInfo.locale}`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSysInfo(true);
    setTimeout(() => setCopiedSysInfo(false), 2000);
  };

  const newIssueUrl = useMemo(() => {
    return buildNewIssueUrl({
      version: `v${appVersion}`,
      os: systemInfo.os,
      arch: systemInfo.arch
    });
  }, [appVersion, systemInfo]);

  if (!modals.about) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-dialog-title"
      className="fixed inset-0 bg-[#0f1117]/65 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl border border-[#e5e7eb] w-[calc(100vw-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-end px-5 pt-4 pb-0">
          <button
            ref={closeBtnRef}
            onClick={() => closeModal('about')}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            title="Close dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Branding */}
        <div className="px-6 text-center pt-2 pb-4 border-b border-[#f3f4f6]">
          <img
            src="/logo-collapsed.png"
            alt="Minomeet Logo"
            className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-md object-contain ring-4 ring-blue-50"
          />

          <h2 id="about-dialog-title" className="text-2xl font-black text-[#111827] tracking-tight">
            Minomeet AI
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-extrabold text-[#2563eb] bg-[#eff6ff] px-2.5 py-0.5 rounded-lg border border-[#bfdbfe]">
              v{appVersion} Release
            </span>
            <span className="text-xs font-semibold text-[#6b7280]">
              Autonomous On-Device &amp; Cloud AI
            </span>
            <span className="text-xs font-semibold text-[#15803d] bg-[#f0fdf4] px-2 py-0.5 rounded-lg border border-[#bbf7d0]">
              MIT License
            </span>
          </div>

          <p className="text-xs text-[#4b5563] max-w-md mx-auto mt-2.5 leading-relaxed">
            Real-time meeting intelligence, neural transcription, and executive Minutes of Meeting (MOM) that run privately on your machine.
          </p>

          {/* GitHub Live Update Checker Card */}
          <div className="mt-4 p-3.5 rounded-2xl bg-[#fafbfc] border border-[#e5e7eb] max-w-lg mx-auto text-left space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <GithubIcon className="w-4 h-4 text-[#111827] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#111827]">
                    GitHub Release Status
                  </div>
                  <div className="text-[11px] text-[#6b7280]">
                    {checkingUpdate ? (
                      <span className="inline-flex items-center gap-1 text-[#2563eb]">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Querying github.com/shareefmx/Minomeet-prototype…
                      </span>
                    ) : hasChecked && updateInfo ? (
                      updateInfo.state === 'update_available' ? (
                        <span className="text-[#1e40af] font-semibold">
                          Update available: {updateInfo.latestVersion}
                        </span>
                      ) : updateInfo.state === 'up_to_date' ? (
                        <span className="text-[#15803d] font-semibold">
                          Up to date (v{appVersion})
                        </span>
                      ) : updateInfo.state === 'rate_limited' ? (
                        <span className="text-[#d97706]">
                          GitHub limit reached, try again later
                        </span>
                      ) : updateInfo.state === 'no_releases' ? (
                        <span className="text-[#6b7280]">No published releases yet</span>
                      ) : (
                        <span className="text-[#dc2626]">
                          Cannot reach GitHub. Showing last check: {new Date(updateInfo.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      )
                    ) : (
                      <span>Repository: shareefmx/Minomeet-prototype</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer shrink-0 ${
                  checkingUpdate
                    ? 'bg-[#e5e7eb] text-[#6b7280] cursor-not-allowed'
                    : 'bg-[#111827] hover:bg-[#1f2937] text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                <span>{checkingUpdate ? 'Checking…' : 'Check for Updates'}</span>
              </button>
            </div>

            {/* Expanded details when checked */}
            {hasChecked && updateInfo && (
              <div className="pt-2 border-t border-[#e5e7eb] text-xs">
                {updateInfo.state === 'update_available' ? (
                  <div className="p-3 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1e40af] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
                        <span>Update available: {updateInfo.latestVersion}</span>
                      </div>
                      <div className="text-[11px] text-[#3b82f6]">
                        {updateInfo.releaseName || `Minomeet ${updateInfo.latestVersion}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenLink(updateInfo.releaseUrl)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#2563eb] text-white text-[11px] font-bold rounded-lg hover:bg-[#1d4ed8] transition cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>View Release</span>
                    </button>
                  </div>
                ) : updateInfo.state === 'up_to_date' ? (
                  <div className="flex items-center justify-between gap-2 text-[#15803d]">
                    <div className="flex items-center gap-1.5 font-medium text-[11.5px]">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>You are running the latest stable build (v{appVersion}).</span>
                    </div>
                    <span className="text-[10px] text-[#6b7280]">
                      Checked {new Date(updateInfo.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Auto-Check Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#f3f4f6] text-[11px] text-[#6b7280]">
              <span>Check for updates automatically on launch</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoUpdateCheck}
                  onChange={(e) => handleToggleAutoCheck(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2563eb]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="px-6 py-3 bg-[#f8f9fb] border-b border-[#e5e7eb]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <button
              onClick={() => handleOpenLink(REPO_URL)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border border-[#e5e7eb] font-bold text-[#374151] hover:text-[#111827] hover:border-[#cbd5e1] hover:shadow-2xs transition cursor-pointer"
            >
              <GithubIcon className="w-3.5 h-3.5 text-[#111827]" />
              <span>GitHub Repo</span>
              <ArrowUpRight className="w-3 h-3 text-[#9aa2af]" />
            </button>

            <button
              onClick={() => handleOpenLink(RELEASES_URL)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border border-[#e5e7eb] font-bold text-[#374151] hover:text-[#111827] hover:border-[#cbd5e1] hover:shadow-2xs transition cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>Releases</span>
              <ArrowUpRight className="w-3 h-3 text-[#9aa2af]" />
            </button>

            <button
              onClick={() => handleOpenLink(newIssueUrl)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border border-[#e5e7eb] font-bold text-[#374151] hover:text-[#111827] hover:border-[#cbd5e1] hover:shadow-2xs transition cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-[#dc2626]" />
              <span>Issues / Bugs</span>
              <ArrowUpRight className="w-3 h-3 text-[#9aa2af]" />
            </button>

            <button
              onClick={() => handleOpenLink(CHANGELOG_URL)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border border-[#e5e7eb] font-bold text-[#374151] hover:text-[#111827] hover:border-[#cbd5e1] hover:shadow-2xs transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#16a34a]" />
              <span>Changelog</span>
              <ArrowUpRight className="w-3 h-3 text-[#9aa2af]" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="px-6 py-4 space-y-3 border-b border-[#f3f4f6]">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-[#6b7280]">
            Core Architecture &amp; Capabilities
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-[#fafbfc] border border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 font-bold text-[#111827] mb-1">
                <Shield className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>100% Privacy-First</span>
              </div>
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                Audio, transcripts and tokens stay on this device; cloud only if you add an API key.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#fafbfc] border border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 font-bold text-[#111827] mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#7c3aed]" />
                <span>Multi-Model AI</span>
              </div>
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                Built-in Qwen 3.5 4B plus Ollama, OpenAI, Anthropic, Gemini, Groq, OpenRouter, custom.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#fafbfc] border border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 font-bold text-[#111827] mb-1">
                <Zap className="w-3.5 h-3.5 text-[#15803d]" />
                <span>Neural Speech-to-Text</span>
              </div>
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                Parakeet TDT 0.6B default, Whisper models optional.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#fafbfc] border border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 font-bold text-[#111827] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Meetings &amp; Calendar</span>
              </div>
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                Google and Outlook day view, join links, read-only.
              </p>
            </div>
          </div>
        </div>

        {/* How to use Minomeet */}
        <div className="px-6 py-4 border-b border-[#f3f4f6]">
          <div className="p-3.5 rounded-2xl bg-white border border-[#e5e7eb] space-y-2.5">
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#2563eb]" />
                <span className="text-xs font-bold text-[#111827]">How to use Minomeet</span>
              </div>
              {showHowTo ? <ChevronDown className="w-4 h-4 text-[#9ca3af]" /> : <ChevronRight className="w-4 h-4 text-[#9ca3af]" />}
            </button>

            {showHowTo && (
              <div className="pt-2 border-t border-[#f3f4f6] space-y-2.5 text-xs text-[#4b5563]">
                <ol className="space-y-2 list-decimal list-inside text-[11.5px] leading-relaxed">
                  <li><strong>Finish first-time setup:</strong> Download on-device neural models in Onboarding or Settings.</li>
                  <li><strong>Connect your calendar:</strong> Go to Meetings and sign in to Google Calendar or Outlook (optional).</li>
                  <li><strong>Start recording or join:</strong> Use "Start Recording" for in-person audio or "Record &amp; Join" right from Meetings.</li>
                  <li><strong>Review Minutes of Meeting:</strong> Open Notes to review summary, decisions, and action items. Choose templates in Settings &gt; Templates.</li>
                  <li><strong>Export and Query:</strong> Export high-fidelity PDF, Word or Markdown, or ask questions with "Ask Your Meetings".</li>
                </ol>
                <div className="p-2 rounded-xl bg-[#fafbfc] border border-[#e5e7eb] text-[10.5px] text-[#6b7280]">
                  💡 <em>Everything works offline except model downloads, calendar sync and cloud AI providers.</em>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="px-6 py-4 border-b border-[#f3f4f6]">
          <div className="p-3.5 rounded-2xl bg-[#f8f9fb] border border-[#e5e7eb] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#111827] flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5 text-[#2563eb]" /> System Information
              </span>
              <button
                onClick={handleCopySystemInfo}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-[#e5e7eb] rounded-lg text-[11px] font-semibold text-[#374151] transition cursor-pointer shadow-2xs"
                title="Copy sanitized system info"
              >
                {copiedSysInfo ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-[#6b7280]" />}
                <span>{copiedSysInfo ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px] font-mono text-[#4b5563] pt-1">
              <div><span className="text-[#6b7280] font-sans">Client Version:</span> v{systemInfo.version}</div>
              <div><span className="text-[#6b7280] font-sans">Platform:</span> {systemInfo.os}</div>
              <div className="col-span-2 truncate"><span className="text-[#6b7280] font-sans">Stack:</span> {systemInfo.stack}</div>
              <div><span className="text-[#6b7280] font-sans">Locale:</span> {systemInfo.locale}</div>
            </div>
          </div>
        </div>

        {/* Stack & Runtime */}
        <div className="px-6 py-3.5">
          <div className="p-3 rounded-2xl bg-[#fafbfc] border border-[#e5e7eb] text-[11px] text-[#4b5563] space-y-1 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6b7280] font-sans font-bold flex items-center gap-1">
                <Terminal className="w-3 h-3 text-[#2563eb]" /> Stack &amp; Runtime:
              </span>
              <span className="font-semibold text-[#111827]">Vite · React 18 · Express · TypeScript</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6b7280] font-sans font-bold">Repository:</span>
              <button
                onClick={() => handleOpenLink(REPO_URL)}
                className="text-[#2563eb] hover:underline cursor-pointer"
              >
                github.com/shareefmx/Minomeet-prototype
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-auto px-6 py-3 bg-[#fafbfc] border-t border-[#e5e7eb] flex items-center justify-center text-xs text-[#6b7280]">
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <span>Crafted by</span>
            <button
              onClick={() => handleOpenLink(AUTHOR_URL)}
              className="font-bold text-[#111827] hover:text-[#2563eb] transition cursor-pointer"
            >
              @shareefmx
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
