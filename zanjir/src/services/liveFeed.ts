/**
 * Real vaqt yangilanishlari: server (SSE) "nima o'zgardi" deb xabar beradi,
 * mijoz esa tegishli ma'lumotni qayta yuklaydi. SSE uzilsa, davriy so'rov (polling) ishlaydi.
 */

export type Entity = 'companies' | 'stores' | 'products' | 'orders' | 'notifications';

interface Refetcher {
  entity: Entity;
  run: () => void;
}

const POLL_INTERVAL_MS = 20_000;

const refetchers = new Set<Refetcher>();
let source: EventSource | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let hasOpenedOnce = false;

const runAll = () => refetchers.forEach((r) => r.run());

function connect() {
  if (typeof EventSource === 'undefined') return;
  source = new EventSource('/api/events');
  source.onmessage = (event) => {
    try {
      const { type } = JSON.parse(event.data) as { type: Entity };
      refetchers.forEach((r) => r.entity === type && r.run());
    } catch {
      /* noto'g'ri xabar e'tiborsiz qoldiriladi */
    }
  };
  source.onopen = () => {
    // Qayta ulanishda uzilish paytidagi o'zgarishlarni qo'lga olish uchun hammasini yangilaymiz
    if (hasOpenedOnce) runAll();
    hasOpenedOnce = true;
  };
}

const onVisible = () => {
  if (document.visibilityState === 'visible') runAll();
};

function start() {
  connect();
  pollTimer = setInterval(() => {
    // SSE butunlay yopilgan bo'lsa (masalan, sessiya tugagan), qayta ulanib ko'ramiz
    if (source && source.readyState === EventSource.CLOSED) {
      source = null;
      connect();
    }
    runAll();
  }, POLL_INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', runAll);
}

function stop() {
  source?.close();
  source = null;
  hasOpenedOnce = false;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('online', runAll);
}

export const liveFeed = {
  /** Yangilovchini ro'yxatga oladi; qaytgan funksiya obunani bekor qiladi. */
  register(entity: Entity, run: () => void): () => void {
    const refetcher = { entity, run };
    refetchers.add(refetcher);
    if (refetchers.size === 1) start();
    return () => {
      refetchers.delete(refetcher);
      if (refetchers.size === 0) stop();
    };
  },

  /** O'z amalimizdan keyin darhol yangilash (SSE xabarini kutmasdan). */
  refresh(...entities: Entity[]) {
    refetchers.forEach((r) => entities.includes(r.entity) && r.run());
  }
};
