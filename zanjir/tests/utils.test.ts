import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getNotificationRecipientId } from '../src/utils/notifications';
import { COMPANY_STATUS_BADGES, STORE_STATUS_BADGES, getStatusBadge } from '../src/constants/orderStatus';
import {
  RegisterParams,
  FIELD_LIMITS,
  normalizeRegisterParams,
  validateRegisterParams
} from '../src/utils/registration';

const baseParams: RegisterParams = {
  businessName: '  Samarqand Bottlers  ',
  personName: ' Anvar ',
  phone: ' +998901234567 ',
  email: ' Anvar@Example.COM ',
  password: 'secret123',
  address: ' Samarqand sh. ',
  role: 'company'
};

describe("Ro'yxatdan o'tish formasi", () => {
  const p = normalizeRegisterParams(baseParams);

  it("Qiymatlar tozalanadi (bo'sh joylar, kichik harfli email)", () => {
    assert.strictEqual(p.email, 'anvar@example.com');
    assert.strictEqual(p.businessName, 'Samarqand Bottlers');
    assert.strictEqual(p.phone, '+998901234567');
    assert.strictEqual(validateRegisterParams(p), null);
  });

  it("Noto'g'ri qiymatlar rad etiladi", () => {
    assert.ok(validateRegisterParams({ ...p, businessName: '' }));
    assert.ok(validateRegisterParams({ ...p, businessName: 'x'.repeat(FIELD_LIMITS.businessName + 1) }));
    assert.ok(validateRegisterParams({ ...p, phone: '123' }));
    assert.ok(validateRegisterParams({ ...p, email: 'emailsiz' }));
    assert.ok(validateRegisterParams({ ...p, password: '1234567' }));
    assert.ok(validateRegisterParams({ ...p, address: '' }));
  });
});

describe('Yordamchi funksiyalar', () => {
  it("Bildirishnoma qabul qiluvchisi: kompaniya/do'kon ID si", () => {
    const base = { id: 'u1', name: 'n', email: 'e', phone: 'p', createdAt: 'x' };
    assert.strictEqual(getNotificationRecipientId({ ...base, role: 'company', companyId: 'comp_1' }), 'comp_1');
    assert.strictEqual(getNotificationRecipientId({ ...base, role: 'store', storeId: 'store_1' }), 'store_1');
  });

  it("Status badge'lari barcha holatlar uchun mavjud va noma'lum holatda zaxira beradi", () => {
    for (const status of ['yangi', 'tasdiqlandi', 'yigilmoqda', 'yetkazilmoqda', 'yetkazildi', 'bekor_qilindi'] as const) {
      assert.ok(COMPANY_STATUS_BADGES[status].label);
      assert.ok(STORE_STATUS_BADGES[status].label);
    }
    // @ts-expect-error noma'lum holat
    assert.strictEqual(getStatusBadge(COMPANY_STATUS_BADGES, 'nomalum').label, 'nomalum');
  });
});
