import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { FALLBACK_ORDER_ITEM_IMAGE_URL } from '../../constants/defaults';
import { COMPANY_STATUS_BADGES, getStatusBadge } from '../../constants/orderStatus';
import { formatUZS, formatUzbekDate } from '../../utils/formatters';

interface OrderDetailModalProps {
  order: Order;
  statusNote: string;
  onStatusNoteChange: (value: string) => void;
  onProgressStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  statusNote,
  onStatusNoteChange,
  onProgressStatus,
  onClose
}) => {
  const badge = getStatusBadge(COMPANY_STATUS_BADGES, order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scale text-slate-800">
        {/* Header */}
        <div className="p-5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base">
                Buyurtma #{order.orderNumber}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                >
                  {badge.label}
              </span>
            </div>
            <p className="text-xs text-emerald-300">
              {formatUzbekDate(order.createdAt)}
            </p>
          </div>

          <button
            onClick={() => onClose()}
            className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 flex items-center justify-center text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Store details */}
          <div className="grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Buyurtmachi do'kon
              </span>
              <p className="font-bold text-sm text-slate-900">{order.storeName}</p>
              <p className="text-slate-600 mt-0.5">{order.storePhone}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Yetkazib berish manzili
              </span>
              <p className="text-slate-700">{order.deliveryAddress}</p>
              {order.deliveryDate && (
                <p className="text-emerald-700 font-semibold mt-1">
                  Kutilayotgan sana: {order.deliveryDate}
                </p>
              )}
            </div>
            {order.comment && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Do'kon izohi:
                </span>
                <p className="text-slate-700 italic">"{order.comment}"</p>
              </div>
            )}
          </div>

          {/* Items Table Snapshot */}
          <div>
            <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2">
              Qayd etilgan tovarlar (Snapshot narxlar)
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl || FALLBACK_ORDER_ITEM_IMAGE_URL}
                      alt={item.productName}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity} {item.unit} × {formatUZS(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900">{formatUZS(item.subtotal)}</span>
                </div>
              ))}
              <div className="p-3 bg-slate-50 flex items-center justify-between font-black text-sm">
                <span>Jami summa:</span>
                <span className="text-emerald-900 text-base">
                  {formatUZS(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Machine Controls (Pipeline) */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
            <h4 className="font-bold text-xs text-emerald-950">
              Buyurtma holatini oldinga surish (Pipeline)
            </h4>

            {order.status === 'yetkazildi' ? (
              <p className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Buyurtma muvaffaqiyatli yakunlangan va do'konga topshirilgan.
              </p>
            ) : order.status === 'bekor_qilindi' ? (
              <p className="text-xs text-rose-700 font-bold">
                Buyurtma bekor qilingan va tovarlar omborga qaytarilgan.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => onStatusNoteChange(e.target.value)}
                    placeholder="Holat izohi (masalan: Isuzu 01 777 AAA yuklandi...)"
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === 'yangi' && (
                    <button
                      onClick={() => onProgressStatus(order.id, 'tasdiqlandi')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      ✓ Tasdiqlash
                    </button>
                  )}

                  {order.status === 'tasdiqlandi' && (
                    <button
                      onClick={() => onProgressStatus(order.id, 'yigilmoqda')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      📦 Omborga yig'ishga yuborish
                    </button>
                  )}

                  {order.status === 'yigilmoqda' && (
                    <button
                      onClick={() => onProgressStatus(order.id, 'yetkazilmoqda')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      🚚 Kuryerga berish (Yo'lga chiqdi)
                    </button>
                  )}

                  {order.status === 'yetkazilmoqda' && (
                    <button
                      onClick={() => onProgressStatus(order.id, 'yetkazildi')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      ✓ Yetkazib berildi deb yakunlash
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm('Buyurtmani bekor qilmoqchimisiz? Ombor zaxirasi avtomatik tiklanadi.')) {
                        onProgressStatus(order.id, 'bekor_qilindi');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all border border-rose-200"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Audit Trail History Log */}
          <div>
            <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2">
              Buyurtma xronologiyasi (Tarix)
            </h4>
            <div className="space-y-2 border-l-2 border-emerald-200 pl-4 ml-2">
              {order.history?.map((hist, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 capitalize">
                      {COMPANY_STATUS_BADGES[hist.status]?.label || hist.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatUzbekDate(hist.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{hist.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
