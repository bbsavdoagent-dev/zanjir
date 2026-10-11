import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Sozlamalar muhit o'zgaruvchilaridan olinadi (docker-compose / .env). */
export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 8080,
    host: env.HOST || '0.0.0.0',
    dataDir: path.resolve(env.DATA_DIR || path.join(root, 'data')),
    staticDir: path.resolve(env.STATIC_DIR || path.join(root, 'dist')),
    sessionDays: Number(env.SESSION_DAYS) || 30,
    // Server Caddy/Nginx ortida ishlasa, haqiqiy IP va https X-Forwarded-* sarlavhalaridan olinadi
    trustProxy: env.TRUST_PROXY !== 'false'
  };
}
