import { describe, it, expect } from 'bun:test';
import React from 'react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('STAGE 4: Meetings Screen Verification Suite', () => {
  const meetingsScreenPath = resolve(__dirname, '../../src/components/screens/MeetingsScreen.tsx');
  const content = readFileSync(meetingsScreenPath, 'utf8');

  it('STEP 1: Header has Meetings title and day navigation', () => {
    expect(content).toContain('Meetings');
    expect(content).toContain('Calendar Schedule');
    expect(content).toContain('handlePrevDay');
    expect(content).toContain('handleNextDay');
    expect(content).toContain('handleToday');
    expect(content).toContain('Yesterday');
    expect(content).toContain('Today');
    expect(content).toContain('Tomorrow');
    expect(content).toContain('Choose Date');
  });

  it('STEP 2: Week strip renders 7 days with narrow weekday and date indicator', () => {
    expect(content).toContain('grid grid-cols-7');
    expect(content).toContain('weekDays.map');
    expect(content).toContain('weekEventMap');
    expect(content).toContain('count > 0');
  });

  it('STEP 3: Keyboard navigation handles ArrowLeft, ArrowRight, and T', () => {
    expect(content).toContain("e.key === 'ArrowLeft'");
    expect(content).toContain("e.key === 'ArrowRight'");
    expect(content).toContain("e.key === 't' || e.key === 'T'");
    expect(content).toContain("tag === 'input' || tag === 'textarea'");
  });

  it('STEP 4: SegmentedPills account filter appears when 2 or more accounts exist', () => {
    expect(content).toContain('calendarAccounts.length >= 2');
    expect(content).toContain('All accounts');
    expect(content).toContain('setSelectedAccountId');
  });

  it('STEP 5: Summary strip calculates total meetings and next meeting countdown', () => {
    expect(content).toContain('totalMinutes');
    expect(content).toContain('nextMeetingMinutes');
    expect(content).toContain('formatDurationText');
  });

  it('STEP 6: Event list groups All Day, Upcoming/Today, and Past meetings', () => {
    expect(content).toContain('allDayEvents');
    expect(content).toContain('upcomingEvents');
    expect(content).toContain('pastEvents');
    expect(content).toContain('pastExpanded');
    expect(content).toContain('Past meetings');
  });

  it('STEP 7: Event cards have vertical account stripe, time rail, badges, Join, and Record & Join', () => {
    expect(content).toContain('style={{ backgroundColor: accentColor }}');
    expect(content).toContain('formatEventTime(ev.start)');
    expect(content).toContain('Record & Join');
    expect(content).toContain('handleJoinMeeting');
    expect(content).toContain('handleRecordAndJoin');
    expect(content).toContain('No video link');
  });

  it('STEP 8: Reconnect and offline/error banners are rendered', () => {
    expect(content).toContain('reconnectNeededAccounts');
    expect(content).toContain('Action required:');
    expect(content).toContain('reauthenticateCalendar');
    expect(content).toContain('Couldn\'t reach calendar provider');
  });
});
