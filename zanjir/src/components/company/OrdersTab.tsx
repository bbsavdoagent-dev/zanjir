import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import {
  COMPANY_STATUS_BADGES,
  ORDER_FILTER_OPTIONS,
  getStatusBadge
} from '../../constants/orderStatus';
import { formatUZS, formatUzbekDate } from '../../utils/formatters';

interface OrdersTabProps {
  orders: Order[];
  statusFilter: 'all' | OrderStatus;
  onStatusFilterChange: (status: 'all' | OrderStatus) => void;
  onSelectOrder: (order: Order) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  statusFilter,
  onStatusFilterChange,
  onSelectOrder
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Order Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
        {ORDER_FILTER_OPTIONS.map((st) => (
          <button
            key={st.id}
            onClick={() => onStatusFilterChange(st.id)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              statusFilter === st.id
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Orders Table / Cards */}
      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <p className="font-semibold text-sm text-slate-600">Buyurtmalar topilmadi</p>
          <p className="text-xs">Ushbu holatda hozircha buyurtma mavjud emas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const badge = getStatusBadge(COMPANY_STATUS_BADGES, o.status);
            return (
              <div
                key={o.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-300 transition-all cursor-pointer"
                onClick={() => onSelectOrder(o)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    #{o.orderNumber.slice(-4)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-sm text-slate-900">
                        Buyurtma #{o.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">{o.storeName}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                      <span>{o.deliveryAddress}</span>
                      <span>•</span>
                      <span>{o.items.length} xil mahsulot</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Jami summa:
                    </span>
                    <span className="text-base font-black text-emerald-900">
                      {formatUZS(o.totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {formatUzbekDate(o.createdAt)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOrder(o);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Batafsil</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
