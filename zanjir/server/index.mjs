import fs from 'node:fs';
import http from 'node:http';
import { loadConfig } from './config.mjs';
import { createApp } from './app.mjs';

const config = loadConfig();
fs.mkdirSync(config.dataDir, { recursive: true });

const app = createApp({ config });
const server = http.createServer(app.handler);

// Real vaqt (SSE) ulanishlari uzoq ochiq turadi
server.requestTimeout = 0;
server.headersTimeout = 30_000;

server.listen(config.port, config.host, () => {
  console.log(`Zanjir server ishga tushdi: http://${config.host}:${config.port} (ma'lumotlar: ${config.dataDir})`);
});

function shutdown(signal) {
  console.log(`${signal} qabul qilindi, server to'xtatilmoqda...`);
  server.close(() => {
    app.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
