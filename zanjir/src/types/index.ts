export type UserRole = 'company' | 'store';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  companyId?: string;
  storeId?: string;
  address?: string;
  createdAt?: string;
}

export interface Company {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  ownerId: string;
  logoUrl?: string;
  minOrderAmount?: number;
  createdAt?: string;
}

export interface Store {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  ownerId: string;
  city: string;
  createdAt?: string;
}

export type ProductUnit = 'dona' | 'quti' | 'kg' | 'litr';

export interface Product {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  price: number;
  unit: ProductUnit;
  minOrderQty: number;
  stock: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  unit: ProductUnit;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export type OrderStatus =
  | 'yangi'
  | 'tasdiqlandi'
  | 'yigilmoqda'
  | 'yetkazilmoqda'
  | 'yetkazildi'
  | 'bekor_qilindi';

export interface OrderHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note: string;
  changedBy: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  companyId: string;
  companyName: string;
  storeId: string;
  storeName: string;
  storePhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  comment?: string;
  deliveryDate?: string;
  history: OrderHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_status' | 'stock_alert' | 'system';
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
