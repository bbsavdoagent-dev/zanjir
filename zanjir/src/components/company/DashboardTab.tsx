import React from 'react';
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';
import { COMPANY_STATUS_BADGES, getStatusBadge } from '../../constants/orderStatus';
import { formatUZS, formatShortDate } from '../../utils/formatters';
import { DashboardStats } from '../../hooks/useCompanyStats';

interface DashboardTabProps {
  stats: DashboardStats;
  orders: Order[];
  onQuickRestock: (productId: string, currentStock: number) => void;
  onShowAllOrders: () => void;
  onSelectOrder: (order: Order) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  orders,
  onQuickRestock,
  onShowAllOrders,
  onSelectOrder
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Bugungi savdo
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
            {formatUZS(stats.todaySales)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Jonli hisob</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Haftalik savdo (7 kun)
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {formatUZS(stats.weeklySales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Tasdiqlangan buyurtmalar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Oylik aylanma (30 kun)
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {formatUZS(stats.monthlySales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Umumiy hajm</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Yangi buyurtmalar
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl sm:text-3xl font-black text-amber-600">
              {stats.newOrdersCount}
            </p>
            <span className="text-xs text-slate-500">/ jami {stats.totalOrders} ta</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Tasdiqlash kutilmoqda</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Low stock alerts (Omborda kam qolgan mahsulotlar) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Omborda kam qolgan tovarlar
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {stats.lowStockProducts.length} ta ogohlantirish
            </span>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Barcha tovarlar zaxirasi yetarli darajada!
            </p>
          ) : (
            <div className="divide-y divide-slate-100 space-y-2">
              {stats.lowStockProducts.map((p) => (
                <div key={p.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-rose-600 font-bold">
                      Qoldiq: {p.stock} {p.unit} (Min: {p.minOrderQty})
                    </p>
                  </div>
                  <button
                    onClick={() => onQuickRestock(p.id, p.stock)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] shrink-0 transition-colors"
                    title="Zaxiraga +50 dona qo'shish"
                  >
                    +50 to'ldirish
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top selling products */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Eng ko'p sotilgan mahsulotlar
            </h3>
          </div>

          {stats.topSelling.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Hozircha sotuv statistikasi mavjud emas
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topSelling.map(({ product, qty, revenue }, idx) => (
                <div key={product.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {qty} {product.unit} sotildi
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-900 shrink-0">
                    {formatUZS(revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="font-extrabold text-sm text-slate-900">So'nggi buyurtmalar</h3>
            </div>
            <button
              onClick={() => onShowAllOrders()}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              Barchasi
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Buyurtmalar yo'q</p>
          ) : (
            <div className="space-y-2.5">
              {orders.slice(0, 4).map((o) => {
                const badge = getStatusBadge(COMPANY_STATUS_BADGES, o.status);
                return (
                  <div
                    key={o.id}
                    onClick={() => onSelectOrder(o)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900">#{o.orderNumber}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{o.storeName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900">{formatUZS(o.totalAmount)}</p>
                      <p className="text-[10px] text-slate-400">{formatShortDate(o.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
