import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../app.mjs';
import { openDb } from '../db.mjs';

let app;
let server;
let base;
let staticDir;

/** Cookie saqlaydigan oddiy mijoz (bitta foydalanuvchi sessiyasi). */
class Client {
  cookie = '';
  async request(method, url, body, headers = {}) {
    const res = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(this.cookie ? { Cookie: this.cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';')[0].endsWith('=') ? '' : setCookie.split(';')[0];
    const data = await res.json().catch(() => null);
    return { status: res.status, data, res };
  }
  get = (url) => this.request('GET', url);
  post = (url, body) => this.request('POST', url, body ?? {});
  patch = (url, body) => this.request('PATCH', url, body);
  del = (url) => this.request('DELETE', url);
}

const reg = (role, n) => ({
  role,
  businessName: `${role === 'company' ? 'Zavod' : "Do'kon"} ${n}`,
  personName: `Ega ${n}`,
  phone: `+99890123456${n}`,
  email: `${role}${n}@example.com`,
  password: 'secret123',
  address: 'Samarqand sh., Registon ko\'chasi'
});

const productBody = (over = {}) => ({
  name: 'Sharbat', description: 'Mazali', category: 'Sharbatlar', price: 10000, unit: 'quti',
  minOrderQty: 5, stock: 100, isActive: true, imageUrl: '', ...over
});

before(async () => {
  staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zanjir-static-'));
  fs.writeFileSync(path.join(staticDir, 'index.html'), '<html>SPA</html>');
  fs.mkdirSync(path.join(staticDir, 'assets'));
  fs.writeFileSync(path.join(staticDir, 'assets', 'app.js'), 'console.log(1)');
  app = createApp({
    config: { staticDir, sessionDays: 30, trustProxy: true, dataDir: os.tmpdir() },
    db: openDb(':memory:')
  });
  server = http.createServer(app.handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.closeAllConnections?.();
  server.close();
  app.close();
});

describe('Autentifikatsiya', () => {
  it("Ro'yxatdan o'tish, sessiya (me) va chiqish", async () => {
    const c = new Client();
    const r = await c.post('/api/auth/register', reg('company', 1));
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.data.user.role, 'company');
    assert.ok(r.data.user.companyId && r.data.company.name === 'Zavod 1');
    assert.ok(!('storeId' in r.data.user));
    assert.ok(!JSON.stringify(r.data).includes('password'));
    assert.match(r.res.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);

    const me = await c.get('/api/auth/me');
    assert.strictEqual(me.status, 200);
    assert.strictEqual(me.data.user.email, 'company1@example.com');

    assert.strictEqual((await c.post('/api/auth/logout')).status, 200);
    assert.strictEqual((await c.get('/api/auth/me')).status, 401);
  });

  it("Takroriy email, qisqa parol va noto'g'ri ma'lumotlar rad etiladi", async () => {
    const c = new Client();
    assert.strictEqual((await c.post('/api/auth/register', reg('company', 1))).status, 409);
    assert.strictEqual((await c.post('/api/auth/register', { ...reg('store', 9), password: '123' })).status, 400);
    assert.strictEqual((await c.post('/api/auth/register', { ...reg('store', 9), role: 'admin' })).status, 400);
    assert.strictEqual((await c.post('/api/auth/register', { ...reg('store', 9), phone: '1' })).status, 400);
    assert.strictEqual((await c.post('/api/auth/register', { ...reg('store', 9), email: 'noemail' })).status, 400);
  });

  it("Kirish: to'g'ri parol (katta-kichik harf farqsiz email) va noto'g'ri parol", async () => {
    const c = new Client();
    const bad = await c.post('/api/auth/login', { email: 'company1@example.com', password: 'wrongpass' });
    assert.strictEqual(bad.status, 401);
    const missing = await c.post('/api/auth/login', { email: 'yoq@example.com', password: 'secret123' });
    assert.strictEqual(missing.status, 401);
    assert.strictEqual(bad.data.error, missing.data.error); // email mavjudligi sezdirilmaydi

    const ok = await c.post('/api/auth/login', { email: ' Company1@Example.com ', password: 'secret123' });
    assert.strictEqual(ok.status, 200);
    assert.strictEqual((await c.get('/api/auth/me')).status, 200);
  });

  it('Ketma-ket xato urinishlar cheklanadi', async () => {
    const c = new Client();
    let last;
    for (let i = 0; i < 12; i++) last = await c.post('/api/auth/login', { email: 'limit@example.com', password: 'x' + i });
    assert.strictEqual(last.status, 429);
  });

  it('Kirmagan foydalanuvchi ma\'lumotlarga kira olmaydi', async () => {
    const c = new Client();
    for (const url of ['/api/products', '/api/orders', '/api/companies', '/api/notifications', '/api/stores', '/api/events']) {
      assert.strictEqual((await c.get(url)).status, 401, url);
    }
  });

  it("Boshqa saytdan kelgan o'zgartiruvchi so'rov rad etiladi (CSRF)", async () => {
    const c = new Client();
    const r = await c.request('POST', '/api/auth/login', { email: 'a@b.co', password: 'x' }, { Origin: 'https://evil.example' });
    assert.strictEqual(r.status, 403);
  });
});

describe('Mahsulotlar, buyurtmalar va ombor', () => {
  const company = new Client();
  const company2 = new Client();
  const store = new Client();
  const store2 = new Client();
  let companyInfo;
  let storeInfo;
  let product;

  before(async () => {
    companyInfo = (await company.post('/api/auth/login', { email: 'company1@example.com', password: 'secret123' })).data;
    await company2.post('/api/auth/register', reg('company', 2));
    storeInfo = (await store.post('/api/auth/register', reg('store', 1))).data;
    await store2.post('/api/auth/register', reg('store', 2));
  });

  it('Faqat kompaniya mahsulot qo\'sha oladi; mahsulot kompaniyasi serverda belgilanadi', async () => {
    assert.strictEqual((await store.post('/api/products', productBody())).status, 403);
    const r = await company.post('/api/products', productBody({ companyId: 'boshqa', companyName: 'Soxta' }));
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.data.companyId, companyInfo.user.companyId);
    assert.strictEqual(r.data.companyName, 'Zavod 1');
    product = r.data;
  });

  it("Mahsulot ma'lumotlari tekshiriladi", async () => {
    for (const bad of [{ price: -1 }, { stock: 1.5 }, { unit: 'tonna' }, { name: '' }, { minOrderQty: 0 }, { imageUrl: 'javascript:alert(1)' }]) {
      assert.strictEqual((await company.post('/api/products', productBody(bad))).status, 400, JSON.stringify(bad));
    }
  });

  it("Boshqa kompaniya mahsulotni o'zgartira yoki o'chira olmaydi", async () => {
    assert.strictEqual((await company2.patch(`/api/products/${product.id}`, { price: 1 })).status, 403);
    assert.strictEqual((await company2.del(`/api/products/${product.id}`)).status, 403);
    assert.strictEqual((await store.patch(`/api/products/${product.id}`, { price: 1 })).status, 403);
    const upd = await company.patch(`/api/products/${product.id}`, { stock: 100 });
    assert.strictEqual(upd.status, 200);
    assert.strictEqual(upd.data.price, 10000); // qisman yangilash boshqa maydonlarni o'zgartirmaydi
  });

  it("Do'kon katalogni ko'radi, do'konlar ro'yxatini faqat kompaniya ko'radi", async () => {
    const list = await store.get('/api/products');
    assert.ok(list.data.some((p) => p.id === product.id));
    assert.strictEqual((await store.get('/api/stores')).status, 403);
    assert.strictEqual((await company.get('/api/stores')).status, 200);
  });

  const orderBody = (items, over = {}) => ({
    companyId: companyInfo.user.companyId,
    storeId: storeInfo.user.storeId,
    items,
    deliveryAddress: 'Toshkent, Chilonzor',
    contactPhone: '+998901112233',
    ...over
  });
  let order;

  it("Buyurtma: narx serverdan olinadi, ombor kamayadi, kompaniyaga bildirishnoma boradi", async () => {
    const r = await store.post('/api/orders', {
      ...orderBody([{ productId: product.id, quantity: 10 }]),
      totalAmount: 1, price: 1 // mijoz yuborgan soxta narx e'tiborga olinmaydi
    });
    assert.strictEqual(r.status, 201);
    assert.match(r.data.orderNumber, /^ZN-\d{6}$/);

    order = (await store.get('/api/orders')).data.find((o) => o.id === r.data.orderId);
    assert.strictEqual(order.totalAmount, 100000);
    assert.strictEqual(order.items[0].price, 10000);
    assert.strictEqual(order.status, 'yangi');
    assert.strictEqual(order.storePhone, '+998901112233');

    const after = (await store.get('/api/products')).data.find((p) => p.id === product.id);
    assert.strictEqual(after.stock, 90);

    const notifs = (await company.get('/api/notifications')).data;
    assert.ok(notifs.some((n) => n.orderId === order.id && n.userId === companyInfo.user.companyId));
  });

  it("Noto'g'ri buyurtmalar rad etiladi va ombor o'zgarmaydi", async () => {
    const stockBefore = () => store.get('/api/products').then((r) => r.data.find((p) => p.id === product.id).stock);
    const before = await stockBefore();
    const cases = [
      [orderBody([{ productId: product.id, quantity: 2 }]), 400, 'minimal'],
      [orderBody([{ productId: product.id, quantity: 100000 }]), 409, 'ombor'],
      [orderBody([{ productId: 'yoq_mahsulot', quantity: 5 }]), 404, 'topilmadi'],
      [orderBody([{ productId: product.id, quantity: 0 }]), 400, 'nol'],
      [orderBody([]), 400, "bo'sh"],
      [orderBody([{ productId: product.id, quantity: 5 }], { deliveryAddress: '' }), 400, 'manzil'],
      [orderBody([{ productId: product.id, quantity: 5 }], { storeId: 'boshqa_dokon' }), 403, 'boshqa dokon'],
      [orderBody([{ productId: product.id, quantity: 5 }], { companyId: 'boshqa_kompaniya' }), 404, 'boshqa kompaniya']
    ];
    for (const [body, status, label] of cases) {
      const r = await store.post('/api/orders', body);
      assert.strictEqual(r.status, status, label);
    }
    // 2-qatorli buyurtmada ikkinchisi xato bo'lsa, birinchisi ham qo'llanmaydi (atomiklik)
    const half = await store.post('/api/orders', orderBody([
      { productId: product.id, quantity: 5 },
      { productId: 'yoq_mahsulot', quantity: 5 }
    ]));
    assert.strictEqual(half.status, 404);
    assert.strictEqual(await stockBefore(), before);

    assert.strictEqual((await company.post('/api/orders', orderBody([{ productId: product.id, quantity: 5 }]))).status, 403);
  });

  it("Faol bo'lmagan mahsulotga buyurtma berib bo'lmaydi; takroriy qatorlar birlashtiriladi", async () => {
    const inactive = (await company.post('/api/products', productBody({ name: 'Nofaol', isActive: false }))).data;
    assert.strictEqual((await store.post('/api/orders', orderBody([{ productId: inactive.id, quantity: 5 }]))).status, 409);

    const r = await store.post('/api/orders', orderBody([
      { productId: product.id, quantity: 3 }, { productId: product.id, quantity: 4 }
    ]));
    assert.strictEqual(r.status, 201);
    const o = (await store.get('/api/orders')).data.find((x) => x.id === r.data.orderId);
    assert.strictEqual(o.items.length, 1);
    assert.strictEqual(o.items[0].quantity, 7);
    // zaxirani tiklash uchun darhol bekor qilamiz
    await store.patch(`/api/orders/${o.id}/status`, { status: 'bekor_qilindi' });
  });

  it("Buyurtmani faqat ikki tomon ko'radi", async () => {
    assert.ok((await company.get('/api/orders')).data.some((o) => o.id === order.id));
    assert.ok(!(await company2.get('/api/orders')).data.some((o) => o.id === order.id));
    assert.ok(!(await store2.get('/api/orders')).data.some((o) => o.id === order.id));
    assert.strictEqual((await company2.patch(`/api/orders/${order.id}/status`, { status: 'tasdiqlandi' })).status, 404);
    assert.strictEqual((await store2.patch(`/api/orders/${order.id}/status`, { status: 'bekor_qilindi' })).status, 404);
  });

  it("Holat bosqichma-bosqich o'tadi; do'kon holatni o'zgartira olmaydi; sakrash mumkin emas", async () => {
    const set = (c, status, note) => c.patch(`/api/orders/${order.id}/status`, { status, note });
    assert.strictEqual((await set(store, 'tasdiqlandi')).status, 400);
    assert.strictEqual((await set(company, 'yetkazildi')).status, 400); // sakrash
    assert.strictEqual((await set(company, 'nomalum')).status, 400);

    const a = await set(company, 'tasdiqlandi', 'Qabul qilindi');
    assert.strictEqual(a.status, 200);
    assert.strictEqual(a.data.history.at(-1).note, 'Qabul qilindi');
    assert.strictEqual(a.data.history.at(-1).changedBy, 'Ega 1');

    // do'kon faqat 'yangi' buyurtmani bekor qila oladi
    assert.strictEqual((await set(store, 'bekor_qilindi')).status, 400);

    for (const next of ['yigilmoqda', 'yetkazilmoqda', 'yetkazildi']) {
      assert.strictEqual((await set(company, next)).status, 200, next);
    }
    // yakunlangan buyurtma o'zgarmaydi
    assert.strictEqual((await set(company, 'bekor_qilindi')).status, 409);

    const storeNotifs = (await store.get('/api/notifications')).data;
    assert.ok(storeNotifs.some((n) => n.orderId === order.id && n.userId === storeInfo.user.storeId));
  });

  it("Bekor qilinsa ombor aynan bir marta tiklanadi; do'kon yangi buyurtmani bekor qila oladi", async () => {
    const stock = async () => (await store.get('/api/products')).data.find((p) => p.id === product.id).stock;
    const s0 = await stock();

    const o1 = (await store.post('/api/orders', orderBody([{ productId: product.id, quantity: 10 }]))).data;
    assert.strictEqual(await stock(), s0 - 10);
    assert.strictEqual((await company.patch(`/api/orders/${o1.orderId}/status`, { status: 'bekor_qilindi' })).status, 200);
    assert.strictEqual(await stock(), s0);
    assert.strictEqual((await company.patch(`/api/orders/${o1.orderId}/status`, { status: 'bekor_qilindi' })).status, 409);
    assert.strictEqual(await stock(), s0); // ikkinchi marta tiklanmadi

    const o2 = (await store.post('/api/orders', orderBody([{ productId: product.id, quantity: 6 }]))).data;
    assert.strictEqual((await store.patch(`/api/orders/${o2.orderId}/status`, { status: 'bekor_qilindi' })).status, 200);
    assert.strictEqual(await stock(), s0);
    const companyNotifs = (await company.get('/api/notifications')).data;
    assert.ok(companyNotifs.some((n) => n.orderId === o2.orderId && /Bekor/.test(n.message)));
  });

  it("Kam qoldiq haqida kompaniyaga ogohlantirish boradi", async () => {
    const p = (await company.post('/api/products', productBody({ name: 'Kam', stock: 12, minOrderQty: 1 }))).data;
    await store.post('/api/orders', orderBody([{ productId: p.id, quantity: 5 }]));
    const n = (await company.get('/api/notifications')).data;
    assert.ok(n.some((x) => x.type === 'stock_alert' && x.message.includes('Kam')));
  });

  it("Bildirishnomalarni faqat egasi o'qilgan qila oladi", async () => {
    const mine = (await company.get('/api/notifications')).data;
    assert.ok(mine.length > 0 && mine.some((n) => !n.isRead));
    await company2.post(`/api/notifications/${mine[0].id}/read`);
    assert.strictEqual((await company.get('/api/notifications')).data.find((n) => n.id === mine[0].id).isRead, false);

    await company.post(`/api/notifications/${mine[0].id}/read`);
    assert.strictEqual((await company.get('/api/notifications')).data.find((n) => n.id === mine[0].id).isRead, true);
    await company.post('/api/notifications/read-all');
    assert.ok((await company.get('/api/notifications')).data.every((n) => n.isRead));
    assert.ok((await company2.get('/api/notifications')).data.every((n) => n.userId !== companyInfo.user.companyId));
  });

  it('Qayta buyurtma tekshiruvi', async () => {
    const r = await store.post('/api/products/check', { items: [{ productId: product.id, quantity: 5 }, { productId: 'yoq', quantity: 1 }] });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.data.eligible, false);
    assert.strictEqual(r.data.availableItems.length, 1);
    assert.ok(r.data.warnings.length === 1);
  });

  it("Mahsulot o'chiriladi, lekin eski buyurtma ma'lumoti saqlanadi", async () => {
    const tmp = (await company.post('/api/products', productBody({ name: "O'chiriladigan", minOrderQty: 1 }))).data;
    const o = (await store.post('/api/orders', orderBody([{ productId: tmp.id, quantity: 2 }]))).data;
    assert.strictEqual((await company.del(`/api/products/${tmp.id}`)).status, 200);
    const saved = (await store.get('/api/orders')).data.find((x) => x.id === o.orderId);
    assert.strictEqual(saved.items[0].productName, "O'chiriladigan");
  });
});

describe("Real vaqt (SSE) va statik fayllar", () => {
  it("Mahsulot o'zgarganda ulangan mijozga xabar keladi", async () => {
    const company = new Client();
    await company.post('/api/auth/login', { email: 'company1@example.com', password: 'secret123' });

    const controller = new AbortController();
    const res = await fetch(base + '/api/events', { headers: { Cookie: company.cookie }, signal: controller.signal });
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/event-stream/);

    const reader = res.body.getReader();
    const received = (async () => {
      let text = '';
      while (!text.includes('"type":"products"')) {
        const { value, done } = await reader.read();
        if (done) break;
        text += Buffer.from(value).toString();
      }
      return text;
    })();

    await company.post('/api/products', productBody({ name: 'Real vaqt' }));
    const text = await Promise.race([received, new Promise((_, rej) => setTimeout(() => rej(new Error('SSE xabari kelmadi')), 3000))]);
    assert.ok(text.includes('"type":"products"'));
    controller.abort();
  });

  it("Frontend: SPA yo'llari index.html ga, mavjud bo'lmagan API va fayllar 404", async () => {
    const spa = await fetch(base + '/company/dashboard');
    assert.strictEqual(spa.status, 200);
    assert.strictEqual(await spa.text(), '<html>SPA</html>');
    assert.match(spa.headers.get('content-security-policy'), /default-src 'self'/);
    assert.strictEqual(spa.headers.get('x-frame-options'), 'DENY');

    const asset = await fetch(base + '/assets/app.js');
    assert.match(asset.headers.get('cache-control'), /immutable/);

    assert.strictEqual((await fetch(base + '/assets/yoq.js')).status, 404);
    assert.strictEqual((await fetch(base + '/api/yoq')).status, 404);
    assert.strictEqual((await fetch(base + '/..%2f..%2fetc/passwd')).status, 403);
    assert.strictEqual((await fetch(base + '/api/health')).status, 200);
  });
});
