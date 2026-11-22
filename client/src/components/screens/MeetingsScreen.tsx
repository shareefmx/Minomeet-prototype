import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { api } from '../../services/api';
import { CalendarEvent } from '../../types/meeting';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  ShieldCheck,
  Video,
  User,
  Users,
  ExternalLink,
  Radio,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

export const MeetingsScreen: React.FC = () => {
  const {
    calendarAccounts,
    openModal,
    startRecording
  } = useMeeting();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [weekEventMap, setWeekEventMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [pastExpanded, setPastExpanded] = useState<boolean>(false);

  // Helper: check if date is today
  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isYesterday = (d: Date) => {
    const yesterday = new Date(Date.now() - 86400000);
    return (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    );
  };

  const isTomorrow = (d: Date) => {
    const tomorrow = new Date(Date.now() + 86400000);
    return (
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()
    );
  };

  const formatDateDisplay = (d: Date) => {
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const toDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Week days starting Monday
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const day = curr.getDay(); // 0 is Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  // Fetch events for selected day & week indicators
  const loadEvents = useCallback(async (date: Date, showSpinner = true) => {
    if (calendarAccounts.length === 0) {
      setEvents([]);
      return;
    }

    if (showSpinner) setIsLoading(true);
    setFetchError(null);

    try {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const fromIso = dayStart.toISOString();
      const toIso = dayEnd.toISOString();

      const accountFilter = selectedAccountId === 'all' ? undefined : [selectedAccountId];
      const fetched = await api.fetchCalendarEvents(fromIso, toIso, accountFilter);
      setEvents(fetched);
      setLastUpdated(new Date());

      // Also pre-fetch the week range to populate dots
      if (weekDays.length === 7) {
        const weekStart = new Date(weekDays[0]);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekDays[6]);
        weekEnd.setHours(23, 59, 59, 999);

        const weekEvents = await api.fetchCalendarEvents(weekStart.toISOString(), weekEnd.toISOString(), accountFilter);
        const countMap: Record<string, number> = {};
        for (const ev of weekEvents) {
          const evDate = new Date(ev.start);
          const k = toDateKey(evDate);
          countMap[k] = (countMap[k] || 0) + 1;
        }
        setWeekEventMap(countMap);
      }
    } catch (e: any) {
      console.warn('Failed to fetch calendar events:', e);
      setFetchError(e.message || 'Failed to sync with calendar providers.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [calendarAccounts.length, selectedAccountId, weekDays]);

  useEffect(() => {
    loadEvents(selectedDate, true);
  }, [selectedDate, selectedAccountId, calendarAccounts.length]);

  // Auto-refresh every 5 minutes and on window focus
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents(selectedDate, false);
    }, 5 * 60 * 1000);

    const onFocus = () => {
      loadEvents(selectedDate, false);
    };

    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadEvents, selectedDate]);

  // Keyboard navigation: ← → change day, T = today
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedDate(prev => new Date(prev.getTime() - 86400000));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedDate(prev => new Date(prev.getTime() + 86400000));
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSelectedDate(new Date());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrevDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() - 86400000));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() + 86400000));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents(selectedDate, false);
  };

  const handleJoinMeeting = async (url?: string) => {
    if (!url) return;
    if (!url.startsWith('https://')) return;
    await api.openExternalUrl(url);
  };

  const handleRecordAndJoin = async (_title: string, url?: string) => {
    await startRecording();
    if (url && url.startsWith('https://')) {
      setTimeout(() => {
        api.openExternalUrl(url);
      }, 500);
    }
  };

  // Split events
  const { allDayEvents, upcomingEvents, pastEvents, nextMeetingMinutes, nextMeetingTitle, totalDurationMin } = useMemo(() => {
    const now = new Date();
    const todayActive = isToday(selectedDate);

    const allDay: CalendarEvent[] = [];
    const upcoming: CalendarEvent[] = [];
    const past: CalendarEvent[] = [];
    let totalMinutes = 0;
    let nextTitle = '';
    let nextMin: number | null = null;

    for (const ev of events) {
      const start = new Date(ev.start);
      const end = new Date(ev.end);
      const durationMs = Math.max(0, end.getTime() - start.getTime());
      totalMinutes += Math.round(durationMs / (60 * 1000));

      if (ev.isAllDay) {
        allDay.push(ev);
      } else if (todayActive && end.getTime() < now.getTime()) {
        past.push(ev);
      } else {
        upcoming.push(ev);
        if (todayActive && start.getTime() > now.getTime()) {
          const diffMinutes = Math.round((start.getTime() - now.getTime()) / (60 * 1000));
          if (nextMin === null || diffMinutes < nextMin) {
            nextMin = diffMinutes;
            nextTitle = ev.title;
          }
        }
      }
    }

    return {
      allDayEvents: allDay,
      upcomingEvents: upcoming,
      pastEvents: past,
      nextMeetingMinutes: nextMin,
      nextMeetingTitle: nextTitle,
      totalDurationMin: totalMinutes
    };
  }, [events, selectedDate]);

  const formatDurationText = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const formatEventTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Reconnect warning
  const reconnectNeededAccounts = calendarAccounts.filter(a => a.status === 'reconnect_needed');

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-[#f8fafc] text-[#111827] select-none p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-4">
        {/* Reconnect Banner */}
        {reconnectNeededAccounts.map(acc => (
          <div
            key={acc.id}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs flex items-center justify-between text-amber-800 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Action required:</strong> {acc.displayName} ({acc.provider === 'google' ? 'Google' : 'Outlook'}) session expired.
              </span>
            </div>
            <button
              onClick={() => api.reauthenticateCalendar(acc.id).then(() => loadEvents(selectedDate, true))}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition cursor-pointer"
            >
              Reconnect
            </button>
          </div>
        ))}

        {/* Offline / Fetch Error Banner */}
        {fetchError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs flex items-center justify-between text-rose-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Couldn't reach calendar provider. Showing saved data {lastUpdated ? `from ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}.
              </span>
            </div>
            <button
              onClick={() => loadEvents(selectedDate, true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#2563eb] uppercase tracking-wider">
                <CalendarIcon className="w-4 h-4" />
                <span>Calendar Schedule</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#111827] mt-1">
                Meetings
              </h1>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {formatDateDisplay(selectedDate)}
              </p>
            </div>

            {/* Right side: Accounts and Refresh */}
            <div className="flex items-center gap-3">
              {/* Account chips */}
              <div className="flex items-center -space-x-1.5">
                {calendarAccounts.map(acc => (
                  <div
                    key={acc.id}
                    title={`${acc.displayName} (${acc.email})`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-2xs"
                    style={{ backgroundColor: acc.provider === 'google' ? '#2563eb' : '#0284c7' }}
                  >
                    {acc.provider === 'google' ? 'G' : 'O'}
                  </div>
                ))}
              </div>

              {calendarAccounts.length > 0 && (
                <button
                  onClick={() => openModal('connectCalendar')}
                  className="p-1.5 rounded-lg border border-[#e5e7eb] hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                  title="Add another calendar account"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#e5e7eb] text-xs font-medium text-gray-700 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
                title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563eb]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Day Navigation & Quick Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#e5e7eb] rounded-xl bg-white shadow-2xs overflow-hidden">
                <button
                  onClick={handlePrevDay}
                  className="p-2 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                  title="Previous Day (←)"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className={`px-3 py-1.5 text-xs font-bold transition cursor-pointer border-x border-[#e5e7eb] ${
                    isToday(selectedDate) ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Jump to Today (T)"
                >
                  Today
                </button>
                <button
                  onClick={handleNextDay}
                  className="p-2 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                  title="Next Day (→)"
                  aria-label="Next day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Pills */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => setSelectedDate(new Date(Date.now() - 86400000))}
                  className={`px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                    isYesterday(selectedDate)
                      ? 'bg-[#eff6ff] text-[#2563eb] font-semibold border border-[#bfdbfe]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className={`px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                    isToday(selectedDate)
                      ? 'bg-[#eff6ff] text-[#2563eb] font-semibold border border-[#bfdbfe]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate(new Date(Date.now() + 86400000))}
                  className={`px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                    isTomorrow(selectedDate)
                      ? 'bg-[#eff6ff] text-[#2563eb] font-semibold border border-[#bfdbfe]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Date Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Choose Date</span>
              </button>

              {/* Date Picker Popover */}
              {showDatePicker && (
                <div className="absolute right-0 top-10 z-30 bg-white border border-[#e5e7eb] rounded-2xl shadow-xl p-3 w-64">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs font-bold text-gray-800">
                    <span>{selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="date"
                    value={toDateKey(selectedDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        setSelectedDate(new Date(y, m - 1, d));
                        setShowDatePicker(false);
                      }
                    }}
                    className="w-full mt-3 px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                        setShowDatePicker(false);
                      }}
                      className="text-[11px] font-bold text-[#2563eb] hover:underline cursor-pointer"
                    >
                      Go to Today
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Week Strip (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {weekDays.map(d => {
              const k = toDateKey(d);
              const count = weekEventMap[k] || 0;
              const isSelected = toDateKey(selectedDate) === k;
              const isCurrentDay = isToday(d);

              return (
                <button
                  key={k}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl transition cursor-pointer text-center relative ${
                    isSelected
                      ? 'bg-[#2563eb] text-white font-bold shadow-2xs'
                      : isCurrentDay
                      ? 'bg-[#eff6ff] text-[#2563eb] font-semibold border border-[#bfdbfe]'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                    {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                  <span className="text-sm mt-0.5">{d.getDate()}</span>
                  {count > 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? 'bg-white' : 'bg-[#2563eb]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Filter (SegmentedPills) when 2 or more accounts exist */}
        {calendarAccounts.length >= 2 && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs">
            <button
              onClick={() => setSelectedAccountId('all')}
              className={`flex-1 py-1 px-3 rounded-lg font-medium transition cursor-pointer text-center ${
                selectedAccountId === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All accounts
            </button>
            {calendarAccounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`flex-1 py-1 px-3 rounded-lg font-medium transition cursor-pointer text-center truncate ${
                  selectedAccountId === acc.id
                    ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={acc.email}
              >
                {acc.email}
              </button>
            ))}
          </div>
        )}

        {/* Summary Strip */}
        {calendarAccounts.length > 0 && events.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] px-4 py-2.5 flex items-center justify-between text-xs text-[#6b7280] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111827]">
                {events.length} meeting{events.length === 1 ? '' : 's'}
              </span>
              <span>·</span>
              <span>{formatDurationText(totalDurationMin)} total</span>
            </div>

            {nextMeetingMinutes !== null && nextMeetingMinutes >= 0 && (
              <div className="flex items-center gap-1.5 text-[#2563eb] font-semibold bg-[#eff6ff] px-2.5 py-1 rounded-full border border-[#dbeafe]">
                <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse" />
                <span className="truncate max-w-[200px]">Next: {nextMeetingTitle} in {nextMeetingMinutes}m</span>
              </div>
            )}
          </div>
        )}

        {/* Empty State: No Accounts Connected */}
        {calendarAccounts.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mx-auto shadow-inner">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-lg font-bold text-[#111827]">
                Connect your Calendar
              </h2>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Connect your Google or Outlook calendar to see your scheduled meetings here and join them in one click.
              </p>
            </div>
            <div>
              <button
                onClick={() => openModal('connectCalendar')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Connect calendar</span>
              </button>
            </div>
            <p className="text-[11px] text-[#9ca3af] pt-2">
              Minomeet reads your calendar events only. Nothing is written to your calendar. Tokens stay on this device.
            </p>
          </div>
        )}

        {/* Empty State: Connected but No Meetings for Selected Day */}
        {calendarAccounts.length > 0 && !isLoading && events.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-sm font-bold text-[#111827]">
                No meetings scheduled
              </h3>
              <p className="text-xs text-[#6b7280]">
                No meetings scheduled for this day. Enjoy your focus time!
              </p>
            </div>
            {!isToday(selectedDate) && (
              <button
                onClick={handleToday}
                className="px-3 py-1.5 border border-[#e5e7eb] text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition cursor-pointer"
              >
                Jump to Today
              </button>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-10 flex flex-col items-center justify-center gap-3 text-xs text-gray-500 shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2563eb]" />
            <span>Syncing scheduled meetings…</span>
          </div>
        )}

        {/* Event List */}
        {!isLoading && events.length > 0 && (
          <div className="space-y-4">
            {/* All Day Events Section */}
            {allDayEvents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  All Day ({allDayEvents.length})
                </h4>
                <div className="space-y-2">
                  {allDayEvents.map(ev => renderEventCard(ev))}
                </div>
              </div>
            )}

            {/* Upcoming / Today's Schedule */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  {isToday(selectedDate) ? "Today's Schedule" : "Scheduled"} ({upcomingEvents.length})
                </h4>
                <div className="space-y-2.5">
                  {upcomingEvents.map(ev => renderEventCard(ev))}
                </div>
              </div>
            )}

            {/* Past Meetings (Collapsed by default for today) */}
            {pastEvents.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => setPastExpanded(v => !v)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-800 py-1 px-1 transition cursor-pointer"
                >
                  <span>Past meetings ({pastEvents.length})</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${pastExpanded ? 'rotate-180' : ''}`} />
                </button>
                {pastExpanded && (
                  <div className="space-y-2 mt-2 opacity-80">
                    {pastEvents.map(ev => renderEventCard(ev, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Privacy Note Footer */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#9ca3af]">
          <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
          <span>Minomeet reads your calendar events only. Nothing is written to your calendar. Tokens stay on this device.</span>
        </div>
      </div>
    </div>
  );

  function renderEventCard(ev: CalendarEvent, isPast = false) {
    const acc = calendarAccounts.find(a => a.id === ev.accountId);
    const accentColor = acc?.provider === 'google' ? '#2563eb' : '#0284c7';

    return (
      <div
        key={ev.id}
        className={`bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-xs hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden ${
          isPast ? 'bg-gray-50/70' : ''
        }`}
      >
        {/* Left vertical account stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: accentColor }}
        />

        {/* Left: Vertical Time Rail */}
        <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0 pl-2 shrink-0 sm:w-24">
          {ev.isAllDay ? (
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              All Day
            </span>
          ) : (
            <>
              <span className="text-sm font-bold text-[#111827]">
                {formatEventTime(ev.start)}
              </span>
              <span className="text-[11px] text-gray-400">
                until {formatEventTime(ev.end)}
              </span>
            </>
          )}
        </div>

        {/* Middle: Title, Organizer, Attendees, Platform badge */}
        <div className="flex-1 min-w-0 pl-2 sm:pl-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#111827] truncate" title={ev.title}>
              {ev.title}
            </h3>
            {ev.status === 'tentative' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Tentative
              </span>
            )}
            {ev.status === 'cancelled' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Cancelled
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {ev.organizer && (
              <span className="flex items-center gap-1 text-[11px]">
                <User className="w-3 h-3 text-gray-400" />
                <span className="truncate max-w-[130px]">{ev.organizer}</span>
              </span>
            )}
            {ev.attendeesCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                <Users className="w-3 h-3" />
                <span>{ev.attendeesCount}</span>
              </span>
            )}
            {ev.joinProvider && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]">
                <Video className="w-3 h-3" />
                <span className="capitalize">{ev.joinProvider === 'meet' ? 'Google Meet' : ev.joinProvider === 'teams' ? 'Teams' : ev.joinProvider}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Join and Record & Join */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0 pl-2 sm:pl-0 border-t sm:border-t-0 border-gray-100 shrink-0">
          {ev.joinUrl ? (
            <>
              <button
                onClick={() => handleRecordAndJoin(ev.title, ev.joinUrl)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                title="Start recording meeting and open video call"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>Record & Join</span>
              </button>
              <button
                onClick={() => handleJoinMeeting(ev.joinUrl)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Open meeting in browser"
              >
                <span>Join</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-gray-400 italic mr-1">No video link</span>
              <button
                onClick={() => startRecording()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-rose-500" />
                <span>Record</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
};
