import { OrderStatus } from '../types';

export interface StatusBadge {
  label: string;
  bg: string;
  text: string;
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  yangi: { bg: 'bg-amber-100', text: 'text-amber-800' },
  tasdiqlandi: { bg: 'bg-blue-100', text: 'text-blue-800' },
  yigilmoqda: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  yetkazilmoqda: { bg: 'bg-purple-100', text: 'text-purple-800' },
  yetkazildi: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  bekor_qilindi: { bg: 'bg-rose-100', text: 'text-rose-800' }
};

const COMPANY_LABELS: Record<OrderStatus, string> = {
  yangi: 'Yangi',
  tasdiqlandi: 'Tasdiqlandi',
  yigilmoqda: "Yig'ilmoqda",
  yetkazilmoqda: 'Yetkazilmoqda',
  yetkazildi: 'Yetkazildi',
  bekor_qilindi: 'Bekor qilindi'
};

const STORE_LABELS: Record<OrderStatus, string> = {
  yangi: 'Yangi yuborildi',
  tasdiqlandi: 'Zavod tasdiqladi',
  yigilmoqda: "Omborda yig'ilmoqda",
  yetkazilmoqda: "Kuryer yo'lda",
  yetkazildi: 'Yetkazib berildi',
  bekor_qilindi: 'Bekor qilindi'
};

/** Bildirishnoma / tarix izohlarida ishlatiladigan matnlar (servis qatlami). */
export const ORDER_STATUS_NOTE_LABELS: Record<OrderStatus, string> = {
  yangi: 'Yangi',
  tasdiqlandi: 'Tasdiqlandi',
  yigilmoqda: "Omborda yig'ilmoqda",
  yetkazilmoqda: 'Yetkazilmoqda',
  yetkazildi: 'Yetkazildi',
  bekor_qilindi: 'Bekor qilindi'
};

const buildBadges = (labels: Record<OrderStatus, string>) =>
  Object.fromEntries(
    (Object.keys(labels) as OrderStatus[]).map((status) => [
      status,
      { label: labels[status], ...STATUS_COLORS[status] }
    ])
  ) as Record<OrderStatus, StatusBadge>;

/** Kompaniya kabineti uchun status "badge"lari. */
export const COMPANY_STATUS_BADGES = buildBadges(COMPANY_LABELS);

/** Do'kon kabineti uchun status "badge"lari. */
export const STORE_STATUS_BADGES = buildBadges(STORE_LABELS);

/** Noma'lum status uchun zaxira ko'rinish. */
export const getStatusBadge = (
  badges: Record<OrderStatus, StatusBadge>,
  status: OrderStatus
): StatusBadge =>
  badges[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-700' };

/** Buyurtma holati bo'yicha filtr tugmalari (kompaniya kabineti). */
export const ORDER_FILTER_OPTIONS: { id: 'all' | OrderStatus; label: string }[] = [
  { id: 'all', label: 'Barchasi' },
  ...(Object.keys(COMPANY_LABELS) as OrderStatus[]).map((id) => ({
    id,
    label: COMPANY_LABELS[id]
  }))
];
