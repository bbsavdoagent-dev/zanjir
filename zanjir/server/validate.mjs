import { HttpError } from './http.mjs';

const bad = (message) => new HttpError(400, message);

export const UNITS = ['dona', 'quti', 'kg', 'litr'];
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function text(value, label, { min = 0, max }) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw bad(`${label} noto'g'ri`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw bad(`${label}ni kiriting`);
  if (trimmed.length > max) throw bad(`${label} juda uzun`);
  return trimmed;
}

export function id(value, label = 'ID') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw bad(`Noto'g'ri parametr: ${label}`);
  return value;
}

export function integer(value, label, { min = 0, max = 1_000_000_000 } = {}) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw bad(`${label} noto'g'ri (${min} dan ${max} gacha butun son bo'lishi kerak)`);
  }
  return n;
}

export function money(value, label) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1e12) throw bad(`${label} noto'g'ri`);
  return n;
}

export function httpUrl(value, label) {
  const v = text(value, label, { max: 500 });
  if (v === '') return '';
  let url;
  try {
    url = new URL(v);
  } catch {
    throw bad(`${label} to'g'ri havola bo'lishi kerak`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw bad(`${label} http(s) havola bo'lishi kerak`);
  return v;
}

export const email = (value) => {
  const v = text(value, 'Elektron pochta', { min: 1, max: 100 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw bad("To'g'ri elektron pochta manzilini kiriting");
  return v;
};

export function password(value) {
  if (typeof value !== 'string' || value.length < 8) throw bad("Parol kamida 8 ta belgidan iborat bo'lishi shart");
  if (value.length > 200) throw bad('Parol juda uzun');
  return value;
}

export function parseRegistration(body) {
  const role = body.role;
  if (role !== 'company' && role !== 'store') throw bad("Rol noto'g'ri");
  const phone = text(body.phone, 'Telefon raqami', { min: 9, max: 30 });
  return {
    role,
    businessName: text(body.businessName, role === 'company' ? 'Korxona nomi' : "Do'kon nomi", { min: 1, max: 120 }),
    personName: text(body.personName, "Mas'ul shaxs ismi", { min: 1, max: 100 }),
    phone,
    email: email(body.email),
    password: password(body.password),
    address: text(body.address, 'Manzil', { min: 1, max: 300 }),
    category: text(body.category, 'Kategoriya', { max: 60 })
  };
}

export function parseProduct(body, { partial }) {
  const out = {};
  const has = (key) => body[key] !== undefined;
  const need = (key) => !partial || has(key);

  if (need('name')) out.name = text(body.name, 'Mahsulot nomi', { min: 1, max: 150 });
  if (need('description')) out.description = text(body.description, 'Tavsif', { max: 1000 });
  if (need('category')) out.category = text(body.category, 'Kategoriya', { min: 1, max: 60 });
  if (need('price')) out.price = money(body.price, 'Narx');
  if (need('unit')) {
    if (!UNITS.includes(body.unit)) throw bad("O'lchov birligi noto'g'ri");
    out.unit = body.unit;
  }
  if (need('minOrderQty')) out.minOrderQty = integer(body.minOrderQty, 'Minimal buyurtma', { min: 1 });
  if (need('stock')) out.stock = integer(body.stock, 'Ombor qoldig\'i', { min: 0 });
  if (need('isActive')) {
    if (typeof body.isActive !== 'boolean') throw bad('Holat noto\'g\'ri');
    out.isActive = body.isActive;
  }
  if (need('imageUrl')) out.imageUrl = httpUrl(body.imageUrl, 'Rasm havolasi');
  return out;
}

/** Buyurtma qatorlari; bir xil mahsulot takrorlansa, miqdorlari qo'shiladi. */
export function parseOrderLines(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) throw bad("Savat bo'sh yoki juda katta");
  const merged = new Map();
  for (const entry of raw) {
    const productId = id(entry?.productId, 'productId');
    const quantity = integer(entry?.quantity, 'Mahsulot miqdori', { min: 1, max: 1_000_000 });
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }
  return Array.from(merged, ([productId, quantity]) => ({ productId, quantity }));
}
