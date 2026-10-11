import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { openDb, transaction, nextOrderNumber } from './db.mjs';
import { HANDLED, HttpError, Router, parseCookies, readJson, sendJson } from './http.mjs';
import { DUMMY_HASH, RateLimiter, hashPassword, hashToken, newSessionToken, verifyPassword } from './auth.mjs';
import { createEventHub } from './events.mjs';
import * as v from './validate.mjs';

const COOKIE_NAME = 'zanjir_sid';
const LOW_STOCK_THRESHOLD = 10;
const DEFAULT_COMPANY_CATEGORY = 'Ulgurji mahsulotlar';
const DEFAULT_COMPANY_LOGO_URL =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';
const DEFAULT_MIN_ORDER_AMOUNT = 200000;
const DEFAULT_CITY = 'Toshkent';

const STATUS_LABELS = {
  yangi: 'Yangi',
  tasdiqlandi: 'Tasdiqlandi',
  yigilmoqda: "Omborda yig'ilmoqda",
  yetkazilmoqda: 'Yetkazilmoqda',
  yetkazildi: 'Yetkazib berildi',
  bekor_qilindi: 'Bekor qilindi'
};
/** Kompaniya buyurtmani faqat keyingi bosqichga o'tkaza oladi yoki bekor qiladi. */
const NEXT_STATUS = {
  yangi: 'tasdiqlandi',
  tasdiqlandi: 'yigilmoqda',
  yigilmoqda: 'yetkazilmoqda',
  yetkazilmoqda: 'yetkazildi'
};
const FINAL_STATUSES = ['yetkazildi', 'bekor_qilindi'];

const nowISO = () => new Date().toISOString();
const newId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

// ---------------------------------------------------------------------------
// Qator -> API obyekti
// ---------------------------------------------------------------------------

const toUser = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  role: r.role,
  ...(r.company_id ? { companyId: r.company_id } : {}),
  ...(r.store_id ? { storeId: r.store_id } : {}),
  address: r.address,
  createdAt: r.created_at
});
const toCompany = (r) =>
  r && {
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description,
    phone: r.phone,
    email: r.email,
    address: r.address,
    ownerId: r.owner_id,
    logoUrl: r.logo_url,
    minOrderAmount: r.min_order_amount,
    createdAt: r.created_at
  };
const toStore = (r) =>
  r && {
    id: r.id,
    name: r.name,
    ownerName: r.owner_name,
    phone: r.phone,
    email: r.email,
    address: r.address,
    ownerId: r.owner_id,
    city: r.city,
    createdAt: r.created_at
  };
const toProduct = (r) => ({
  id: r.id,
  companyId: r.company_id,
  companyName: r.company_name,
  name: r.name,
  description: r.description,
  imageUrl: r.image_url,
  category: r.category,
  price: r.price,
  unit: r.unit,
  minOrderQty: r.min_order_qty,
  stock: r.stock,
  isActive: Boolean(r.is_active),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});
const toOrder = (r) => ({
  id: r.id,
  orderNumber: r.order_number,
  companyId: r.company_id,
  companyName: r.company_name,
  storeId: r.store_id,
  storeName: r.store_name,
  storePhone: r.store_phone,
  items: JSON.parse(r.items),
  totalAmount: r.total_amount,
  status: r.status,
  deliveryAddress: r.delivery_address,
  comment: r.comment,
  deliveryDate: r.delivery_date,
  history: JSON.parse(r.history),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});
const toNotification = (r) => ({
  id: r.id,
  userId: r.recipient_id,
  title: r.title,
  message: r.message,
  type: r.type,
  ...(r.order_id ? { orderId: r.order_id } : {}),
  isRead: Boolean(r.is_read),
  createdAt: r.created_at
});

/** Bildirishnomalar kimga yuborilishini aniqlaydi: kompaniya yoki do'kon ID si. */
const recipientIdOf = (user) => (user.role === 'company' ? user.company_id : user.store_id);

function requireRole(user, role) {
  if (user.role !== role) throw new HttpError(403, 'Bu amalni bajarishga ruxsat yo\'q');
}

// ---------------------------------------------------------------------------
// Ilova
// ---------------------------------------------------------------------------

export function createApp({ config, db: providedDb }) {
  const db = providedDb ?? openDb(path.join(config.dataDir, 'zanjir.db'));
  const events = createEventHub();
  const router = new Router();

  const loginLimiter = new RateLimiter(10, 15 * 60_000); // 10 urinish / 15 daqiqa (IP + email)
  const loginIpLimiter = new RateLimiter(60, 15 * 60_000);
  const registerLimiter = new RateLimiter(20, 60 * 60_000);

  const insertNotification = db.prepare(
    `INSERT INTO notifications (id, recipient_id, title, message, type, order_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
  );
  const notify = ({ recipientId, title, message, type = 'order_status', orderId = null }) =>
    insertNotification.run(newId('notif'), recipientId, title, message, type, orderId, nowISO());

  const clientIp = (req) => {
    if (config.trustProxy) {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  };
  const isHttps = (req) => config.trustProxy && req.headers['x-forwarded-proto'] === 'https';

  // ---- Sessiya ----
  const cookieHeader = (req, token, maxAgeSeconds) =>
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${isHttps(req) ? '; Secure' : ''}`;

  function startSession(req, userId) {
    const token = newSessionToken();
    const maxAge = config.sessionDays * 86400;
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
      hashToken(token),
      userId,
      new Date(Date.now() + maxAge * 1000).toISOString(),
      nowISO()
    );
    return cookieHeader(req, token, maxAge);
  }

  function sessionUser(req) {
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
    if (!token) return null;
    return (
      db
        .prepare(
          `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token_hash = ? AND s.expires_at > ?`
        )
        .get(hashToken(token), nowISO()) || null
    );
  }

  const entityOf = (user) => ({
    company: user.company_id ? toCompany(db.prepare('SELECT * FROM companies WHERE id = ?').get(user.company_id)) : null,
    store: user.store_id ? toStore(db.prepare('SELECT * FROM stores WHERE id = ?').get(user.store_id)) : null
  });

  // ---- AUTH ----
  router.add('POST', '/api/auth/register', async (ctx) => {
    if (!registerLimiter.hit(clientIp(ctx.req))) throw new HttpError(429, "Juda ko'p urinish. Keyinroq qayta urinib ko'ring");
    const p = v.parseRegistration(ctx.body);
    const passwordHash = await hashPassword(p.password);
    const now = nowISO();
    const userId = newId('user');
    const entityId = newId(p.role === 'company' ? 'comp' : 'store');

    try {
      transaction(db, () => {
        db.prepare(
          `INSERT INTO users (id, email, password_hash, name, phone, role, company_id, store_id, address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          userId, p.email, passwordHash, p.personName, p.phone, p.role,
          p.role === 'company' ? entityId : null,
          p.role === 'store' ? entityId : null,
          p.address, now
        );
        if (p.role === 'company') {
          db.prepare(
            `INSERT INTO companies (id, owner_id, name, category, description, phone, email, address, logo_url, min_order_amount, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            entityId, userId, p.businessName, p.category || DEFAULT_COMPANY_CATEGORY,
            `${p.businessName} ishlab chiqaruvchisi va distribyutori.`,
            p.phone, p.email, p.address, DEFAULT_COMPANY_LOGO_URL, DEFAULT_MIN_ORDER_AMOUNT, now
          );
        } else {
          db.prepare(
            `INSERT INTO stores (id, owner_id, name, owner_name, phone, email, address, city, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(entityId, userId, p.businessName, p.personName, p.phone, p.email, p.address, DEFAULT_CITY, now);
        }
      });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw new HttpError(409, "Bu elektron pochta bilan allaqachon ro'yxatdan o'tilgan");
      }
      throw err;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    events.emit(p.role === 'company' ? 'companies' : 'stores', { all: true });
    return {
      status: 201,
      headers: { 'Set-Cookie': startSession(ctx.req, userId) },
      body: { user: toUser(user), ...entityOf(user) }
    };
  });

  router.add('POST', '/api/auth/login', async (ctx) => {
    const emailInput = typeof ctx.body.email === 'string' ? ctx.body.email.trim().toLowerCase() : '';
    const pass = typeof ctx.body.password === 'string' ? ctx.body.password : '';
    const ip = clientIp(ctx.req);
    const key = `${ip}|${emailInput}`;
    if (!loginLimiter.hit(key) || !loginIpLimiter.hit(ip)) {
      throw new HttpError(429, "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring");
    }

    const user = emailInput ? db.prepare('SELECT * FROM users WHERE email = ?').get(emailInput) : null;
    const ok = await verifyPassword(pass, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, "Elektron pochta yoki parol noto'g'ri");

    loginLimiter.reset(key);
    return {
      headers: { 'Set-Cookie': startSession(ctx.req, user.id) },
      body: { user: toUser(user), ...entityOf(user) }
    };
  });

  router.add('POST', '/api/auth/logout', (ctx) => {
    const token = parseCookies(ctx.req.headers.cookie)[COOKIE_NAME];
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    return { headers: { 'Set-Cookie': cookieHeader(ctx.req, '', 0) }, body: { success: true } };
  });

  router.add('GET', '/api/auth/me', (ctx) => {
    if (!ctx.user) throw new HttpError(401, 'Tizimga kirilmagan');
    return { user: toUser(ctx.user), ...entityOf(ctx.user) };
  });

  // ---- Autentifikatsiya talab qilinadigan marshrutlar ----
  const authed = (handler) => (ctx) => {
    if (!ctx.user) throw new HttpError(401, 'Tizimga kirilmagan');
    return handler(ctx);
  };

  // ---- CATALOG ----
  router.add('GET', '/api/companies', authed(() =>
    db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all().map(toCompany)
  ));

  // Do'konlar ro'yxatini faqat kompaniyalar ko'radi
  router.add('GET', '/api/stores', authed((ctx) => {
    requireRole(ctx.user, 'company');
    return db.prepare('SELECT * FROM stores ORDER BY created_at DESC').all().map(toStore);
  }));

  router.add('GET', '/api/products', authed((ctx) => {
    const companyId = ctx.query.get('companyId');
    const rows = companyId
      ? db.prepare('SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC').all(companyId)
      : db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return rows.map(toProduct);
  }));

  router.add('POST', '/api/products', authed((ctx) => {
    requireRole(ctx.user, 'company');
    const p = v.parseProduct(ctx.body, { partial: false });
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(ctx.user.company_id);
    if (!company) throw new HttpError(400, 'Kompaniya topilmadi');

    const now = nowISO();
    const productId = newId('prod');
    db.prepare(
      `INSERT INTO products (id, company_id, company_name, name, description, image_url, category, price, unit,
                             min_order_qty, stock, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      productId, company.id, company.name, p.name, p.description, p.imageUrl, p.category, p.price, p.unit,
      p.minOrderQty, p.stock, p.isActive ? 1 : 0, now, now
    );
    events.emit('products', { all: true });
    return { status: 201, body: toProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(productId)) };
  }));

  const ownProduct = (ctx) => {
    requireRole(ctx.user, 'company');
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(ctx.params.id);
    if (!product) throw new HttpError(404, 'Mahsulot topilmadi');
    if (product.company_id !== ctx.user.company_id) throw new HttpError(403, "Bu mahsulot sizga tegishli emas");
    return product;
  };

  router.add('PATCH', '/api/products/:id', authed((ctx) => {
    ownProduct(ctx);
    const p = v.parseProduct(ctx.body, { partial: true });
    const columns = {
      name: 'name', description: 'description', category: 'category', price: 'price', unit: 'unit',
      minOrderQty: 'min_order_qty', stock: 'stock', imageUrl: 'image_url'
    };
    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(columns)) {
      if (p[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(p[key]);
      }
    }
    if (p.isActive !== undefined) {
      sets.push('is_active = ?');
      values.push(p.isActive ? 1 : 0);
    }
    sets.push('updated_at = ?');
    values.push(nowISO(), ctx.params.id);
    db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    events.emit('products', { all: true });
    return toProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(ctx.params.id));
  }));

  router.add('DELETE', '/api/products/:id', authed((ctx) => {
    ownProduct(ctx);
    db.prepare('DELETE FROM products WHERE id = ?').run(ctx.params.id);
    events.emit('products', { all: true });
    return { success: true };
  }));

  // Qayta buyurtma: joriy ombor qoldig'i va faollikni tekshiradi
  router.add('POST', '/api/products/check', authed((ctx) => {
    const lines = v.parseOrderLines(ctx.body.items);
    const products = [];
    const warnings = [];
    let eligible = true;
    for (const line of lines) {
      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(line.productId);
      if (!row) {
        warnings.push(`Mahsulot topilmadi: ${line.productId}`);
        eligible = false;
        continue;
      }
      if (!row.is_active) {
        warnings.push(`"${row.name}" ayni paytda faol emas`);
        eligible = false;
        continue;
      }
      if (row.stock < line.quantity) {
        warnings.push(`"${row.name}" omborda yetarli emas (mavjud: ${row.stock} ${row.unit})`);
        eligible = false;
      }
      products.push({
        product: toProduct(row),
        quantity: Math.min(line.quantity, Math.max(row.stock, row.min_order_qty))
      });
    }
    return { eligible, availableItems: products, warnings };
  }));

  // ---- ORDERS ----
  router.add('GET', '/api/orders', authed((ctx) => {
    const rows =
      ctx.user.role === 'company'
        ? db.prepare('SELECT * FROM orders WHERE company_id = ? ORDER BY created_at DESC').all(ctx.user.company_id)
        : db.prepare('SELECT * FROM orders WHERE store_id = ? ORDER BY created_at DESC').all(ctx.user.store_id);
    return rows.map(toOrder);
  }));

  router.add('POST', '/api/orders', authed((ctx) => {
    requireRole(ctx.user, 'store');
    const companyId = v.id(ctx.body.companyId, 'companyId');
    const storeId = v.id(ctx.body.storeId, 'storeId');
    if (storeId !== ctx.user.store_id) throw new HttpError(403, "Bu do'kon nomidan buyurtma berishga ruxsat yo'q");
    const lines = v.parseOrderLines(ctx.body.items);
    const deliveryAddress = v.text(ctx.body.deliveryAddress, 'Yetkazib berish manzili', { min: 1, max: 300 });
    const comment = v.text(ctx.body.comment, 'Izoh', { max: 500 });
    const deliveryDate = v.text(ctx.body.deliveryDate, 'Yetkazib berish sanasi', { max: 30 });
    const contactPhone = v.text(ctx.body.contactPhone, 'Telefon raqami', { max: 30 });

    const result = transaction(db, () => {
      const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
      if (!store) throw new HttpError(404, "Do'kon topilmadi");
      if (!company) throw new HttpError(404, 'Ishlab chiqaruvchi topilmadi');

      let totalAmount = 0;
      const items = [];
      const lowStock = [];
      for (const line of lines) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(line.productId);
        if (!product) throw new HttpError(404, `Mahsulot topilmadi: ${line.productId}`);
        if (product.company_id !== companyId) {
          throw new HttpError(400, `${product.name} bu ishlab chiqaruvchiga tegishli emas`);
        }
        if (!product.is_active) throw new HttpError(409, `${product.name} mahsuloti hozirda sotuvda mavjud emas`);
        if (product.stock < line.quantity) {
          throw new HttpError(409, `${product.name} uchun omborda faqat ${product.stock} ${product.unit} mavjud`);
        }
        if (line.quantity < product.min_order_qty) {
          throw new HttpError(400, `${product.name} uchun minimal buyurtma: ${product.min_order_qty} ${product.unit}`);
        }

        const subtotal = product.price * line.quantity;
        totalAmount += subtotal;
        items.push({
          productId: product.id,
          productName: product.name,
          price: product.price,
          unit: product.unit,
          quantity: line.quantity,
          subtotal,
          imageUrl: product.image_url || ''
        });

        const newStock = product.stock - line.quantity;
        db.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?').run(newStock, nowISO(), product.id);
        if (newStock <= LOW_STOCK_THRESHOLD) lowStock.push({ name: product.name, unit: product.unit, newStock });
      }

      const timestamp = nowISO();
      const orderId = newId('order');
      const orderNumber = nextOrderNumber(db);
      const history = [
        { status: 'yangi', timestamp, note: 'Buyurtma tizim orqali yuborildi', changedBy: ctx.user.name }
      ];
      db.prepare(
        `INSERT INTO orders (id, order_number, company_id, company_name, store_id, store_name, store_phone, items,
                             total_amount, status, delivery_address, comment, delivery_date, history, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'yangi', ?, ?, ?, ?, ?, ?)`
      ).run(
        orderId, orderNumber, company.id, company.name, store.id, store.name, contactPhone || store.phone,
        JSON.stringify(items), totalAmount, deliveryAddress, comment, deliveryDate, JSON.stringify(history),
        timestamp, timestamp
      );

      notify({
        recipientId: company.id,
        title: `Yangi buyurtma: #${orderNumber}`,
        message: `${store.name} dan ${totalAmount.toLocaleString('uz-UZ')} so'mlik yangi buyurtma qabul qilindi.`,
        orderId
      });
      for (const item of lowStock) {
        notify({
          recipientId: company.id,
          title: 'Ombor ogohlantirishi: Mahsulot kam qoldi',
          message: `${item.name} qoldig'i ${item.newStock} ${item.unit}gacha kamaydi.`,
          type: 'stock_alert'
        });
      }
      return { orderId, orderNumber };
    });

    events.emit('orders', { companyId, storeId });
    events.emit('products', { all: true });
    events.emit('notifications', { companyId });
    return { status: 201, body: { success: true, ...result } };
  }));

  router.add('PATCH', '/api/orders/:id/status', authed((ctx) => {
    const newStatus = ctx.body.status;
    if (!Object.hasOwn(STATUS_LABELS, newStatus)) throw new HttpError(400, "Holat noto'g'ri");
    const note = v.text(ctx.body.note, 'Izoh', { max: 300 });

    const result = transaction(db, () => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(ctx.params.id);
      if (!order) throw new HttpError(404, 'Buyurtma topilmadi');

      const isCompanyOwner = ctx.user.role === 'company' && ctx.user.company_id === order.company_id;
      const isStoreOwner = ctx.user.role === 'store' && ctx.user.store_id === order.store_id;
      if (!isCompanyOwner && !isStoreOwner) throw new HttpError(404, 'Buyurtma topilmadi');

      if (FINAL_STATUSES.includes(order.status)) {
        throw new HttpError(409, "Yakunlangan buyurtma holatini o'zgartirib bo'lmaydi");
      }
      const allowed = isCompanyOwner
        ? newStatus === NEXT_STATUS[order.status] || newStatus === 'bekor_qilindi'
        : order.status === 'yangi' && newStatus === 'bekor_qilindi'; // do'kon faqat yangi buyurtmani bekor qila oladi
      if (!allowed) throw new HttpError(400, "Buyurtmani bu holatga o'tkazib bo'lmaydi");

      const timestamp = nowISO();
      const history = JSON.parse(order.history);
      history.push({
        status: newStatus,
        timestamp,
        note: note || `Holat "${STATUS_LABELS[newStatus]}"ga o'zgartirildi`,
        changedBy: ctx.user.name
      });

      // Bekor qilinsa, ombor qoldig'i bir marta qaytariladi
      if (newStatus === 'bekor_qilindi' && !order.stock_restored) {
        for (const item of JSON.parse(order.items)) {
          db.prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?').run(
            item.quantity, timestamp, item.productId
          );
        }
      }
      db.prepare(
        `UPDATE orders SET status = ?, history = ?, updated_at = ?, stock_restored = ?
         WHERE id = ?`
      ).run(newStatus, JSON.stringify(history), timestamp, newStatus === 'bekor_qilindi' ? 1 : order.stock_restored, order.id);

      // O'zgartirmagan tomonga bildirishnoma
      notify({
        recipientId: isCompanyOwner ? order.store_id : order.company_id,
        title: `Buyurtma #${order.order_number} holati yangilandi`,
        message: `Buyurtma yangi holati: "${STATUS_LABELS[newStatus]}".${note ? ` ${note}` : ''}`,
        orderId: order.id
      });

      return { order: db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id), restoredStock: newStatus === 'bekor_qilindi' };
    });

    const { order } = result;
    events.emit('orders', { companyId: order.company_id, storeId: order.store_id });
    events.emit('notifications', { companyId: order.company_id, storeId: order.store_id });
    if (result.restoredStock) events.emit('products', { all: true });
    return toOrder(order);
  }));

  // ---- NOTIFICATIONS ----
  router.add('GET', '/api/notifications', authed((ctx) =>
    db
      .prepare('SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 100')
      .all(recipientIdOf(ctx.user))
      .map(toNotification)
  ));

  router.add('POST', '/api/notifications/read-all', authed((ctx) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?').run(recipientIdOf(ctx.user));
    events.emit('notifications', { companyId: ctx.user.company_id, storeId: ctx.user.store_id });
    return { success: true };
  }));

  router.add('POST', '/api/notifications/:id/read', authed((ctx) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(
      ctx.params.id, recipientIdOf(ctx.user)
    );
    events.emit('notifications', { companyId: ctx.user.company_id, storeId: ctx.user.store_id });
    return { success: true };
  }));

  // ---- REAL VAQT (SSE) ----
  router.add('GET', '/api/events', authed((ctx) => {
    ctx.res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    events.add(ctx.res, { companyId: ctx.user.company_id, storeId: ctx.user.store_id });
    return HANDLED;
  }));

  router.add('GET', '/api/health', () => {
    db.prepare('SELECT 1').get();
    return { status: 'ok' };
  });

  // ---- Statik fayllar (frontend) ----
  const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain'
  };

  function serveStatic(req, res, pathname) {
    const root = config.staticDir;
    let file = path.join(root, decodeURIComponent(pathname));
    if (!file.startsWith(root + path.sep) && file !== root) throw new HttpError(403, 'Taqiqlangan');

    let isAsset = pathname.startsWith('/assets/');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (path.extname(pathname)) throw new HttpError(404, 'Topilmadi');
      file = path.join(root, 'index.html'); // SPA: noma'lum yo'llar index.html ga
      isAsset = false;
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Frontend topilmadi. Avval "npm run build" ni bajaring.');
    }

    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  }

  const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src https://fonts.gstatic.com; img-src 'self' data: https: http:; connect-src 'self'; " +
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  };

  // ---- Asosiy so'rov ishlovchisi ----
  async function handler(req, res) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);

    try {
      const url = new URL(req.url, 'http://localhost');

      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Ruxsat etilmagan usul');
        return serveStatic(req, res, url.pathname);
      }

      // CSRF himoyasi: o'zgartiruvchi so'rovlar faqat shu saytning o'zidan kelishi kerak
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const origin = req.headers.origin;
        if (origin) {
          const expectedHost =
            (config.trustProxy && req.headers['x-forwarded-host']) || req.headers.host;
          let originHost = '';
          try {
            originHost = new URL(origin).host;
          } catch {
            /* noto'g'ri origin */
          }
          if (originHost !== expectedHost) throw new HttpError(403, "So'rov manbasi ruxsat etilmagan");
        }
      }

      const { handler: routeHandler, params, pathMatched } = router.find(req.method, url.pathname);
      if (!routeHandler) throw new HttpError(pathMatched ? 405 : 404, pathMatched ? 'Usul ruxsat etilmagan' : 'Topilmadi');

      const ctx = {
        req,
        res,
        params,
        query: url.searchParams,
        user: sessionUser(req),
        body: req.method === 'GET' || req.method === 'HEAD' ? {} : await readJson(req)
      };

      const result = await routeHandler(ctx);
      if (result === HANDLED) return;

      // Marshrut obyekt yoki { status, headers, body } qaytarishi mumkin
      const wrapped = result && typeof result === 'object' && 'body' in result && ('status' in result || 'headers' in result);
      sendJson(res, wrapped ? result.status || 200 : 200, wrapped ? result.body : result, wrapped ? result.headers : {});
    } catch (err) {
      if (res.headersSent) return res.end();
      if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message });
      console.error('Kutilmagan server xatosi:', err);
      sendJson(res, 500, { error: 'Serverda xatolik yuz berdi' });
    }
  }

  // Muddati o'tgan sessiyalar va eski limit yozuvlarini tozalash
  const cleanup = setInterval(() => {
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowISO());
    loginLimiter.sweep();
    loginIpLimiter.sweep();
    registerLimiter.sweep();
  }, 3600_000);
  cleanup.unref();

  return {
    handler,
    db,
    close() {
      clearInterval(cleanup);
      events.closeAll();
      db.close();
    }
  };
}
