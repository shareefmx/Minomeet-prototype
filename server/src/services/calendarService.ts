import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  saveAccountTokens,
  getAccountTokens,
  deleteAccountTokens,
  deleteAllTokens,
  StoredTokens
} from './calendarEncryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

const ACCOUNTS_FILE = path.join(DATA_DIR, 'calendar_accounts.json');
const CACHE_FILE = path.join(DATA_DIR, 'calendar_events_cache.json');

export interface CalendarAccount {
  id: string;
  provider: 'google' | 'microsoft';
  email: string;
  displayName: string;
  color: string;
  connectedAt: string;
  lastSyncAt?: string;
  status: 'active' | 'reconnect_needed' | 'sync_error';
}

export interface CalendarEvent {
  id: string;
  accountId: string;
  title: string;
  start: string; // ISO-8601
  end: string;   // ISO-8601
  isAllDay: boolean;
  joinUrl?: string;
  joinProvider?: 'google_meet' | 'teams' | 'zoom' | 'webex' | 'other';
  location?: string;
  organizer?: { name?: string; email?: string };
  attendeesCount?: number;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  responseStatus?: 'accepted' | 'tentative' | 'declined' | 'needsAction';
  color: string;
  isOfflineCache?: boolean;
}

export interface OAuthSession {
  state: string;
  provider: 'google' | 'microsoft';
  codeVerifier: string;
  codeChallenge: string;
  createdAt: number;
  completedAccount?: CalendarAccount;
  error?: string;
}

// In-memory active OAuth sessions (TTL 5 minutes)
const activeSessions = new Map<string, OAuthSession>();

// Purge sessions older than 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, sess] of activeSessions.entries()) {
    if (now - sess.createdAt > 300000) {
      activeSessions.delete(state);
    }
  }
}, 60000).unref();

export function getAccounts(): CalendarAccount[] {
  if (!fs.existsSync(ACCOUNTS_FILE)) return [];
  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: CalendarAccount[]): void {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save calendar accounts:', err);
  }
}

export function getCachedEvents(): CalendarEvent[] {
  if (!fs.existsSync(CACHE_FILE)) return [];
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCachedEvents(events: CalendarEvent[]): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(events, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save cached calendar events:', err);
  }
}

// RFC 7636 PKCE Generator
export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const randomBytes = crypto.randomBytes(32);
  const codeVerifier = randomBytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Sanitization & Join URL Allowlist Validation
export function sanitizeJoinUrl(urlStr: string): { url: string; provider: 'google_meet' | 'teams' | 'zoom' | 'webex' | 'other' } | null {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();

    if (host === 'meet.google.com') return { url: urlStr, provider: 'google_meet' };
    if (host === 'zoom.us' || host.endsWith('.zoom.us')) return { url: urlStr, provider: 'zoom' };
    if (host === 'teams.microsoft.com' || host === 'teams.live.com') return { url: urlStr, provider: 'teams' };
    if (host === 'webex.com' || host.endsWith('.webex.com')) return { url: urlStr, provider: 'webex' };

    return null;
  } catch {
    return null;
  }
}

export function extractJoinUrlFromText(text: string): { url: string; provider: 'google_meet' | 'teams' | 'zoom' | 'webex' | 'other' } | null {
  const urlRegex = /https:\/\/[^\s"'<>)]+/g;
  const matches = text.match(urlRegex);
  if (!matches) return null;

  for (const match of matches) {
    const sanitized = sanitizeJoinUrl(match);
    if (sanitized) return sanitized;
  }
  return null;
}

// Deduplicate events across accounts
export function deduplicateAndSortEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  const deduped: CalendarEvent[] = [];

  for (const ev of events) {
    const key = `${ev.title.trim().toLowerCase()}_${ev.start}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(ev);
    }
  }

  deduped.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return deduped;
}

// Client configuration detection
export function getCalendarConfig() {
  const googleClientId = process.env.MINOMEET_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const microsoftClientId = process.env.MINOMEET_MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '';

  return {
    googleConfigured: Boolean(googleClientId.trim()),
    microsoftConfigured: Boolean(microsoftClientId.trim()),
    googleClientId: googleClientId || undefined,
    microsoftClientId: microsoftClientId || undefined
  };
}

// Create OAuth authorization URL
export function createSignInSession(provider: 'google' | 'microsoft', redirectUri: string): { authUrl: string; state: string } {
  const cfg = getCalendarConfig();
  if (provider === 'google' && !cfg.googleConfigured) {
    throw new Error('Google Calendar is not configured. Set MINOMEET_GOOGLE_CLIENT_ID.');
  }
  if (provider === 'microsoft' && !cfg.microsoftConfigured) {
    throw new Error('Microsoft Outlook is not configured. Set MINOMEET_MICROSOFT_CLIENT_ID.');
  }

  const pkce = generatePkce();
  const state = generateState();

  activeSessions.set(state, {
    state,
    provider,
    codeVerifier: pkce.codeVerifier,
    codeChallenge: pkce.codeChallenge,
    createdAt: Date.now()
  });

  let authUrl = '';
  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: cfg.googleClientId!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
      code_challenge: pkce.codeChallenge,
      code_challenge_method: 'S256',
      state,
      access_type: 'offline',
      prompt: 'consent'
    });
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  } else {
    const params = new URLSearchParams({
      client_id: cfg.microsoftClientId!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email offline_access User.Read Calendars.Read',
      code_challenge: pkce.codeChallenge,
      code_challenge_method: 'S256',
      state,
      response_mode: 'query'
    });
    const tenant = process.env.MINOMEET_MICROSOFT_TENANT_ID || process.env.MICROSOFT_TENANT_ID || 'common';
    authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  return { authUrl, state };
}

// Handle OAuth loopback callback
export async function handleOAuthCallback(
  code: string,
  state: string,
  redirectUri: string
): Promise<CalendarAccount> {
  const session = activeSessions.get(state);
  if (!session) {
    throw new Error('Invalid or expired OAuth state');
  }

  const { provider, codeVerifier } = session;
  activeSessions.delete(state); // One-time use

  if (provider === 'google') {
    return await exchangeGoogleCode(code, codeVerifier, redirectUri);
  } else {
    return await exchangeMicrosoftCode(code, codeVerifier, redirectUri);
  }
}

// Google OAuth exchange
async function exchangeGoogleCode(code: string, codeVerifier: string, redirectUri: string): Promise<CalendarAccount> {
  const clientId = process.env.MINOMEET_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.MINOMEET_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  const params: Record<string, string> = {
    client_id: clientId,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  };
  if (clientSecret) {
    params.client_secret = clientSecret;
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token exchange failed: ${errText}`);
  }

  const tokenData = await res.json() as any;
  const now = Math.floor(Date.now() / 1000);

  // Fetch profile
  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  if (!userRes.ok) {
    throw new Error('Failed to retrieve user profile from Google');
  }
  const userInfo = await userRes.json() as any;

  const accountId = `google-${userInfo.sub}`;
  const account: CalendarAccount = {
    id: accountId,
    provider: 'google',
    email: userInfo.email,
    displayName: userInfo.name || userInfo.email,
    color: '#2563eb',
    connectedAt: new Date().toISOString(),
    status: 'active'
  };

  saveAccountTokens(accountId, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: now + (tokenData.expires_in || 3600)
  });

  const accounts = getAccounts().filter(a => a.id !== accountId);
  accounts.push(account);
  saveAccounts(accounts);

  return account;
}

// Microsoft OAuth exchange
async function exchangeMicrosoftCode(code: string, codeVerifier: string, redirectUri: string): Promise<CalendarAccount> {
  const clientId = process.env.MINOMEET_MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '';
  const clientSecret = process.env.MINOMEET_MICROSOFT_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '';

  const params: Record<string, string> = {
    client_id: clientId,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  };
  if (clientSecret) {
    params.client_secret = clientSecret;
  }

  const tenant = process.env.MINOMEET_MICROSOFT_TENANT_ID || process.env.MICROSOFT_TENANT_ID || 'common';
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Microsoft token exchange failed: ${errText}`);
  }

  const tokenData = await res.json() as any;
  const now = Math.floor(Date.now() / 1000);

  // Fetch profile
  const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  if (!meRes.ok) {
    throw new Error('Failed to retrieve user profile from Microsoft Graph');
  }
  const me = await meRes.json() as any;

  const email = me.mail || me.userPrincipalName || 'outlook-user@microsoft.com';
  const accountId = `microsoft-${me.id}`;
  const account: CalendarAccount = {
    id: accountId,
    provider: 'microsoft',
    email,
    displayName: me.displayName || email,
    color: '#0284c7',
    connectedAt: new Date().toISOString(),
    status: 'active'
  };

  saveAccountTokens(accountId, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: now + (tokenData.expires_in || 3600)
  });

  const accounts = getAccounts().filter(a => a.id !== accountId);
  accounts.push(account);
  saveAccounts(accounts);

  return account;
}

// Token refresh logic with invalid_grant detection
export async function getValidAccessToken(account: CalendarAccount): Promise<string> {
  const tokens = getAccountTokens(account.id);
  if (!tokens) {
    updateAccountStatus(account.id, 'reconnect_needed');
    throw new Error('Account tokens missing from encrypted store. Please reconnect.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (tokens.expiresAt - now > 120) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    updateAccountStatus(account.id, 'reconnect_needed');
    throw new Error('No refresh token available. Please reconnect.');
  }

  try {
    let newTokens: StoredTokens;
    if (account.provider === 'google') {
      newTokens = await refreshGoogleToken(tokens.refreshToken);
    } else {
      newTokens = await refreshMicrosoftToken(tokens.refreshToken);
    }
    saveAccountTokens(account.id, newTokens);
    updateAccountStatus(account.id, 'active');
    return newTokens.accessToken;
  } catch (err: any) {
    if (err.message && (err.message.includes('invalid_grant') || err.message.includes('revoked'))) {
      updateAccountStatus(account.id, 'reconnect_needed');
      throw new Error('Session expired. Please reconnect your account.');
    }
    throw err;
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<StoredTokens> {
  const clientId = process.env.MINOMEET_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.MINOMEET_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  const params: Record<string, string> = {
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  };
  if (clientSecret) params.client_secret = clientSecret;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token refresh failed: ${errText}`);
  }

  const data = await res.json() as any;
  const now = Math.floor(Date.now() / 1000);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: now + (data.expires_in || 3600)
  };
}

async function refreshMicrosoftToken(refreshToken: string): Promise<StoredTokens> {
  const clientId = process.env.MINOMEET_MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '';
  const clientSecret = process.env.MINOMEET_MICROSOFT_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '';

  const params: Record<string, string> = {
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  };
  if (clientSecret) params.client_secret = clientSecret;

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Microsoft token refresh failed: ${errText}`);
  }

  const data = await res.json() as any;
  const now = Math.floor(Date.now() / 1000);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: now + (data.expires_in || 3600)
  };
}

function updateAccountStatus(accountId: string, status: CalendarAccount['status']): void {
  const accounts = getAccounts();
  const acc = accounts.find(a => a.id === accountId);
  if (acc) {
    acc.status = status;
    saveAccounts(accounts);
  }
}

// Fetch events for account
export async function fetchEventsForAccount(
  account: CalendarAccount,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(account);

  if (account.provider === 'google') {
    return await fetchGoogleEvents(accessToken, account, timeMin, timeMax);
  } else {
    return await fetchMicrosoftEvents(accessToken, account, timeMin, timeMax);
  }
}

async function fetchGoogleEvents(
  token: string,
  account: CalendarAccount,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250'
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      updateAccountStatus(account.id, 'reconnect_needed');
      throw new Error('Google Calendar access token expired or revoked');
    }
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '5';
      throw new Error(`RATE_LIMITED_429: Retry after ${retryAfter} seconds`);
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Calendar API error: ${err}`);
    }

    const data = await res.json() as any;
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        const isAllDay = Boolean(item.start?.date);
        const startIso = item.start?.dateTime || (item.start?.date ? `${item.start.date}T00:00:00Z` : timeMin);
        const endIso = item.end?.dateTime || (item.end?.date ? `${item.end.date}T23:59:59Z` : timeMax);

        let detectedJoin: { url: string; provider: any } | null = null;
        if (item.conferenceData?.entryPoints) {
          for (const ep of item.conferenceData.entryPoints) {
            if (ep.uri) {
              const sanitized = sanitizeJoinUrl(ep.uri);
              if (sanitized) {
                detectedJoin = sanitized;
                break;
              }
            }
          }
        }
        if (!detectedJoin && item.hangoutLink) {
          detectedJoin = sanitizeJoinUrl(item.hangoutLink);
        }
        if (!detectedJoin) {
          const blob = `${item.location || ''} ${item.description || ''}`;
          detectedJoin = extractJoinUrlFromText(blob);
        }

        let status: 'confirmed' | 'tentative' | 'cancelled' = 'confirmed';
        if (item.status === 'cancelled') status = 'cancelled';
        else if (item.status === 'tentative') status = 'tentative';

        events.push({
          id: `google-${item.id}`,
          accountId: account.id,
          title: item.summary || '(Untitled Meeting)',
          start: startIso,
          end: endIso,
          isAllDay,
          joinUrl: detectedJoin?.url,
          joinProvider: detectedJoin?.provider,
          location: item.location,
          organizer: item.organizer ? { name: item.organizer.displayName, email: item.organizer.email } : undefined,
          attendeesCount: item.attendees?.length,
          status,
          color: account.color
        });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}

async function fetchMicrosoftEvents(
  token: string,
  account: CalendarAccount,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  let nextUrl: string | undefined = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(timeMin)}&endDateTime=${encodeURIComponent(timeMax)}&$select=id,subject,start,end,isAllDay,isCancelled,location,onlineMeeting,onlineMeetingUrl,organizer,attendees,webLink,bodyPreview`;

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: 'outlook.timezone="UTC"'
      }
    });

    if (res.status === 401) {
      updateAccountStatus(account.id, 'reconnect_needed');
      throw new Error('Microsoft Graph access token expired or revoked');
    }
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '5';
      throw new Error(`RATE_LIMITED_429: Retry after ${retryAfter} seconds`);
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Microsoft Graph API error: ${err}`);
    }

    const data = await res.json() as any;
    if (Array.isArray(data.value)) {
      for (const item of data.value) {
        const isAllDay = Boolean(item.isAllDay);
        const startIso = item.start?.dateTime ? `${item.start.dateTime}Z` : timeMin;
        const endIso = item.end?.dateTime ? `${item.end.dateTime}Z` : timeMax;

        let detectedJoin: { url: string; provider: any } | null = null;
        if (item.onlineMeeting?.joinUrl) {
          detectedJoin = sanitizeJoinUrl(item.onlineMeeting.joinUrl);
        }
        if (!detectedJoin && item.onlineMeetingUrl) {
          detectedJoin = sanitizeJoinUrl(item.onlineMeetingUrl);
        }
        if (!detectedJoin) {
          const blob = `${item.location?.displayName || ''} ${item.bodyPreview || ''}`;
          detectedJoin = extractJoinUrlFromText(blob);
        }

        let status: 'confirmed' | 'tentative' | 'cancelled' = 'confirmed';
        if (item.isCancelled) status = 'cancelled';

        events.push({
          id: `microsoft-${item.id}`,
          accountId: account.id,
          title: item.subject || '(Untitled Meeting)',
          start: startIso,
          end: endIso,
          isAllDay,
          joinUrl: detectedJoin?.url,
          joinProvider: detectedJoin?.provider,
          location: item.location?.displayName,
          organizer: item.organizer?.emailAddress ? {
            name: item.organizer.emailAddress.name,
            email: item.organizer.emailAddress.address
          } : undefined,
          attendeesCount: item.attendees?.length,
          status,
          color: account.color
        });
      }
    }
    nextUrl = data['@odata.nextLink'];
  }

  return events;
}

// Sign out single account
export function signOutAccount(accountId: string): void {
  deleteAccountTokens(accountId);
  const accounts = getAccounts().filter(a => a.id !== accountId);
  saveAccounts(accounts);

  // Remove cached events for account
  const cached = getCachedEvents().filter(e => e.accountId !== accountId);
  saveCachedEvents(cached);
}

// Sign out all accounts
export function signOutAll(): void {
  deleteAllTokens();
  saveAccounts([]);
  saveCachedEvents([]);
}

// Clear cache only
export function clearEventsCache(): number {
  const count = getCachedEvents().length;
  saveCachedEvents([]);
  return count;
}
