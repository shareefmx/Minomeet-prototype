import React, { useEffect, useRef } from 'react';
import { useMeeting } from '../../context/MeetingContext.js';
import { Calendar, X, Loader2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

export const ConnectCalendarModal: React.FC = () => {
  const {
    modals,
    closeModal,
    calendarSignInState,
    startCalendarSignIn,
    cancelCalendarSignIn,
    calendarProvidersConfig
  } = useMeeting();

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape & trap focus
  useEffect(() => {
    if (!modals.connectCalendar) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal('connectCalendar');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modals.connectCalendar, closeModal]);

  if (!modals.connectCalendar) return null;

  const isAuthorizing = calendarSignInState.status === 'authorizing';
  const hasError = calendarSignInState.status === 'error';
  const errorMessage = calendarSignInState.error;
  const currentProvider = calendarSignInState.provider;

  return (
    <div
      className="fixed inset-0 bg-[#0f1117]/65 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAuthorizing) {
          closeModal('connectCalendar');
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-calendar-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] w-[calc(100vw-2rem)] max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 p-5 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb] flex-none shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <button
            onClick={() => closeModal('connectCalendar')}
            disabled={isAuthorizing}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Close dialog (Esc)"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          <h3 id="connect-calendar-title" className="text-base font-black text-[#111827]">
            Connect your calendar
          </h3>
          <div className="p-3 rounded-xl bg-[#eff6ff]/60 border border-[#dbeafe] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2563eb] mt-0.5 flex-none" />
            <p className="text-[11.5px] text-[#1e3a8a] leading-relaxed font-medium">
              Minomeet reads your calendar events only. Nothing is written to your calendar. Tokens stay on this device.
            </p>
          </div>
        </div>

        {/* Inline Error Display with Retry */}
        {hasError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-none" />
              <div className="flex-1 leading-snug break-words">
                <span className="font-bold">Sign-in Error:</span> {errorMessage}
              </div>
            </div>
            {currentProvider && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => startCalendarSignIn(currentProvider)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Waiting / Authorizing State */}
        {isAuthorizing && (
          <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-150">
            <Loader2 className="w-6 h-6 text-[#2563eb] animate-spin" />
            <div>
              <p className="text-xs font-bold text-[#111827]">
                Complete sign-in in your browser…
              </p>
              <p className="text-[11px] text-[#6b7280] mt-0.5">
                Waiting for OAuth authorization on loopback listener
              </p>
            </div>
            <button
              onClick={cancelCalendarSignIn}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition cursor-pointer shadow-2xs"
            >
              Cancel Authorization
            </button>
          </div>
        )}

        {/* Provider Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* Google Button */}
          <button
            onClick={() => startCalendarSignIn('google')}
            disabled={isAuthorizing}
            className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl font-bold text-[13px] border border-[#d6dbe2] bg-white text-[#111827] hover:bg-gray-50 hover:border-gray-300 shadow-2xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative ${
              !calendarProvidersConfig.googleConfigured ? 'opacity-80' : ''
            }`}
          >
            {/* Inline Google G mark SVG */}
            <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Microsoft Outlook Button */}
          <button
            onClick={() => startCalendarSignIn('microsoft')}
            disabled={isAuthorizing}
            className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl font-bold text-[13px] border border-[#d6dbe2] bg-white text-[#111827] hover:bg-gray-50 hover:border-gray-300 shadow-2xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              !calendarProvidersConfig.microsoftConfigured ? 'opacity-80' : ''
            }`}
          >
            {/* Inline Microsoft four-square mark SVG */}
            <svg className="w-4 h-4 flex-none" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span>Continue with Microsoft Outlook</span>
          </button>
        </div>

        {/* Footer Cancel Link */}
        <div className="mt-5 text-center">
          <button
            onClick={() => closeModal('connectCalendar')}
            disabled={isAuthorizing}
            className="text-xs text-[#6b7280] hover:text-[#111827] font-semibold underline underline-offset-2 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
