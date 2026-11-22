import React, { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { api } from '../../services/api';
import { CalendarAccount, CalendarPreferences } from '../../types/meeting';
import {
  SettingsCard,
  Toggle,
  SegmentedPills,
  StatusBadge
} from './SettingsComponents';
import {
  Calendar,
  Sliders,
  Bell,
  Zap,
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const MeetingsSettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    showToast,
    calendarAccounts,
    calendarProvidersConfig,
    startCalendarSignIn,
    signOutCalendarAccount,
    refreshCalendarAccounts,
    openModal
  } = useMeeting();

  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState<boolean>(false);
  const [confirmSignOutAll, setConfirmSignOutAll] = useState<boolean>(false);
  const [accountToSignOut, setAccountToSignOut] = useState<CalendarAccount | null>(null);

  const calPrefs: CalendarPreferences = {
    meetingsEnabled: true,
    defaultView: 'today',
    timeFormat: '12h',
    weekStartsOn: 'monday',
    showCancelled: false,
    showAllDay: true,
    autoRefreshInterval: '5m',
    remindersEnabled: false,
    reminderLeadTimeMinutes: 5,
    askBeforeJoin: false,
    showRecordAndJoin: true,
    ...(settings?.calendarPreferences || {})
  };

  const updateCalPref = async <K extends keyof CalendarPreferences>(key: K, value: CalendarPreferences[K]) => {
    const updated = {
      ...calPrefs,
      [key]: value
    };
    try {
      await updateSettings({ calendarPreferences: updated });
    } catch (err: any) {
      showToast('Settings Error', err?.message || 'Failed to update calendar preferences', 'error');
    }
  };

  const googleAcc = calendarAccounts.find(a => a.provider === 'google');
  const msAcc = calendarAccounts.find(a => a.provider === 'microsoft');

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const cleared = await api.clearCalendarCache();
      showToast('Calendar Cache Cleared', `Removed ${cleared} cached meetings`, 'success');
    } catch (err: any) {
      showToast('Cache Error', err?.message || 'Failed to clear cache', 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleSignOutAll = async () => {
    setIsSigningOutAll(true);
    try {
      await api.signOutAllCalendar();
      await refreshCalendarAccounts();
      showToast('Calendar Reset', 'Signed out of all accounts and deleted all calendar data', 'info');
      setConfirmSignOutAll(false);
    } catch (err: any) {
      showToast('Sign Out Error', err?.message || 'Failed to sign out all accounts', 'error');
    } finally {
      setIsSigningOutAll(false);
    }
  };

  const handleAccountSignOutClick = (acc: CalendarAccount) => {
    if (calendarAccounts.length > 1) {
      openModal('calendarSignOut');
    } else {
      setAccountToSignOut(acc);
    }
  };

  return (
    <div className="space-y-6">
      {/* CARD 1: Connected Accounts */}
      <SettingsCard
        title="Connected Accounts"
        description="Connect your Google Calendar or Microsoft Outlook to sync scheduled meetings. Tokens stay solely on this device."
        icon={Calendar}
      >
        <div className="space-y-3">
          {/* Google Row */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {/* Google 4-Color Mark */}
              <div className="w-8 h-8 rounded-xl bg-white border border-[#e5e7eb] flex items-center justify-center flex-none shadow-2xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#111827] dark:text-neutral-100">Google Calendar</span>
                  {googleAcc ? (
                    googleAcc.status === 'reconnect_needed' ? (
                      <StatusBadge tone="warning">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" /> Reconnect needed
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="success">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" /> Connected
                      </StatusBadge>
                    )
                  ) : calendarProvidersConfig.googleConfigured ? (
                    <StatusBadge tone="neutral">Not connected</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning">Not configured</StatusBadge>
                  )}
                </div>
                <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 truncate mt-0.5">
                  {googleAcc ? (
                    <>
                      <span>{googleAcc.email}</span>
                      <span className="mx-1.5 opacity-50">&bull;</span>
                      <span>
                        Last synced{' '}
                        {googleAcc.lastSyncAt
                          ? new Date(googleAcc.lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                          : 'Never'}
                      </span>
                    </>
                  ) : calendarProvidersConfig.googleConfigured ? (
                    'Connect your Google Workspace or personal Gmail calendar'
                  ) : (
                    <span>Missing Client ID. See docs/MEETINGS_SETUP.md</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
              {googleAcc ? (
                <>
                  {googleAcc.status === 'reconnect_needed' && (
                    <button
                      onClick={() => api.reauthenticateCalendar(googleAcc.id).then(refreshCalendarAccounts)}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Reconnect
                    </button>
                  )}
                  <button
                    onClick={() => handleAccountSignOutClick(googleAcc)}
                    className="px-3 py-1 rounded-lg border border-[#e5e7eb] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </>
              ) : calendarProvidersConfig.googleConfigured ? (
                <button
                  onClick={() => startCalendarSignIn('google')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Connect
                </button>
              ) : (
                <button
                  disabled
                  className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold cursor-not-allowed"
                >
                  Setup Required
                </button>
              )}
            </div>
          </div>

          {/* Microsoft Row */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {/* Microsoft 4-Square Mark */}
              <div className="w-8 h-8 rounded-xl bg-white border border-[#e5e7eb] flex items-center justify-center flex-none shadow-2xs">
                <svg className="w-4 h-4" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#111827] dark:text-neutral-100">Microsoft Outlook</span>
                  {msAcc ? (
                    msAcc.status === 'reconnect_needed' ? (
                      <StatusBadge tone="warning">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" /> Reconnect needed
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="success">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" /> Connected
                      </StatusBadge>
                    )
                  ) : calendarProvidersConfig.microsoftConfigured ? (
                    <StatusBadge tone="neutral">Not connected</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning">Not configured</StatusBadge>
                  )}
                </div>
                <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 truncate mt-0.5">
                  {msAcc ? (
                    <>
                      <span>{msAcc.email}</span>
                      <span className="mx-1.5 opacity-50">&bull;</span>
                      <span>
                        Last synced{' '}
                        {msAcc.lastSyncAt
                          ? new Date(msAcc.lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                          : 'Never'}
                      </span>
                    </>
                  ) : calendarProvidersConfig.microsoftConfigured ? (
                    'Connect your Microsoft 365 or Outlook.com calendar'
                  ) : (
                    <span>Missing Client ID. See docs/MEETINGS_SETUP.md</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
              {msAcc ? (
                <>
                  {msAcc.status === 'reconnect_needed' && (
                    <button
                      onClick={() => api.reauthenticateCalendar(msAcc.id).then(refreshCalendarAccounts)}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Reconnect
                    </button>
                  )}
                  <button
                    onClick={() => handleAccountSignOutClick(msAcc)}
                    className="px-3 py-1 rounded-lg border border-[#e5e7eb] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </>
              ) : calendarProvidersConfig.microsoftConfigured ? (
                <button
                  onClick={() => startCalendarSignIn('microsoft')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Connect
                </button>
              ) : (
                <button
                  disabled
                  className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold cursor-not-allowed"
                >
                  Setup Required
                </button>
              )}
            </div>
          </div>

          {/* Privacy Reassurance Note */}
          <div className="p-3 rounded-xl bg-[#eff6ff]/60 border border-[#dbeafe] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2563eb] mt-0.5 flex-none" />
            <p className="text-[11.5px] text-[#1e3a8a] leading-relaxed font-medium">
              Minomeet reads your calendar events only. Nothing is written to your calendar. Tokens stay on this device.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* CARD 2: Calendar Preferences */}
      <SettingsCard
        title="Calendar Preferences"
        description="Configure calendar display, scheduling defaults and auto-refresh intervals."
        icon={Sliders}
      >
        <div className="space-y-3">
          {/* Meetings Feature Toggle */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Meetings Feature</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">
                Enable or disable calendar integration. Disabling hides the sidebar item and halts all background syncing without removing your accounts.
              </p>
            </div>
            <Toggle
              checked={calPrefs.meetingsEnabled}
              onChange={(val) => updateCalPref('meetingsEnabled', val)}
              ariaLabel="Enable or disable Meetings feature"
            />
          </div>

          {/* Default View */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Default View</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">Which day to display when opening the Meetings screen.</p>
            </div>
            <SegmentedPills
              options={[
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'last_viewed', label: 'Last viewed' }
              ]}
              value={calPrefs.defaultView}
              onChange={(id) => updateCalPref('defaultView', id as any)}
            />
          </div>

          {/* Time Format */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Time Format</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">Format for schedule timestamps.</p>
            </div>
            <SegmentedPills
              options={[
                { id: '12h', label: '12-hour' },
                { id: '24h', label: '24-hour' },
                { id: 'system', label: 'System' }
              ]}
              value={calPrefs.timeFormat}
              onChange={(id) => updateCalPref('timeFormat', id as any)}
            />
          </div>

          {/* Week Starts On */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Week Starts On</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">First day in the 7-day strip selector.</p>
            </div>
            <SegmentedPills
              options={[
                { id: 'monday', label: 'Monday' },
                { id: 'sunday', label: 'Sunday' }
              ]}
              value={calPrefs.weekStartsOn}
              onChange={(id) => updateCalPref('weekStartsOn', id as any)}
            />
          </div>

          {/* Show Cancelled Meetings */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Show Cancelled Meetings</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">Display cancelled calendar events with a strikethrough badge.</p>
            </div>
            <Toggle
              checked={calPrefs.showCancelled}
              onChange={(val) => updateCalPref('showCancelled', val)}
              ariaLabel="Toggle show cancelled meetings"
            />
          </div>

          {/* Show All-Day Events */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Show All-Day Events</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">Display all-day events in a dedicated section.</p>
            </div>
            <Toggle
              checked={calPrefs.showAllDay}
              onChange={(val) => updateCalPref('showAllDay', val)}
              ariaLabel="Toggle show all-day events"
            />
          </div>

          {/* Auto-Refresh Interval */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Auto-Refresh Interval</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">How often to sync scheduled meetings in the background.</p>
            </div>
            <SegmentedPills
              options={[
                { id: 'off', label: 'Off' },
                { id: '5m', label: '5 min' },
                { id: '15m', label: '15 min' }
              ]}
              value={calPrefs.autoRefreshInterval}
              onChange={(id) => updateCalPref('autoRefreshInterval', id as any)}
            />
          </div>
        </div>
      </SettingsCard>

      {/* CARD 3: Reminders */}
      <SettingsCard
        title="Reminders"
        description="Receive desktop notifications before scheduled meetings start."
        icon={Bell}
      >
        <div className="space-y-3">
          {!settings?.notifications && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-none" />
              <span>Desktop notifications are currently disabled in General settings. Enable them to receive meeting reminders.</span>
            </div>
          )}

          {/* Remind me toggle */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Remind me before meetings</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">
                Send a desktop alert prior to upcoming calendar events.
              </p>
            </div>
            <Toggle
              checked={calPrefs.remindersEnabled}
              onChange={(val) => updateCalPref('remindersEnabled', val)}
              ariaLabel="Toggle meeting reminders"
            />
          </div>

          {/* Lead time */}
          <div className={`p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
            !calPrefs.remindersEnabled ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Reminder Lead Time</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">How many minutes before meeting start to alert.</p>
            </div>
            <SegmentedPills
              options={[
                { id: '1', label: '1 min' },
                { id: '5', label: '5 min' },
                { id: '10', label: '10 min' },
                { id: '15', label: '15 min' }
              ]}
              value={String(calPrefs.reminderLeadTimeMinutes)}
              onChange={(id) => updateCalPref('reminderLeadTimeMinutes', parseInt(id, 10))}
            />
          </div>

          <p className="text-xs text-[#6b7280] px-1 italic">
            Reminders appear only while Minomeet is open and Notifications are ON.
          </p>
        </div>
      </SettingsCard>

      {/* CARD 4: Join Behaviour */}
      <SettingsCard
        title="Join Behaviour"
        description="Control prompts and one-click launch options when entering meetings."
        icon={Zap}
      >
        <div className="space-y-3">
          {/* Ask before join */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Ask before opening the meeting link in the browser</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">
                Display a confirmation prompt before launching external browser URLs.
              </p>
            </div>
            <Toggle
              checked={calPrefs.askBeforeJoin}
              onChange={(val) => updateCalPref('askBeforeJoin', val)}
              ariaLabel="Toggle ask before join"
            />
          </div>

          {/* Show Record & Join button */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Show Record & Join button</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">
                Display the combined one-click record and join launcher on meeting cards.
              </p>
            </div>
            <Toggle
              checked={calPrefs.showRecordAndJoin}
              onChange={(val) => updateCalPref('showRecordAndJoin', val)}
              ariaLabel="Toggle show Record & Join button"
            />
          </div>
        </div>
      </SettingsCard>

      {/* CARD 5: Privacy & Data */}
      <SettingsCard
        title="Privacy & Data"
        description="Review data scopes, permissions, and manage local meeting cache."
        icon={ShieldCheck}
      >
        <div className="space-y-3.5">
          {/* Scopes explainer */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 text-xs text-[#4b5563] space-y-1.5 leading-relaxed">
            <p className="font-semibold text-[#111827] dark:text-neutral-100">Read-only calendar scopes requested:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11.5px] font-mono text-[#2563eb]">
              <li>Google: https://www.googleapis.com/auth/calendar.events.readonly</li>
              <li>Microsoft: Calendars.Read</li>
            </ul>
            <p className="text-[11.5px] text-[#6b7280] dark:text-neutral-400">
              Minomeet requests read-only access to calendar events only. No emails, contacts, or documents are accessed, and nothing is ever written or modified on your calendar. Tokens stay solely on this device in the OS Keychain.
            </p>
          </div>

          {/* Clear Cache */}
          <div className="p-3.5 rounded-xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f9fafb] dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-[#111827] dark:text-neutral-100">Clear cached meetings</h5>
              <p className="text-[11px] text-[#6b7280] dark:text-neutral-400 mt-0.5">
                Delete locally cached events. Fresh meetings will be retrieved on your next sync.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="px-3.5 py-1.5 rounded-xl border border-[#e5e7eb] hover:bg-gray-100 text-gray-700 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs flex-none"
            >
              {isClearingCache ? 'Clearing…' : 'Clear Cache'}
            </button>
          </div>

          {/* Sign out all */}
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-red-900">Sign out of all accounts and delete all calendar data</h5>
              <p className="text-[11px] text-red-700/80 mt-0.5">
                Revoke tokens where supported, remove Keychain credentials, and delete all cached events.
              </p>
            </div>
            <button
              onClick={() => setConfirmSignOutAll(true)}
              disabled={calendarAccounts.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs flex-none"
            >
              Sign Out & Clear All
            </button>
          </div>

          {/* Confirm Sign Out All Inline Dialog */}
          {confirmSignOutAll && (
            <div className="p-3.5 rounded-xl border border-red-300 bg-red-50 text-xs text-red-900 space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-none" />
                <div>
                  <p className="font-bold">Are you sure you want to disconnect all calendar accounts?</p>
                  <p className="text-[11.5px] text-red-700 mt-0.5">
                    This will delete all tokens from your Keychain and purge all cached calendar events.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setConfirmSignOutAll(false)}
                  disabled={isSigningOutAll}
                  className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOutAll}
                  disabled={isSigningOutAll}
                  className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {isSigningOutAll ? 'Deleting…' : 'Yes, Delete Everything'}
                </button>
              </div>
            </div>
          )}

          {/* Revoke link notes */}
          <div className="pt-1 text-xs text-[#6b7280] leading-relaxed">
            <span className="italic">You can also revoke access in your{' '}</span>
            <button
              onClick={() => api.openExternalUrl('https://myaccount.google.com/permissions')}
              className="text-[#2563eb] hover:underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
            >
              <span>Google Account Security</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <span className="italic"> or </span>
            <button
              onClick={() => api.openExternalUrl('https://account.live.com/consent/Manage')}
              className="text-[#2563eb] hover:underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
            >
              <span>Microsoft Account Privacy</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <span className="italic"> page.</span>
          </div>
        </div>
      </SettingsCard>

      {/* Single Account Sign Out Confirmation Dialog */}
      {accountToSignOut && (
        <div
          className="fixed inset-0 bg-[#0f1117]/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAccountToSignOut(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-[#111827]">Sign out of Calendar</h3>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              Sign out of <strong className="text-[#111827]">{accountToSignOut.email}</strong>? Your meetings will no longer appear.
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                onClick={() => setAccountToSignOut(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#e5e7eb] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = accountToSignOut.id;
                  setAccountToSignOut(null);
                  await signOutCalendarAccount(id);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
