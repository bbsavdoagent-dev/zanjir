import { useMemo } from 'react';
import { Order, Product } from '../types';
import { LOW_STOCK_THRESHOLD } from '../constants/defaults';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TopSellingItem {
  product: Product;
  qty: number;
  revenue: number;
}

export interface DashboardStats {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalOrders: number;
  newOrdersCount: number;
  lowStockProducts: Product[];
  topSelling: TopSellingItem[];
}

/** Kompaniya dashboard ko'rsatkichlarini hisoblaydi (bekor qilingan buyurtmalar savdoga kirmaydi). */
export function useCompanyStats(orders: Order[], products: Product[]): DashboardStats {
  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();

    let todaySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;
    let newOrdersCount = 0;

    const salesByProduct: Record<string, TopSellingItem> = {};

    for (const order of orders) {
      if (order.status === 'yangi') {
        newOrdersCount++;
      }
      if (order.status === 'bekor_qilindi') continue;

      if (order.createdAt.startsWith(today)) todaySales += order.totalAmount;
      if (order.createdAt >= sevenDaysAgo) weeklySales += order.totalAmount;
      if (order.createdAt >= thirtyDaysAgo) monthlySales += order.totalAmount;

      for (const item of order.items) {
        if (!salesByProduct[item.productId]) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            salesByProduct[item.productId] = { product, qty: 0, revenue: 0 };
          }
        }
        const entry = salesByProduct[item.productId];
        if (entry) {
          entry.qty += item.quantity;
          entry.revenue += item.subtotal;
        }
      }
    }

    return {
      todaySales,
      weeklySales,
      monthlySales,
      totalOrders: orders.length,
      newOrdersCount,
      lowStockProducts: products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD),
      topSelling: Object.values(salesByProduct)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
    };
  }, [orders, products]);
}
