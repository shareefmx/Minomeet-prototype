import express, { Request, Response } from 'express';
import {
  getCalendarConfig,
  getAccounts,
  signOutAccount,
  signOutAll,
  clearEventsCache,
  createSignInSession,
  handleOAuthCallback,
  fetchEventsForAccount,
  deduplicateAndSortEvents,
  getCachedEvents,
  saveCachedEvents,
  CalendarEvent
} from '../services/calendarService.js';

export const calendarRouter = express.Router();

// GET /api/calendar/providers-config & GET /api/calendar/config
calendarRouter.get(['/providers-config', '/config'], (_req: Request, res: Response) => {
  const config = getCalendarConfig();
  res.json(config);
});

// GET /api/calendar/accounts
calendarRouter.get('/accounts', (_req: Request, res: Response) => {
  const accounts = getAccounts();
  res.json(accounts);
});

// POST /api/calendar/sign-in/:provider
calendarRouter.post('/sign-in/:provider', (req: Request, res: Response) => {
  const prov = String(req.params.provider || '').toLowerCase();

  if (prov !== 'google' && prov !== 'microsoft') {
    return res.status(400).json({ error: 'Unsupported provider. Allowed: google, microsoft' });
  }

  try {
    const protocol = req.protocol;
    const host = req.get('host') || 'localhost:5001';
    const redirectUri = `${protocol}://${host}/api/calendar/oauth/callback`;

    const session = createSignInSession(prov as 'google' | 'microsoft', redirectUri);
    res.json({
      authUrl: session.authUrl,
      state: session.state,
      redirectUri
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start sign-in' });
  }
});

// POST /api/calendar/cancel-sign-in
calendarRouter.post('/cancel-sign-in', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// GET /api/calendar/oauth/callback
calendarRouter.get('/oauth/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  if (error) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Failed</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px; max-width: 420px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✕</div>
            <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px;">Authentication Cancelled</h2>
            <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">${error || 'Provider rejected authentication request.'}</p>
            <button onclick="window.close()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state parameter');
  }

  try {
    const protocol = req.protocol;
    const host = req.get('host') || 'localhost:5001';
    const redirectUri = `${protocol}://${host}/api/calendar/oauth/callback`;

    const account = await handleOAuthCallback(code, state, redirectUri);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px; max-width: 420px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px;">Connected to Minomeet</h2>
            <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">Successfully signed in as <strong>${account.email}</strong>. You may close this tab.</p>
            <button onclick="window.close()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;">Close Tab</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'MINOMEET_CALENDAR_CONNECTED', account: ${JSON.stringify(account)} }, '*');
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// GET /api/calendar/events
calendarRouter.get('/events', async (req: Request, res: Response) => {
  const from = (req.query.dateFrom || req.query.from) as string;
  const to = (req.query.dateTo || req.query.to) as string;
  const accountIdsFilter = req.query.accountIds ? (req.query.accountIds as string).split(',') : null;

  // Validate ISO dates
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing dateFrom and dateTo parameters' });
  }

  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  if (isNaN(fromTime) || isNaN(toTime)) {
    return res.status(400).json({ error: 'Invalid ISO date string provided' });
  }

  // Max 31-day range validation
  const maxRangeMs = 31 * 24 * 60 * 60 * 1000;
  if (toTime - fromTime > maxRangeMs || toTime < fromTime) {
    return res.status(400).json({ error: 'Date range must be positive and at most 31 days' });
  }

  const accounts = getAccounts().filter(a => {
    if (a.status !== 'active') return false;
    if (accountIdsFilter && !accountIdsFilter.includes(a.id)) return false;
    return true;
  });

  if (accounts.length === 0) {
    return res.json([]);
  }

  try {
    const fetchedLists = await Promise.all(
      accounts.map(async acc => {
        try {
          return await fetchEventsForAccount(acc, from, to);
        } catch (err: any) {
          console.warn(`Failed fetching events for account ${acc.id}:`, err.message);
          return null;
        }
      })
    );

    const hasAnySuccess = fetchedLists.some(list => list !== null);
    if (!hasAnySuccess) {
      // Fallback to cached events marked isOfflineCache: true
      const cached = getCachedEvents().filter(e => {
        const evStart = new Date(e.start).getTime();
        return evStart >= fromTime && evStart <= toTime;
      });
      return res.json(cached.map(e => ({ ...e, isOfflineCache: true })));
    }

    const allEvents: CalendarEvent[] = [];
    for (const list of fetchedLists) {
      if (list) allEvents.push(...list);
    }

    const deduped = deduplicateAndSortEvents(allEvents);
    saveCachedEvents(deduped);
    res.json(deduped);
  } catch (err: any) {
    console.error('Error fetching calendar events:', err);
    // Serve offline cache
    const cached = getCachedEvents().filter(e => {
      const evStart = new Date(e.start).getTime();
      return evStart >= fromTime && evStart <= toTime;
    });
    res.json(cached.map(e => ({ ...e, isOfflineCache: true })));
  }
});

// DELETE /api/calendar/accounts/:id
calendarRouter.delete('/accounts/:id', (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  try {
    signOutAccount(id);
    res.json({ success: true, message: `Account ${id} removed` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sign out account' });
  }
});

// DELETE /api/calendar/cache
calendarRouter.delete('/cache', (_req: Request, res: Response) => {
  try {
    const cleared = clearEventsCache();
    res.json({ success: true, cleared });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear cache' });
  }
});

// DELETE /api/calendar/all
calendarRouter.delete('/all', (_req: Request, res: Response) => {
  try {
    signOutAll();
    res.json({ success: true, message: 'All calendar accounts and tokens purged' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to purge calendar data' });
  }
});

// POST /api/calendar/reauthenticate/:id
calendarRouter.post('/reauthenticate/:id', (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const account = getAccounts().find(a => a.id === id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    const protocol = req.protocol;
    const host = req.get('host') || 'localhost:5001';
    const redirectUri = `${protocol}://${host}/api/calendar/oauth/callback`;

    const session = createSignInSession(account.provider, redirectUri);
    res.json({
      authUrl: session.authUrl,
      state: session.state,
      redirectUri
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start reauthentication' });
  }
});
