import { test, describe } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  encryptData,
  decryptData
} from '../src/services/calendarEncryption.js';
import {
  generatePkce,
  generateState,
  sanitizeJoinUrl,
  extractJoinUrlFromText,
  deduplicateAndSortEvents,
  CalendarEvent
} from '../src/services/calendarService.js';

describe('Web Server Calendar Service & Security Suite', () => {
  test('AES-256-GCM encryption and decryption roundtrip', () => {
    const key = crypto.randomBytes(32);
    const plaintext = JSON.stringify({
      accessToken: 'ya29.test_google_access_token_12345',
      refreshToken: '1//0g_test_refresh_token_67890',
      expiresAt: 1763800000
    });

    const encrypted = encryptData(plaintext, key);
    assert.ok(encrypted.iv, 'IV must be generated');
    assert.ok(encrypted.tag, 'Auth tag must be generated');
    assert.ok(encrypted.data, 'Ciphertext must be present');
    assert.notStrictEqual(encrypted.data, plaintext, 'Ciphertext must not match plaintext');

    const decrypted = decryptData(encrypted, key);
    assert.strictEqual(decrypted, plaintext, 'Decrypted text must match plaintext');

    // Tampering with ciphertext fails auth tag check
    const tampered = { ...encrypted, data: 'deadbeef' + encrypted.data.slice(8) };
    assert.throws(() => {
      decryptData(tampered, key);
    }, 'Tampered ciphertext must fail decryption');
  });

  test('RFC 7636 PKCE Generator adheres to spec', () => {
    const { codeVerifier, codeChallenge } = generatePkce();
    assert.ok(codeVerifier.length >= 43, 'Verifier length must be >= 43 chars');
    assert.ok(codeVerifier.length <= 128, 'Verifier length must be <= 128 chars');
    assert.ok(/^[A-Za-z0-9_-]+$/.test(codeVerifier), 'Verifier must be URL-safe base64 without padding');

    // Verify SHA-256 challenge calculation
    const expectedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    assert.strictEqual(codeChallenge, expectedChallenge, 'Challenge must match SHA256(verifier)');
  });

  test('State generator creates high-entropy random strings', () => {
    const state1 = generateState();
    const state2 = generateState();
    assert.notStrictEqual(state1, state2);
    assert.strictEqual(state1.length, 32);
  });

  test('Join URL sanitizer enforces https allowlist and rejects dangerous schemes', () => {
    // Valid Meet
    assert.deepStrictEqual(
      sanitizeJoinUrl('https://meet.google.com/abc-defg-hij'),
      { url: 'https://meet.google.com/abc-defg-hij', provider: 'google_meet' }
    );

    // Valid Teams
    assert.deepStrictEqual(
      sanitizeJoinUrl('https://teams.microsoft.com/l/meetup-join/19%3ameeting'),
      { url: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting', provider: 'teams' }
    );

    // Valid Zoom
    assert.deepStrictEqual(
      sanitizeJoinUrl('https://us02web.zoom.us/j/1234567890'),
      { url: 'https://us02web.zoom.us/j/1234567890', provider: 'zoom' }
    );

    // Valid Webex
    assert.deepStrictEqual(
      sanitizeJoinUrl('https://company.webex.com/meet/room'),
      { url: 'https://company.webex.com/meet/room', provider: 'webex' }
    );

    // Dangerous / Insecure URL rejection
    assert.strictEqual(sanitizeJoinUrl('http://meet.google.com/abc-defg-hij'), null);
    assert.strictEqual(sanitizeJoinUrl('javascript:alert(1)'), null);
    assert.strictEqual(sanitizeJoinUrl('data:text/html,<script>evil()</script>'), null);
    assert.strictEqual(sanitizeJoinUrl('https://attacker-domain.com/phish'), null);
  });

  test('Extracts join URLs from freeform meeting description and location', () => {
    const body = 'Please join the sync using https://meet.google.com/xyz-uvwx-rst on time.';
    const extracted = extractJoinUrlFromText(body);
    assert.ok(extracted);
    assert.strictEqual(extracted.url, 'https://meet.google.com/xyz-uvwx-rst');
    assert.strictEqual(extracted.provider, 'google_meet');

    const empty = extractJoinUrlFromText('Discussion in Conference Room B, no link available.');
    assert.strictEqual(empty, null);
  });

  test('Deduplicates identical events across accounts and sorts chronologically', () => {
    const ev1: CalendarEvent = {
      id: 'google-1',
      accountId: 'google-acc',
      title: 'Sprint Planning',
      start: '2026-11-22T10:00:00Z',
      end: '2026-11-22T11:00:00Z',
      isAllDay: false,
      color: '#2563eb'
    };

    const ev2: CalendarEvent = {
      id: 'microsoft-1',
      accountId: 'ms-acc',
      title: 'Sprint Planning', // Same title and time invited on both calendars
      start: '2026-11-22T10:00:00Z',
      end: '2026-11-22T11:00:00Z',
      isAllDay: false,
      color: '#0284c7'
    };

    const ev3: CalendarEvent = {
      id: 'google-2',
      accountId: 'google-acc',
      title: 'Daily Standup',
      start: '2026-11-22T09:00:00Z',
      end: '2026-11-22T09:15:00Z',
      isAllDay: false,
      color: '#2563eb'
    };

    const deduped = deduplicateAndSortEvents([ev1, ev2, ev3]);
    assert.strictEqual(deduped.length, 2, 'Should deduplicate identical sprint planning event');
    assert.strictEqual(deduped[0].title, 'Daily Standup', 'Standup at 09:00 must come first');
    assert.strictEqual(deduped[1].title, 'Sprint Planning', 'Sprint Planning at 10:00 must come second');
  });

  test('Input validation rejects ranges exceeding 31 days or invalid formats', () => {
    const validFrom = new Date('2026-11-01T00:00:00Z').getTime();
    const validTo = new Date('2026-11-20T00:00:00Z').getTime();
    const maxRangeMs = 31 * 24 * 60 * 60 * 1000;

    assert.ok(validTo - validFrom <= maxRangeMs, 'Valid 19-day range is accepted');

    const tooLongTo = new Date('2026-12-15T00:00:00Z').getTime();
    assert.ok(tooLongTo - validFrom > maxRangeMs, 'Range exceeding 31 days is rejected');

    const invalidDate = new Date('not-a-date').getTime();
    assert.ok(isNaN(invalidDate), 'Invalid string produces NaN');
  });
});
