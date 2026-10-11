import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, keyB64] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT_PARAMS);
  return timingSafeEqual(actual, expected);
}

// Foydalanuvchi topilmaganda ham bir xil vaqt sarflash uchun (email mavjudligini aniqlab bo'lmasin)
export const DUMMY_HASH = await hashPassword('dummy-password-for-timing');

export const newSessionToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/** Oddiy xotiradagi tezlik cheklovchi (urinishlar soni / vaqt oynasi). */
export class RateLimiter {
  constructor(max, windowMs) {
    this.max = max;
    this.windowMs = windowMs;
    this.hits = new Map();
  }

  /** Urinishni qayd etadi; limit oshgan bo'lsa false qaytaradi. */
  hit(key) {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.max;
  }

  reset(key) {
    this.hits.delete(key);
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
  }
}
