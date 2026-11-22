import React, { useState, useEffect } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { api } from '../../services/api';
import { LogOut, X, AlertTriangle } from 'lucide-react';

export const CalendarSignOutModal: React.FC = () => {
  const {
    modals,
    closeModal,
    calendarAccounts,
    signOutCalendarAccount,
    showToast,
    openModal,
    refreshCalendarAccounts
  } = useMeeting();

  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (calendarAccounts.length > 0) {
      setSelectedTarget(calendarAccounts[0].id);
    }
  }, [calendarAccounts]);

  if (!modals.calendarSignOut) return null;

  const handleClose = () => {
    if (!isSubmitting) {
      closeModal('calendarSignOut');
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      if (calendarAccounts.length <= 1) {
        if (calendarAccounts.length === 1) {
          await signOutCalendarAccount(calendarAccounts[0].id);
        }
      } else {
        if (selectedTarget === 'all') {
          await api.signOutAllCalendar();
          await refreshCalendarAccounts();
          showToast('Signed out of all accounts', 'Calendar disconnected', 'info');
          openModal('connectCalendar');
        } else {
          await signOutCalendarAccount(selectedTarget);
        }
      }
      closeModal('calendarSignOut');
    } catch (err: any) {
      showToast('Sign out error', err?.message || 'Failed to sign out', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const singleAccount = calendarAccounts.length === 1 ? calendarAccounts[0] : null;

  return (
    <div
      className="fixed inset-0 bg-[#0f1117]/65 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] w-[calc(100vw-2rem)] max-w-sm p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center flex-none">
            <LogOut className="w-5 h-5" />
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            title="Close dialog (Esc)"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {singleAccount ? (
          <div>
            <h3 id="sign-out-modal-title" className="text-base font-black text-[#111827]">
              Sign out of Calendar
            </h3>
            <p className="text-xs text-[#4b5563] mt-2 leading-relaxed">
              Sign out of <strong className="text-[#111827]">{singleAccount.email}</strong>? Your meetings will no longer appear.
            </p>
          </div>
        ) : (
          <div>
            <h3 id="sign-out-modal-title" className="text-base font-black text-[#111827]">
              Which account do you want to sign out of?
            </h3>
            <p className="text-xs text-[#6b7280] mt-1">
              Select an account or choose both to disconnect your calendar completely.
            </p>

            {/* Radio options */}
            <div className="mt-3.5 space-y-2">
              {calendarAccounts.map((acc) => (
                <label
                  key={acc.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    selectedTarget === acc.id
                      ? 'border-[#2563eb] bg-[#eff6ff]/50'
                      : 'border-[#e5e7eb] hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="account-signout-choice"
                    value={acc.id}
                    checked={selectedTarget === acc.id}
                    onChange={() => setSelectedTarget(acc.id)}
                    className="w-4 h-4 text-[#2563eb] focus:ring-[#2563eb]"
                  />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-none"
                      style={{ backgroundColor: acc.provider === 'google' ? '#2563eb' : '#0284c7' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#111827] truncate">
                        {acc.provider === 'google' ? 'Google' : 'Microsoft'} ({acc.email})
                      </p>
                    </div>
                  </div>
                </label>
              ))}

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  selectedTarget === 'all'
                    ? 'border-[#2563eb] bg-[#eff6ff]/50'
                    : 'border-[#e5e7eb] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="account-signout-choice"
                  value="all"
                  checked={selectedTarget === 'all'}
                  onChange={() => setSelectedTarget('all')}
                  className="w-4 h-4 text-[#2563eb] focus:ring-[#2563eb]"
                />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-[#111827]">Both accounts</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl border border-[#e5e7eb] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {isSubmitting ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
};
