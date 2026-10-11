import { UserRole } from '../types';

export interface RegisterParams {
  businessName: string;
  personName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  role: UserRole;
  category?: string;
}

/** Server tekshiruvlari bilan bir xil chegaralar. */
export const FIELD_LIMITS = {
  businessName: 120,
  personName: 100,
  phone: 30,
  email: 100
} as const;

export const MIN_PASSWORD_LENGTH = 8;

/** Forma qiymatlarini tozalaydi (bo'sh joylar olib tashlanadi, email kichik harfga o'tadi). */
export function normalizeRegisterParams(params: RegisterParams): RegisterParams {
  return {
    ...params,
    businessName: params.businessName.trim(),
    personName: params.personName.trim(),
    phone: params.phone.trim(),
    email: params.email.trim().toLowerCase(),
    address: params.address.trim()
  };
}

/** Ma'lumot noto'g'ri bo'lsa, xato matnini qaytaradi (server ham qayta tekshiradi). */
export function validateRegisterParams(params: RegisterParams): string | null {
  if (!params.businessName) return "Korxona yoki do'kon nomini kiriting";
  if (params.businessName.length > FIELD_LIMITS.businessName) return 'Korxona nomi juda uzun';
  if (!params.personName) return "Mas'ul shaxs ismini kiriting";
  if (params.personName.length > FIELD_LIMITS.personName) return 'Ism juda uzun';
  if (params.phone.length < 9) return "Telefon raqamingizni to'liq kiriting";
  if (params.phone.length > FIELD_LIMITS.phone) return 'Telefon raqami juda uzun';
  if (!params.email.includes('@')) return "To'g'ri elektron pochta manzilini kiriting";
  if (params.email.length > FIELD_LIMITS.email) return 'Elektron pochta manzili juda uzun';
  if (params.password.length < MIN_PASSWORD_LENGTH) {
    return `Parol kamida ${MIN_PASSWORD_LENGTH} ta belgidan iborat bo'lishi shart`;
  }
  if (!params.address) return 'Yetkazib berish yoki faoliyat manzilini kiriting';
  return null;
}
