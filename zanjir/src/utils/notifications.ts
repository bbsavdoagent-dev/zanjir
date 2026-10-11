import { UserProfile } from '../types';

/**
 * Bildirishnomalar kimga yuborilishini aniqlaydi: kompaniya yoki do'kon ID si
 * (tizim bildirishnomalarni shu ID bo'yicha yaratadi).
 */
export function getNotificationRecipientId(user: UserProfile): string {
  if (user.role === 'company') return user.companyId || user.id;
  return user.storeId || user.id;
}
