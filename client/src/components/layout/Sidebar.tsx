import React, { useState, useEffect, useRef } from 'react';
import { useMeeting } from '../../context/MeetingContext.js';
import {
  Search,
  Home,
  Calendar,
  FileText,
  Mic,
  Upload,
  Settings,
  Info,
  MessageSquare,
  MoreVertical,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Menu,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    meetings,
    activeMeeting,
    currentScreen,
    searchQuery,
    isRecording,
    setSearchQuery,
    setCurrentScreen,
    selectMeeting,
    startRecording,
    stopRecording,
    openModal,
    openDeleteModal,
    openRenameModal,
    togglePinMeeting,
    setSettingsTab,
    calendarAccounts,
    hasSeenMeetingsNav,
    markMeetingsNavSeen,
    settings
  } = useMeeting();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const searchPopoverRef = useRef<HTMLDivElement>(null);

  // Auto-close search popover when resizing to >= 1024px (expanded layout)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsSearchOpen(false);
      }
    };
    mql.addEventListener('change', handleMediaChange);
    return () => mql.removeEventListener('change', handleMediaChange);
  }, []);

  // Close context dropdown on outside click or Escape
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  // Close search popover on outside click or Escape
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchPopoverRef.current &&
        !searchPopoverRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  // Filter meetings by search query
  const filteredMeetings = meetings
    .filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.summary?.summary.toLowerCase().includes(q) ||
        m.transcript.some((t) => t.text.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  // Render the core sidebar layout (used in main view and mobile drawer)
  const renderSidebarBody = (isDrawer = false) => (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* 1. PRIMARY ACTION BUTTONS (Above Search Area) */}
      {isDrawer ? (
        <div className="px-3 pt-4 pb-1 flex flex-col gap-2 flex-none">
          {/* Start Recording Button (Blue) */}
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              else startRecording();
              setIsMobileOpen(false);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-[13px] text-white shadow-sm transition active:scale-[0.99] cursor-pointer ${
              isRecording
                ? 'bg-[#1d4ed8] animate-pulse ring-2 ring-[#2563eb]/40'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
            }`}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'animate-spin' : ''}`} />
            <span className="truncate">
              {isRecording ? 'Recording in progress…' : 'Start Recording'}
            </span>
          </button>

          {/* Import Recording Button */}
          <button
            onClick={() => {
              openModal('import');
              setIsMobileOpen(false);
            }}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-[13px] bg-[#dbeafe] text-[#1e3a8a] hover:bg-[#bfdbfe] transition cursor-pointer border border-[#bfdbfe]"
          >
            <Upload className="w-4 h-4 flex-none" />
            <span className="truncate">Import Recording</span>
          </button>
        </div>
      ) : (
        <>
          {/* Expanded Top Action Buttons (>= 1024px) */}
          <div className="hidden lg:flex flex-col gap-2 px-3 pt-5 lg:pt-6 pb-1 flex-none">
            {/* Start Recording Button (Blue) */}
            <button
              onClick={() => {
                if (isRecording) stopRecording();
                else startRecording();
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-[13px] text-white shadow-sm transition active:scale-[0.99] cursor-pointer ${
                isRecording
                  ? 'bg-[#1d4ed8] animate-pulse ring-2 ring-[#2563eb]/40'
                  : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
              }`}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-spin' : ''}`} />
              <span className="truncate">
                {isRecording ? 'Recording in progress…' : 'Start Recording'}
              </span>
            </button>

            {/* Import Recording Button */}
            <button
              onClick={() => openModal('import')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-[13px] bg-[#dbeafe] text-[#1e3a8a] hover:bg-[#bfdbfe] transition cursor-pointer border border-[#bfdbfe]"
            >
              <Upload className="w-4 h-4 flex-none" />
              <span className="truncate">Import Recording</span>
            </button>
          </div>

          {/* Collapsed Top Action Buttons (< 1024px Rail) */}
          <div className="flex lg:hidden flex-col items-center gap-2 pt-5 pb-1 flex-none">
            {/* Start Recording Icon Button (Blue) */}
            <button
              onClick={() => {
                if (isRecording) stopRecording();
                else startRecording();
              }}
              className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-white transition cursor-pointer ${
                isRecording
                  ? 'bg-[#1d4ed8] animate-pulse ring-2 ring-[#2563eb]/40'
                  : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-spin' : ''}`} />
            </button>

            {/* Import Recording Icon Button */}
            <button
              onClick={() => openModal('import')}
              className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center bg-[#dbeafe] text-[#1e3a8a] hover:bg-[#bfdbfe] transition cursor-pointer border border-[#bfdbfe]"
              title="Import Recording"
              aria-label="Import Recording"
            >
              <Upload className="w-4 h-4 flex-none" />
            </button>
          </div>
        </>
      )}

      {/* 2. SEARCH SECTION (Below recording buttons) */}
      <div className={`${isDrawer ? 'block' : 'hidden lg:block'} px-3 pt-1.5 pb-2 flex-none`}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#9aa2af] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search meeting content…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-7 py-1.5 text-[12.5px] border border-[#d6dbe2] rounded-lg text-[#111827] placeholder-[#9aa2af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Collapsed Search Icon Trigger + Popover (< 1024px, hidden in drawer and >= 1024px) */}
      {!isDrawer && (
        <div className="lg:hidden flex flex-col items-center pt-1.5 pb-2 flex-none relative">
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
              isSearchOpen || searchQuery
                ? 'bg-[#eaf1ff] text-[#2563eb]'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Search meetings"
            aria-label="Search meetings"
          >
            <Search className="w-4 h-4" />
          </button>

          {isSearchOpen && (
            <div
              ref={searchPopoverRef}
              className="absolute left-[68px] top-3 z-50 w-72 max-w-[calc(100vw-5rem)] bg-white border border-[#e5e7eb] rounded-xl shadow-xl p-2.5 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100"
            >
              <Search className="w-4 h-4 text-gray-400 flex-none" />
              <input
                autoFocus
                type="text"
                placeholder="Search meeting content…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchOpen(false);
                }}
                className="flex-1 min-w-0 text-[12.5px] outline-none text-[#111827] placeholder-[#9aa2af] bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  title="Clear"
                >
                  ✕
                </button>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                title="Close search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. NAVIGATION ITEMS */}
      <nav className="space-y-1 px-2 lg:px-3 mb-2 flex-none">
        {/* Home Button */}
        <button
          onClick={() => {
            setCurrentScreen('home');
            if (isDrawer) setIsMobileOpen(false);
          }}
          className={`w-full flex items-center ${
            isDrawer ? 'justify-start' : 'justify-center lg:justify-start'
          } gap-2.5 px-2 lg:px-2.5 py-2 rounded-xl text-[13px] font-bold transition text-left cursor-pointer ${
            currentScreen === 'home'
              ? 'bg-[#eaf1ff] text-[#1e3a8a]'
              : 'text-[#111827] hover:bg-[#f3f4f6]'
          }`}
          title="Home Dashboard"
          aria-label="Home"
        >
          <Home className="w-4 h-4 text-[#4b5563] flex-none" />
          <span className={`truncate ${isDrawer ? 'inline' : 'hidden lg:inline'}`}>Home</span>
        </button>

        {/* Meetings Button (Directly below Home) */}
        {settings?.calendarPreferences?.meetingsEnabled !== false && (
          <button
            onClick={() => {
              if (!hasSeenMeetingsNav) {
                markMeetingsNavSeen();
              }
              if (calendarAccounts.length > 0) {
                setCurrentScreen('meetings');
              } else {
                openModal('connectCalendar');
              }
              if (isDrawer) setIsMobileOpen(false);
            }}
            className={`w-full flex items-center ${
              isDrawer ? 'justify-start' : 'justify-center lg:justify-start'
            } gap-2.5 px-2 lg:px-2.5 py-2 rounded-xl text-[13px] font-bold transition text-left cursor-pointer relative group ${
              currentScreen === 'meetings'
                ? 'bg-[#eaf1ff] text-[#1e3a8a]'
                : 'text-[#111827] hover:bg-[#f3f4f6]'
            }`}
            title="Meetings"
            aria-label="Meetings"
          >
            <div className="relative flex-none">
              <Calendar className="w-4 h-4 text-[#4b5563] group-hover:scale-105 transition" />
              {!hasSeenMeetingsNav && (
                <span
                  className={`lg:hidden absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2563eb] ring-2 ring-white ${
                    isDrawer ? 'hidden' : 'block'
                  }`}
                />
              )}
            </div>
            <span className={`truncate ${isDrawer ? 'inline' : 'hidden lg:inline'}`}>
              Meetings
            </span>
            {!hasSeenMeetingsNav && (
              <span
                className={`ml-auto text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] flex-none ${
                  isDrawer ? 'inline' : 'hidden lg:inline'
                }`}
              >
                New
              </span>
            )}
          </button>
        )}

        {/* Ask Your Meetings Button */}
        <button
          onClick={() => {
            openModal('ask');
            if (isDrawer) setIsMobileOpen(false);
          }}
          className={`w-full flex items-center ${
            isDrawer ? 'justify-start' : 'justify-center lg:justify-start'
          } gap-2.5 px-2 lg:px-2.5 py-2 rounded-xl text-[13px] font-semibold transition text-left cursor-pointer text-[#4f46e5] hover:bg-[#eef2ff] group relative`}
          title="Ask Your Meetings AI"
          aria-label="Ask Your Meetings AI"
        >
          <div className="relative flex-none">
            <MessageSquare className="w-4 h-4 text-[#4f46e5] group-hover:scale-110 transition" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#7c3aed] ring-2 ring-white" />
          </div>
          <span className={`truncate ${isDrawer ? 'inline' : 'hidden lg:inline'}`}>
            Ask Your Meetings
          </span>
          <span
            className={`ml-auto text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#f2e9ff] text-[#7c3aed] flex-none ${
              isDrawer ? 'inline' : 'hidden lg:inline'
            }`}
          >
            AI
          </span>
        </button>
      </nav>

      {/* 4. MEETING NOTES SECTION HEADER (Hidden when minimized in rail mode) */}
      <div
        className={`${
          isDrawer ? 'flex' : 'hidden lg:flex'
        } items-center justify-between px-3 lg:px-4 mt-1 mb-1.5 text-[#111827] flex-none`}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#6b7280] flex-none" />
          <span className="text-[12px] font-extrabold truncate">
            Meeting Notes
          </span>
        </div>
        <span className="text-xs text-[#9aa2af] font-normal flex-none">
          ({filteredMeetings.length})
        </span>
      </div>

      {/* 5. MEETING NOTES LIST (Hidden when minimized in rail mode) */}
      <div
        className={`${
          isDrawer ? 'flex' : 'hidden lg:flex'
        } flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1 px-1.5 lg:px-2`}
      >
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-6 px-2 text-xs text-[#9aa2af]">
            {searchQuery ? 'No meetings matching search.' : 'No recorded meetings yet.'}
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const isActive = currentScreen === 'notes' && activeMeeting?.id === meeting.id;
            const isMenuOpen = openMenuId === meeting.id;

            return (
              <div key={meeting.id} className="relative">
                {/* Expanded Item View (>= 1024px and Drawer) */}
                <div
                  onClick={() => {
                    selectMeeting(meeting);
                    if (isDrawer) setIsMobileOpen(false);
                  }}
                  className={`relative flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12.5px] leading-snug transition group ${
                    isActive
                      ? 'bg-[#eaf1ff] text-[#1d4ed8] font-semibold border-l-2 border-[#2563eb]'
                      : 'text-[#374151] hover:bg-[#f6f7f9]'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <FileText
                      className={`w-3.5 h-3.5 mt-0.5 flex-none transition ${
                        isActive ? 'text-[#2563eb]' : 'text-[#9aa2af] group-hover:text-[#4b5563]'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate pr-1 flex items-center gap-1 font-medium"
                        title={meeting.title}
                      >
                        {meeting.isPinned && (
                          <Pin className="w-3 h-3 text-[#f59e0b] flex-none" />
                        )}
                        <span className="truncate">{meeting.title}</span>
                      </div>
                      <div className="text-[11px] text-[#9aa2af] font-normal flex items-center gap-1.5 mt-0.5 truncate">
                        <span>{meeting.duration}</span>
                        {meeting.summary ? (
                          <span className="text-[#15803d] font-medium truncate">&bull; MOM Ready</span>
                        ) : (
                          <span className="text-[#92400e] font-medium truncate">&bull; No Summary</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Context Menu Trigger */}
                  <div className="relative flex-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : meeting.id);
                      }}
                      className={`p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition cursor-pointer ${
                        isMenuOpen
                          ? 'opacity-100 bg-gray-200/80 text-gray-800'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Meeting options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Context Menu Dropdown */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#e5e7eb] rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            togglePinMeeting(meeting.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition font-medium cursor-pointer"
                        >
                          {meeting.isPinned ? (
                            <PinOff className="w-3.5 h-3.5" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                          <span>{meeting.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            openRenameModal(meeting);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition font-medium cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Rename</span>
                        </button>
                        <div className="h-px bg-gray-100 my-0.5" />
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            openDeleteModal(meeting);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition font-medium cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Minimized Rail Spacer (Takes up vertical space when meeting notes are hidden) */}
      {!isDrawer && <div className="flex-1 lg:hidden" />}

      {/* 6. FOOTER ACTIONS (Pinned to bottom: Settings, About, Version) */}
      <div className="border-t border-[#e5e7eb] pt-2.5 pb-2 px-2 lg:px-3 mt-auto flex flex-col gap-2 flex-none">
        {/* Secondary Buttons: Settings & About */}
        {isDrawer ? (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setCurrentScreen('settings');
                setSettingsTab('recording');
                setIsMobileOpen(false);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-[12px] border border-[#e5e7eb] transition cursor-pointer truncate ${
                currentScreen === 'settings'
                  ? 'bg-[#eaf1ff] text-[#1e3a8a] border-[#bfdbfe]'
                  : 'bg-[#eef0f2] text-[#374151] hover:bg-[#e4e7ea]'
              }`}
            >
              <Settings className="w-3.5 h-3.5 flex-none" />
              <span className="truncate">Settings</span>
            </button>
            <button
              onClick={() => {
                openModal('about');
                setIsMobileOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-[12px] bg-[#eef0f2] text-[#374151] hover:bg-[#e4e7ea] border border-[#e5e7eb] transition cursor-pointer truncate"
            >
              <Info className="w-3.5 h-3.5 flex-none" />
              <span className="truncate">About</span>
            </button>
          </div>
        ) : (
          <>
            {/* Expanded 2-Column Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setCurrentScreen('settings');
                  setSettingsTab('recording');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-[12px] border border-[#e5e7eb] transition cursor-pointer truncate ${
                  currentScreen === 'settings'
                    ? 'bg-[#eaf1ff] text-[#1e3a8a] border-[#bfdbfe]'
                    : 'bg-[#eef0f2] text-[#374151] hover:bg-[#e4e7ea]'
                }`}
              >
                <Settings className="w-3.5 h-3.5 flex-none" />
                <span className="truncate">Settings</span>
              </button>
              <button
                onClick={() => openModal('about')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-[12px] bg-[#eef0f2] text-[#374151] hover:bg-[#e4e7ea] border border-[#e5e7eb] transition cursor-pointer truncate"
              >
                <Info className="w-3.5 h-3.5 flex-none" />
                <span className="truncate">About</span>
              </button>
            </div>

            {/* Collapsed Icon Stack */}
            <div className="flex lg:hidden flex-col items-center gap-1.5">
              <button
                onClick={() => {
                  setCurrentScreen('settings');
                  setSettingsTab('recording');
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  currentScreen === 'settings'
                    ? 'bg-[#eaf1ff] text-[#1e3a8a] border border-[#bfdbfe]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => openModal('about')}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                title="About Minomeet"
                aria-label="About Minomeet"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Version Tag */}
        {isDrawer ? (
          <div className="text-center text-[10px] text-[#9aa2af] mt-1 tracking-tight flex-none">
            v1.2.2 &bull; Minomeet On-Device AI
          </div>
        ) : (
          <>
            <div className="text-center text-[10px] text-[#9aa2af] mt-1 tracking-tight flex-none hidden lg:block">
              v1.2.2 &bull; Minomeet On-Device AI
            </div>
            <div className="text-center text-[9px] text-[#9aa2af] mt-0.5 tracking-tight flex-none lg:hidden font-mono">
              v1.2
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Hamburger Button (< 640px) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="sm:hidden fixed left-3 bottom-3 z-40 p-2.5 rounded-full bg-white shadow-xl border border-[#e5e7eb] text-gray-700 hover:text-[#2563eb] transition cursor-pointer"
        title="Open Menu"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer Backdrop (< 640px) */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="sm:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Drawer Aside (< 640px) */}
      <aside
        className={`sm:hidden fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-white border-r border-[#e5e7eb] flex flex-col shadow-2xl transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#f3f4f6]">
          <span className="font-bold text-xs text-[#1e3a8a] tracking-tight">Navigation</span>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title="Close Menu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderSidebarBody(true)}
        </div>
      </aside>

      {/* Responsive Main Sidebar (w-16 on tablet/narrow desktop, lg:w-[260px] on desktop) */}
      <aside
        className="hidden sm:flex relative w-16 lg:w-[260px] h-full flex-col shrink-0 overflow-hidden border-r border-[#e5e7eb] bg-white dark:bg-neutral-900 dark:border-neutral-800 transition-[width] duration-200 ease-out select-none"
      >
        {renderSidebarBody(false)}
      </aside>
    </>
  );
};
