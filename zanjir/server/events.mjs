/**
 * Real vaqt yangilanishlari (Server-Sent Events).
 * Mijozga faqat "nima o'zgardi" xabari yuboriladi; ma'lumotni mijoz o'zi (avtorizatsiya bilan) qayta oladi.
 */
export function createEventHub() {
  const clients = new Set();

  const heartbeat = setInterval(() => {
    for (const client of clients) client.res.write(': ping\n\n');
  }, 25_000);
  heartbeat.unref();

  return {
    add(res, scope) {
      const client = { res, scope };
      clients.add(client);
      res.on('close', () => clients.delete(client));
      res.write('retry: 3000\n\n');
    },

    /** target: { all?, companyId?, storeId? } */
    emit(type, target = {}) {
      const message = `data: ${JSON.stringify({ type })}\n\n`;
      for (const { res, scope } of clients) {
        const matches =
          target.all ||
          (target.companyId && scope.companyId === target.companyId) ||
          (target.storeId && scope.storeId === target.storeId);
        if (matches) res.write(message);
      }
    },

    closeAll() {
      clearInterval(heartbeat);
      for (const { res } of clients) res.end();
      clients.clear();
    }
  };
}
