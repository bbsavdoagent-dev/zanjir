import { Company, Store, Product, Order, NotificationItem, OrderStatus, CartItem } from '../types';
import { api } from './api';
import { Entity, liveFeed } from './liveFeed';

interface PlaceOrderParams {
  companyId: string;
  storeId: string;
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
  contactPhone?: string;
  comment?: string;
  deliveryDate?: string;
}

interface PlaceOrderResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
}

/**
 * Ma'lumotlar qatlami: komponentlar faqat shu sinf orqali serverga murojaat qiladi.
 * Ro'yxatlarga obuna bo'lish real vaqt yangilanishlari bilan ishlaydi.
 */
export class DBService {
  /** Ro'yxatni yuklaydi va server xabar bergan zahoti qayta yuklab turadi. */
  private subscribe<T>(entity: Entity, url: string, callback: (items: T[]) => void): () => void {
    let active = true;
    let latestRequest = 0;
    let delivered = false;

    const load = async () => {
      const requestId = ++latestRequest;
      try {
        const items = await api.get<T[]>(url);
        // Eskirgan javob yangisini bosib yubormasligi kerak
        if (!active || requestId !== latestRequest) return;
        delivered = true;
        callback(items);
      } catch (err) {
        console.error(`Ma'lumotni yuklab bo'lmadi (${url}):`, err);
        if (active && !delivered) {
          delivered = true;
          callback([]);
        }
      }
    };

    const unregister = liveFeed.register(entity, load);
    load();

    return () => {
      active = false;
      unregister();
    };
  }

  // --- COMPANIES / STORES ---
  subscribeCompanies(callback: (companies: Company[]) => void): () => void {
    return this.subscribe<Company>('companies', '/api/companies', callback);
  }

  subscribeStores(callback: (stores: Store[]) => void): () => void {
    return this.subscribe<Store>('stores', '/api/stores', callback);
  }

  // --- PRODUCTS ---
  subscribeProducts(callback: (products: Product[]) => void, companyId?: string): () => void {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return this.subscribe<Product>('products', `/api/products${query}`, callback);
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'companyName'>): Promise<Product> {
    const created = await api.post<Product>('/api/products', product);
    liveFeed.refresh('products');
    return created;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    await api.patch(`/api/products/${encodeURIComponent(id)}`, updates);
    liveFeed.refresh('products');
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/products/${encodeURIComponent(id)}`);
    liveFeed.refresh('products');
  }

  // --- ORDERS ---
  /** Server foydalanuvchi roliga qarab faqat o'z buyurtmalarini qaytaradi. */
  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    return this.subscribe<Order>('orders', '/api/orders', callback);
  }

  /** Buyurtmani server yaratadi: narxlar va ombor qoldig'i serverda tekshiriladi. */
  async placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
    if (!params.items.length) {
      throw new Error("Savat bo'sh");
    }
    const result = await api.post<PlaceOrderResult>('/api/orders', params);
    liveFeed.refresh('orders', 'products', 'notifications');
    return result;
  }

  /** Holat o'zgartiriladi; bekor qilinsa, ombor qoldig'ini server tiklaydi. */
  async updateOrderStatus(params: { orderId: string; newStatus: OrderStatus; note: string }): Promise<void> {
    await api.patch(`/api/orders/${encodeURIComponent(params.orderId)}/status`, {
      status: params.newStatus,
      note: params.note
    });
    liveFeed.refresh('orders', 'products', 'notifications');
  }

  // --- NOTIFICATIONS ---
  subscribeNotifications(callback: (notifications: NotificationItem[]) => void): () => void {
    return this.subscribe<NotificationItem>('notifications', '/api/notifications', callback);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await api.post(`/api/notifications/${encodeURIComponent(id)}/read`);
    liveFeed.refresh('notifications');
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await api.post('/api/notifications/read-all');
    liveFeed.refresh('notifications');
  }

  /** Qayta buyurtma uchun: joriy ombor qoldig'i va faollikni tekshiradi. */
  checkReorderEligibility(items: { productId: string; quantity: number }[]) {
    return api.post<{ eligible: boolean; availableItems: CartItem[]; warnings: string[] }>(
      '/api/products/check',
      { items }
    );
  }
}

export const dbService = new DBService();
