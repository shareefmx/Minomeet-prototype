import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';

describe('Responsive Layout Verification Suite across 800px - 1920px & 560px - 1080px', () => {
  const desktopRoot = path.resolve(__dirname, '../../../../Minomeet-Desktop-Application/frontend');
  const webRoot = path.resolve(__dirname, '../../');

  test('STEP 1: Tauri window minWidth and minHeight constraints', () => {
    const tauriConfPath = path.join(desktopRoot, 'src-tauri/tauri.conf.json');
    const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
    const win = conf.app.windows[0];

    expect(win.minWidth).toBe(800);
    expect(win.minHeight).toBe(560);
    expect(win.resizable).toBe(true);
  });

  test('STEP 1: Global viewport CSS standards (box-sizing, dynamic dvh, no-scrollbar)', () => {
    const desktopCss = fs.readFileSync(path.join(desktopRoot, 'src/app/globals.css'), 'utf-8');
    const webCss = fs.readFileSync(path.join(webRoot, 'src/index.css'), 'utf-8');

    for (const css of [desktopCss, webCss]) {
      expect(css).toContain('box-sizing: border-box');
      expect(css).toContain('.no-scrollbar');
      expect(css).toContain('overflow: hidden');
    }
  });

  test('STEP 2: Sidebar responsive tokens (260px expanded, w-16 collapsed rail, no manual chevron toggle)', () => {
    const desktopSidebar = fs.readFileSync(path.join(desktopRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');
    const webSidebar = fs.readFileSync(path.join(webRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');

    for (const code of [desktopSidebar, webSidebar]) {
      expect(code).toContain('w-16');
      expect(code).toContain('lg:w-[260px]');
      expect(code).toContain('transition-[width]');
      expect(code).not.toContain('toggleSidebarCollapse');
      expect(code).not.toContain('ChevronRight');
      expect(code).not.toContain('ChevronLeft');
      expect(code).toContain('min-h-0');
      expect(code).toContain('truncate');
    }
  });

  test('STEP 3: HomeScreen responsive reflow (stats 3 to 2 to 1, hero banner close inside, model card stack)', () => {
    const desktopHome = fs.readFileSync(path.join(desktopRoot, 'src/components/screens/HomeScreen.tsx'), 'utf-8');
    const webHome = fs.readFileSync(path.join(webRoot, 'src/components/screens/HomeScreen.tsx'), 'utf-8');

    for (const code of [desktopHome, webHome]) {
      expect(code).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
      expect(code).toContain('sm:col-span-2 lg:col-span-1');
      expect(code).toContain('pr-12');
      expect(code).toContain('flex flex-col sm:flex-row sm:items-start');
    }
  });

  test('STEP 3: RecordingScreen responsive layout (flex-1 min-h-0, floating control bar wrapping)', () => {
    const desktopRec = fs.readFileSync(path.join(desktopRoot, 'src/components/screens/RecordingScreen.tsx'), 'utf-8');
    const webRec = fs.readFileSync(path.join(webRoot, 'src/components/screens/RecordingScreen.tsx'), 'utf-8');

    for (const code of [desktopRec, webRec]) {
      expect(code).toContain('flex-1 min-h-0 overflow-y-auto');
      expect(code).toContain('max-w-[calc(100vw-2rem)]');
      expect(code).toContain('rounded-2xl sm:rounded-full');
      expect(code).toContain('flex flex-wrap items-center justify-center');
    }
  });

  test('STEP 3: NotesScreen responsive toolbar and Action Items table wrapper', () => {
    const desktopNotes = fs.readFileSync(path.join(desktopRoot, 'src/components/screens/NotesScreen.tsx'), 'utf-8');
    const webNotes = fs.readFileSync(path.join(webRoot, 'src/components/screens/NotesScreen.tsx'), 'utf-8');

    for (const code of [desktopNotes, webNotes]) {
      expect(code).toContain('grid-cols-2 sm:grid-cols-4');
      expect(code).toContain('overflow-x-auto no-scrollbar');
      expect(code).toContain('min-w-[500px]');
      expect(code).toContain('max-w-3xl mx-auto w-full');
    }
  });

  test('STEP 3: SettingsScreen all tabs, SegmentedPills, and General Storage responsive cards', () => {
    const desktopSettings = fs.readFileSync(path.join(desktopRoot, 'src/components/screens/SettingsScreen.tsx'), 'utf-8');
    const webSettings = fs.readFileSync(path.join(webRoot, 'src/components/screens/SettingsScreen.tsx'), 'utf-8');

    for (const code of [desktopSettings, webSettings]) {
      expect(code).toContain('overflow-x-auto no-scrollbar');
      expect(code).toContain('grid-cols-1 sm:grid-cols-3');
      expect(code).toContain('grid-cols-1 md:grid-cols-2');
    }

    const desktopPills = fs.readFileSync(path.join(desktopRoot, 'src/components/screens/SettingsComponents.tsx'), 'utf-8');
    const webPills = fs.readFileSync(path.join(webRoot, 'src/components/screens/SettingsComponents.tsx'), 'utf-8');

    for (const code of [desktopPills, webPills]) {
      expect(code).toContain('overflow-x-auto no-scrollbar max-w-full');
      expect(code).toContain('whitespace-nowrap flex-none');
    }
  });

  test('STEP 4: Modals fit short window heights (560px-700px) with calc(100dvh-2rem) caps and scrolling body', () => {
    const modalFiles = [
      'AskMeetingsModal.tsx',
      'ModelSettingsModal.tsx',
      'ImportAudioModal.tsx',
      'AboutModal.tsx',
      'FollowUpEmailModal.tsx',
      'RenameMeetingModal.tsx',
      'DeleteConfirmModal.tsx'
    ];

    for (const file of modalFiles) {
      const desktopModal = fs.readFileSync(path.join(desktopRoot, `src/components/modals/${file}`), 'utf-8');
      const webModal = fs.readFileSync(path.join(webRoot, `src/components/modals/${file}`), 'utf-8');

      for (const code of [desktopModal, webModal]) {
        expect(code).toContain('calc(100dvh-2rem)');
        expect(code).toContain('no-scrollbar');
      }
    }
  });

  test('STEP 4: ToastHost bounded to viewport', () => {
    const desktopToast = fs.readFileSync(path.join(desktopRoot, 'src/components/layout/ToastHost.tsx'), 'utf-8');
    const webToast = fs.readFileSync(path.join(webRoot, 'src/components/layout/ToastHost.tsx'), 'utf-8');

    for (const code of [desktopToast, webToast]) {
      expect(code).toContain('w-[calc(100vw-1.5rem)]');
      expect(code).toContain('max-w-[360px]');
    }
  });
});
