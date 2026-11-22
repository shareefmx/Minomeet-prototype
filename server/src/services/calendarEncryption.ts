import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in seconds
}

export interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

const KEY_FILE = path.join(DATA_DIR, '.calendar_key');
const TOKENS_ENC_FILE = path.join(DATA_DIR, 'tokens.enc');

// Get or initialize a 256-bit encryption key
export function getEncryptionKey(): Buffer {
  if (process.env.CALENDAR_ENCRYPTION_KEY) {
    const envKey = process.env.CALENDAR_ENCRYPTION_KEY.trim();
    if (envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }
    return crypto.createHash('sha256').update(envKey).digest();
  }

  if (fs.existsSync(KEY_FILE)) {
    try {
      const fileContent = fs.readFileSync(KEY_FILE);
      if (fileContent.length === 32) {
        return fileContent;
      }
    } catch {}
  }

  // Generate new 32-byte key and store with 0600 permissions
  const newKey = crypto.randomBytes(32);
  try {
    fs.writeFileSync(KEY_FILE, newKey, { mode: 0o600 });
  } catch (err) {
    console.warn('Could not write calendar encryption key file:', err);
  }
  return newKey;
}

// Encrypt string with AES-256-GCM
export function encryptData(plainText: string, key?: Buffer): EncryptedPayload {
  const encKey = key || getEncryptionKey();
  const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    tag,
    data: encrypted,
  };
}

// Decrypt AES-256-GCM payload
export function decryptData(payload: EncryptedPayload, key?: Buffer): string {
  const encKey = key || getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv);

  decipher.setAuthTag(tag);
  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Load all tokens from tokens.enc
export function loadAllTokens(): Record<string, StoredTokens> {
  if (!fs.existsSync(TOKENS_ENC_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(TOKENS_ENC_FILE, 'utf8');
    const payload: EncryptedPayload = JSON.parse(raw);
    const decrypted = decryptData(payload);
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Failed to read or decrypt calendar tokens:', err);
    return {};
  }
}

// Save all tokens into tokens.enc with 0600 permissions
export function saveAllTokens(tokens: Record<string, StoredTokens>): void {
  try {
    const jsonStr = JSON.stringify(tokens);
    const payload = encryptData(jsonStr);
    fs.writeFileSync(TOKENS_ENC_FILE, JSON.stringify(payload, null, 2), {
      mode: 0o600,
      encoding: 'utf8',
    });
  } catch (err) {
    console.error('Failed to save calendar tokens to disk:', err);
  }
}

// Save token for single account
export function saveAccountTokens(accountId: string, tokens: StoredTokens): void {
  const all = loadAllTokens();
  all[accountId] = tokens;
  saveAllTokens(all);
}

// Get token for single account
export function getAccountTokens(accountId: string): StoredTokens | null {
  const all = loadAllTokens();
  return all[accountId] || null;
}

// Delete token for account
export function deleteAccountTokens(accountId: string): void {
  const all = loadAllTokens();
  if (all[accountId]) {
    delete all[accountId];
    saveAllTokens(all);
  }
}

// Delete all tokens
export function deleteAllTokens(): void {
  if (fs.existsSync(TOKENS_ENC_FILE)) {
    try {
      fs.unlinkSync(TOKENS_ENC_FILE);
    } catch {}
  }
}
