import React, { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext.js';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  ShieldCheck
} from 'lucide-react';

export const MeetingsScreen: React.FC = () => {
  const {
    calendarAccounts,
    openModal
  } = useMeeting();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const formatDateDisplay = (d: Date) => {
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-[#f8fafc] text-[#111827] select-none p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-5">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          {/* Day Navigation & Refresh */}
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
                className="px-3 py-1.5 text-xs font-bold text-[#1e3a8a] hover:bg-[#eff6ff] transition cursor-pointer border-x border-[#e5e7eb]"
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

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl border border-[#e5e7eb] text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer shadow-2xs"
              title="Refresh Calendar"
              aria-label="Refresh calendar"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2563eb]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Connected Accounts Strip */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#4b5563]">Connected:</span>
            {calendarAccounts.map(acc => (
              <span
                key={acc.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#eff6ff] text-[#1e3a8a] border border-[#bfdbfe]"
                title={`${acc.displayName} (${acc.email})`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color || '#2563eb' }} />
                <span>{acc.email}</span>
                <span className="text-[10px] uppercase opacity-75">({acc.provider})</span>
              </span>
            ))}
          </div>

          <button
            onClick={() => openModal('connectCalendar')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Account</span>
          </button>
        </div>

        {/* Empty State Banner (Stage 1 / Empty Day) */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] mx-auto flex items-center justify-center text-[#2563eb] shadow-xs">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#111827]">
              No meetings scheduled for this day
            </h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              You're all clear! New meetings from your connected calendars will automatically appear here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleToday}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition shadow-xs cursor-pointer"
            >
              Go to Today
            </button>
          </div>
        </div>

        {/* Privacy Note Footer */}
        <div className="text-center pt-4">
          <p className="text-[11px] text-[#9aa2af] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803d]" />
            <span>Minomeet reads your calendar events only. Nothing is written to your calendar. Tokens stay on this device.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
