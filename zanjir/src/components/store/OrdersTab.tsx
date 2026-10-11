import React from 'react';
import { Building2, ShoppingBag, RotateCcw } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { STORE_STATUS_BADGES, getStatusBadge } from '../../constants/orderStatus';
import { formatUZS, formatUzbekDate } from '../../utils/formatters';

interface TrackingStep {
  label: string;
  isReached: (status: OrderStatus) => boolean;
}

/** Buyurtma bosqichlari: qaysi holatda qaysi bosqich "yashil" bo'lishi. */
const TRACKING_STEPS: TrackingStep[] = [
  { label: '1. Yangi', isReached: (s) => s !== 'bekor_qilindi' },
  {
    label: '2. Tasdiqlandi',
    isReached: (s) => ['tasdiqlandi', 'yigilmoqda', 'yetkazilmoqda', 'yetkazildi'].includes(s)
  },
  {
    label: "3. Yig'ilmoqda",
    isReached: (s) => ['yigilmoqda', 'yetkazilmoqda', 'yetkazildi'].includes(s)
  },
  { label: "4. Yo'lda", isReached: (s) => ['yetkazilmoqda', 'yetkazildi'].includes(s) },
  { label: '5. Yetkazildi', isReached: (s) => s === 'yetkazildi' }
];

interface OrdersTabProps {
  orders: Order[];
  onGoToCatalog: () => void;
  onSelectOrder: (order: Order) => void;
  onReorder: (order: Order) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onGoToCatalog,
  onSelectOrder,
  onReorder
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <p className="font-semibold text-sm text-slate-600">Buyurtmalar tarixi bo'sh</p>
          <p className="text-xs max-w-sm mx-auto">
            Katalogdan kerakli mahsulotlarni tanlab, birinchi buyurtmangizni yuboring.
          </p>
          <button
            onClick={() => onGoToCatalog()}
            className="mt-2 px-5 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            Katalogga o'tish
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const badge = getStatusBadge(STORE_STATUS_BADGES, o.status);
            return (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4 hover:border-emerald-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-sm text-slate-900">
                        Buyurtma #{o.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Ta'minotchi: {o.companyName}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
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
                </div>

                {/* Items preview list */}
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {o.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.quantity} {item.unit} × {formatUZS(item.price)}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 shrink-0">
                        {formatUZS(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Buyurtma bosqichlari */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2">
                    {TRACKING_STEPS.map((step) => (
                      <span key={step.label} className={step.isReached(o.status) ? 'text-emerald-700' : ''}>
                        {step.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions: Reorder & Details */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectOrder(o)}
                    className="text-xs text-slate-600 hover:text-emerald-800 font-semibold"
                  >
                    Batafsil ma'lumot va izohlar
                  </button>

                  <button
                    onClick={() => onReorder(o)}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Qayta buyurtma qilish</span>
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
