import { describe, test, expect, beforeEach } from 'bun:test';
import fs from 'fs';
import path from 'path';

describe('STAGE 1: Sidebar Meetings Entry & Connect Calendar Modal Verification Suite', () => {
  const desktopRoot = path.resolve(__dirname, '../../');
  const webRoot = path.resolve(__dirname, '../../../../minomeet/client');

  test('STEP 1: Sidebar nav item "Meetings" is placed directly BELOW "Home"', () => {
    const desktopSidebar = fs.readFileSync(path.join(desktopRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');
    const webSidebar = fs.readFileSync(path.join(webRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');

    for (const code of [desktopSidebar, webSidebar]) {
      // Must contain Home button
      expect(code).toContain('title="Home Dashboard"');
      // Must contain Meetings button
      expect(code).toContain('title="Meetings"');
      expect(code).toContain('aria-label="Meetings"');

      // Index of Home must be strictly before Meetings
      const homeIdx = code.indexOf('title="Home Dashboard"');
      const meetingsIdx = code.indexOf('title="Meetings"');
      const askAiIdx = code.indexOf('title="Ask Your Meetings AI"');

      expect(homeIdx).toBeGreaterThan(-1);
      expect(meetingsIdx).toBeGreaterThan(homeIdx);
      expect(askAiIdx).toBeGreaterThan(meetingsIdx);
    }
  });

  test('STEP 2: Sidebar nav item supports responsive expanded and collapsed rail modes', () => {
    const desktopSidebar = fs.readFileSync(path.join(desktopRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');
    const webSidebar = fs.readFileSync(path.join(webRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');

    for (const code of [desktopSidebar, webSidebar]) {
      // Collapsed rail mode uses justify-center, expanded uses lg:justify-start
      expect(code).toContain('justify-center lg:justify-start');
      // Meetings label is hidden on rail, inline on expanded
      expect(code).toContain('hidden lg:inline');
      // Contains Calendar icon
      expect(code).toContain('<Calendar');
      // Contains 'New' badge pill
      expect(code).toContain('New');
      expect(code).toContain('hasSeenMeetingsNav');
    }
  });

  test('STEP 3: Click behavior checks connection status before routing or opening modal', () => {
    const desktopSidebar = fs.readFileSync(path.join(desktopRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');
    const webSidebar = fs.readFileSync(path.join(webRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');

    for (const code of [desktopSidebar, webSidebar]) {
      expect(code).toContain('calendarAccounts.length > 0');
      expect(code).toContain("setCurrentScreen('meetings')");
      expect(code).toContain("openModal('connectCalendar')");
      expect(code).toContain('markMeetingsNavSeen()');
    }
  });

  test('STEP 4: ConnectCalendarModal has required privacy statement and SVG marks', () => {
    const desktopModal = fs.readFileSync(path.join(desktopRoot, 'src/components/modals/ConnectCalendarModal.tsx'), 'utf-8');
    const webModal = fs.readFileSync(path.join(webRoot, 'src/components/modals/ConnectCalendarModal.tsx'), 'utf-8');

    for (const code of [desktopModal, webModal]) {
      // Max width sm & rounded-2xl
      expect(code).toContain('max-w-sm');
      expect(code).toContain('rounded-2xl');

      // Title
      expect(code).toContain('Connect your calendar');

      // Rule 3 Privacy line
      expect(code).toContain('Minomeet reads your calendar events only. Nothing is written to your calendar. Tokens stay on this device.');

      // Google and Microsoft buttons
      expect(code).toContain('Continue with Google');
      expect(code).toContain('Continue with Microsoft Outlook');

      // Inline SVG marks (no external images)
      expect(code).toContain('<svg');
      expect(code).toContain('#4285F4'); // Google blue
      expect(code).toContain('#f25022'); // Microsoft orange
    }
  });

  test('STEP 5: ConnectCalendarModal supports browser authorization waiting, cancel, and 3-minute timeout', () => {
    const desktopModal = fs.readFileSync(path.join(desktopRoot, 'src/components/modals/ConnectCalendarModal.tsx'), 'utf-8');
    const webModal = fs.readFileSync(path.join(webRoot, 'src/components/modals/ConnectCalendarModal.tsx'), 'utf-8');

    for (const code of [desktopModal, webModal]) {
      expect(code).toContain('Complete sign-in in your browser…');
      expect(code).toContain('cancelCalendarSignIn');
      expect(code).toContain('isAuthorizing');
    }

    const desktopContext = fs.readFileSync(path.join(desktopRoot, 'src/context/MeetingContext.tsx'), 'utf-8');
    const webContext = fs.readFileSync(path.join(webRoot, 'src/context/MeetingContext.tsx'), 'utf-8');

    for (const code of [desktopContext, webContext]) {
      // 3-minute (180,000 ms) timeout with clear error
      expect(code).toContain('180000');
      expect(code).toContain('Sign-in timed out after 3 minutes. Please try again.');
    }
  });

  test('STEP 6: ConnectCalendarModal inline error handling and Retry button', () => {
    const desktopModal = fs.readFileSync(path.join(desktopRoot, 'src/components/modals/ConnectCalendarModal.tsx'), 'utf-8');
    const webModal = fs.readFileSync(path.join(webRoot, 'src/components/modals/ConnectCalendarModal.tsx'), 'utf-8');

    for (const code of [desktopModal, webModal]) {
      expect(code).toContain('hasError');
      expect(code).toContain('Sign-in Error:');
      expect(code).toContain('Retry');
      expect(code).toContain('startCalendarSignIn(currentProvider)');
    }
  });

  test('STEP 7: App shell mounts MeetingsScreen and ConnectCalendarModal', () => {
    const desktopApp = fs.readFileSync(path.join(desktopRoot, 'src/App.tsx'), 'utf-8');
    const webApp = fs.readFileSync(path.join(webRoot, 'src/App.tsx'), 'utf-8');

    for (const code of [desktopApp, webApp]) {
      expect(code).toContain("currentScreen === 'meetings' && <MeetingsScreen");
      expect(code).toContain('<ConnectCalendarModal');
    }
  });
});
