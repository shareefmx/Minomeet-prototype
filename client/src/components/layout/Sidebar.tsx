import React, { useState, useEffect } from 'react';
import { useMeeting } from '../../context/MeetingContext.js';
import {
  Search,
  Home,
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
  Sparkles,
  ChevronLeft,
  ChevronRight,
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
    setSettingsTab
  } = useMeeting();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [userToggled, setUserToggled] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState<boolean>(false);

  // Responsive breakpoint tracking (< 1024px auto-collapse, < 800px mobile drawer)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 800;
      setIsNarrowViewport(isMobile);

      if (!userToggled) {
        if (width < 1024 && !isMobile) {
          setIsCollapsed(true);
        } else if (width >= 1024) {
          setIsCollapsed(false);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userToggled]);

  // Close dropdown on click outside & handle Esc for mobile drawer
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
        if (isMobileOpen) setIsMobileOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  const toggleSidebarCollapse = () => {
    setUserToggled(true);
    setIsCollapsed(prev => !prev);
  };

  const filteredMeetings = meetings.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.summary?.summary.toLowerCase().includes(q) ||
      m.transcript.some(t => t.text.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Render Inner Content of Sidebar
  const renderSidebarContent = (collapsed: boolean) => {
    if (collapsed) {
      return (
        <div className="flex flex-col h-full items-center justify-between py-1 select-none">
          {/* Top Section */}
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Logo Icon */}
            <button
              onClick={() => setCurrentScreen('home')}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#4f46e5] text-white flex items-center justify-center shadow-sm hover:scale-105 transition cursor-pointer"
              title="Minomeet AI - Home"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </button>

            {/* Expand Chevron Toggle */}
            <button
              onClick={toggleSidebarCollapse}
              className="p-1.5 rounded-lg border border-[#e5e7eb] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Search Icon Trigger */}
            <button
              onClick={() => {
                toggleSidebarCollapse();
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
              title="Search Meetings (Expand)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Nav Icon Buttons */}
            <nav className="flex flex-col items-center gap-1.5 w-full mt-1">
              <button
                onClick={() => setCurrentScreen('home')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  currentScreen === 'home'
                    ? 'bg-[#eaf1ff] text-[#1e3a8a]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Home Dashboard"
              >
                <Home className="w-4 h-4" />
              </button>

              <button
                onClick={() => openModal('ask')}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#4f46e5] hover:bg-[#eef2ff] transition cursor-pointer relative"
                title="Ask Your Meetings AI"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#7c3aed]" />
              </button>
            </nav>

            {/* Meeting Notes Mini Rail */}
            <div className="w-8 border-t border-[#e5e7eb] my-1 pt-1.5 flex flex-col items-center gap-1.5 overflow-y-auto max-h-[35vh] no-scrollbar">
              <span className="text-[10px] font-bold text-gray-400" title={`Meeting Notes (${filteredMeetings.length})`}>
                <FileText className="w-3.5 h-3.5" />
              </span>
              {filteredMeetings.slice(0, 6).map((m) => {
                const isActive = currentScreen === 'notes' && activeMeeting?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => selectMeeting(m)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition cursor-pointer truncate ${
                      isActive
                        ? 'bg-[#eaf1ff] text-[#1d4ed8] border border-[#bfdbfe]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={`${m.title} (${m.duration})`}
                  >
                    {m.title.charAt(0).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Icon Buttons */}
          <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[#e5e7eb]">
            <button
              onClick={isRecording ? () => stopRecording() : () => startRecording()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition cursor-pointer ${
                isRecording
                  ? 'bg-[#c2453c] animate-pulse ring-2 ring-[#e2564c]/40'
                  : 'bg-[#e2564c] hover:bg-[#d4483e]'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={() => openModal('import')}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#dbeafe] text-[#1e3a8a] hover:bg-[#bfdbfe] transition cursor-pointer border border-[#bfdbfe]"
              title="Import Recording"
            >
              <Upload className="w-4 h-4" />
            </button>

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
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => openModal('about')}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              title="About Minomeet"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Expanded Sidebar Layout
    return (
      <div className="flex flex-col h-full overflow-hidden select-none">
        {/* Brand Header with Logo, Name & Collapse Chevron */}
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-[#f3f4f6]">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-2.5 group cursor-pointer text-left min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#4f46e5] text-white flex items-center justify-center shadow-xs flex-none group-hover:scale-105 transition">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-[#1e3a8a]">
                  Minomeet
                </span>
                <span className="text-[9.5px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium truncate">
                On-Device Meeting Notes
              </p>
            </div>
          </button>

          {/* Collapse Button */}
          <button
            onClick={toggleSidebarCollapse}
            className="p-1.5 rounded-lg border border-[#e5e7eb] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer flex-none ml-1"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center my-2.5">
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
              className="absolute right-2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 mb-2">
          <button
            onClick={() => {
              setCurrentScreen('home');
              if (isNarrowViewport) setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-bold transition text-left cursor-pointer ${
              currentScreen === 'home'
                ? 'bg-[#eaf1ff] text-[#1e3a8a]'
                : 'text-[#111827] hover:bg-[#f3f4f6]'
            }`}
          >
            <Home className="w-4 h-4 text-[#4b5563] flex-none" />
            <span className="truncate">Home</span>
          </button>

          <button
            onClick={() => {
              openModal('ask');
              if (isNarrowViewport) setIsMobileOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold transition text-left cursor-pointer text-[#4f46e5] hover:bg-[#eef2ff] group"
          >
            <MessageSquare className="w-4 h-4 text-[#4f46e5] flex-none group-hover:scale-110 transition" />
            <span className="truncate">Ask Your Meetings</span>
            <span className="ml-auto text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#f2e9ff] text-[#7c3aed] flex-none">AI</span>
          </button>
        </nav>

        {/* Section Label */}
        <div className="flex items-center gap-2 text-[12px] font-extrabold text-[#111827] mt-1.5 mb-1.5 px-1">
          <FileText className="w-3.5 h-3.5 text-[#6b7280] flex-none" />
          <span className="truncate">Meeting Notes</span>
          <span className="ml-auto text-xs text-[#9aa2af] font-normal flex-none">({filteredMeetings.length})</span>
        </div>

        {/* Meeting Notes List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1 no-scrollbar min-h-0">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-6 px-2 text-xs text-[#9aa2af]">
              {searchQuery ? 'No meetings matching search.' : 'No recorded meetings yet.'}
            </div>
          ) : (
            filteredMeetings.map((meeting) => {
              const isActive = currentScreen === 'notes' && activeMeeting?.id === meeting.id;
              const isMenuOpen = openMenuId === meeting.id;

              return (
                <div
                  key={meeting.id}
                  onClick={() => {
                    selectMeeting(meeting);
                    if (isNarrowViewport) setIsMobileOpen(false);
                  }}
                  className={`relative flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12.5px] leading-snug transition group ${
                    isActive
                      ? 'bg-[#eaf1ff] text-[#1d4ed8] font-semibold border-l-2 border-[#2563eb]'
                      : 'text-[#374151] hover:bg-[#f6f7f9]'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <FileText className={`w-3.5 h-3.5 mt-0.5 flex-none transition ${isActive ? 'text-[#2563eb]' : 'text-[#9aa2af] group-hover:text-[#4b5563]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate pr-1 flex items-center gap-1 font-medium" title={meeting.title}>
                        {meeting.isPinned && <Pin className="w-3 h-3 text-[#f59e0b] flex-none" />}
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

                  {/* Three-dot Context Menu Trigger */}
                  <div className="relative flex-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : meeting.id);
                      }}
                      className={`p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition cursor-pointer ${
                        isMenuOpen ? 'opacity-100 bg-gray-200/80 text-gray-800' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Meeting options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Dropdown Menu Popup */}
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
                          {meeting.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
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
              );
            })
          )}
        </div>

        {/* Sidebar Bottom Actions */}
        <div className="border-t border-[#e5e7eb] pt-2.5 mt-2 flex flex-col gap-2 flex-none">
          {/* Record Button */}
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              else startRecording();
              if (isNarrowViewport) setIsMobileOpen(false);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-[13px] text-white shadow-sm transition active:scale-[0.99] cursor-pointer ${
              isRecording
                ? 'bg-[#c2453c] animate-pulse ring-2 ring-[#e2564c]/40'
                : 'bg-[#e2564c] hover:bg-[#d4483e]'
            }`}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'animate-spin' : ''}`} />
            <span className="truncate">{isRecording ? 'Recording in progress…' : 'Start Recording'}</span>
          </button>

          {/* Import Recording Button */}
          <button
            onClick={() => {
              openModal('import');
              if (isNarrowViewport) setIsMobileOpen(false);
            }}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-[13px] bg-[#dbeafe] text-[#1e3a8a] hover:bg-[#bfdbfe] transition cursor-pointer border border-[#bfdbfe]"
          >
            <Upload className="w-4 h-4 flex-none" />
            <span className="truncate">Import Recording</span>
          </button>

          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setCurrentScreen('settings');
                setSettingsTab('recording');
                if (isNarrowViewport) setIsMobileOpen(false);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-[12px] border border-[#e5e7eb] transition cursor-pointer truncate ${
                currentScreen === 'settings' ? 'bg-[#eaf1ff] text-[#1e3a8a] border-[#bfdbfe]' : 'bg-[#eef0f2] text-[#374151] hover:bg-[#e4e7ea]'
              }`}
            >
              <Settings className="w-3.5 h-3.5 flex-none" />
              <span className="truncate">Settings</span>
            </button>
            <button
              onClick={() => {
                openModal('about');
                if (isNarrowViewport) setIsMobileOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-[12px] bg-[#eef0f2] text-[#374151] hover:bg-[#e4e7ea] border border-[#e5e7eb] transition cursor-pointer truncate"
            >
              <Info className="w-3.5 h-3.5 flex-none" />
              <span className="truncate">About</span>
            </button>
          </div>
        </div>

        {/* Version Tag */}
        <div className="text-center text-[10px] text-[#9aa2af] mt-1.5 tracking-tight flex-none">
          v1.2.2 &bull; Minomeet On-Device AI
        </div>
      </div>
    );
  };

  // On narrow viewports (< 800px): overlay drawer
  if (isNarrowViewport) {
    return (
      <>
        {/* Floating Hamburger Button for Mobile / Narrow Viewports */}
        {!isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(true)}
            className="fixed left-3 bottom-3 z-40 p-2.5 rounded-full bg-white shadow-xl border border-[#e5e7eb] text-gray-700 hover:text-[#2563eb] transition cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Drawer Backdrop */}
        {isMobileOpen && (
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
          />
        )}

        {/* Drawer Content */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-[270px] bg-white border-r border-[#e5e7eb] p-3.5 flex flex-col shadow-2xl transition-transform duration-200 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f3f4f6]">
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
            {renderSidebarContent(false)}
          </div>
        </aside>
      </>
    );
  }

  // Standard Desktop / Tablet Layout
  const sidebarWidthClass = isCollapsed
    ? 'w-[64px]'
    : 'w-[240px] xl:w-[280px]';

  return (
    <aside
      className={`${sidebarWidthClass} flex-none border-r border-[#e5e7eb] bg-white flex flex-col p-3 sm:p-3.5 overflow-hidden select-none transition-all duration-200 ease-in-out`}
    >
      {renderSidebarContent(isCollapsed)}
    </aside>
  );
};
