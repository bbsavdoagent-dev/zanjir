import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Order } from '../../types';
import { STORE_STATUS_BADGES } from '../../constants/orderStatus';
import { formatUZS, formatUzbekDate } from '../../utils/formatters';

interface OrderDetailModalProps {
  order: Order;
  onReorder: (order: Order) => void;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onReorder, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scale text-slate-800">
        <div className="p-5 bg-emerald-950 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base">
              Buyurtma #{order.orderNumber}
            </h3>
            <p className="text-xs text-emerald-300">
              {formatUzbekDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 flex items-center justify-center text-emerald-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <p>
              <strong>Ta'minotchi:</strong> {order.companyName}
            </p>
            <p>
              <strong>Yetkazish manzili:</strong> {order.deliveryAddress}
            </p>
            {order.comment && (
              <p>
                <strong>Sizning izohingiz:</strong> "{order.comment}"
              </p>
            )}
          </div>

          <div>
            <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
              Buyurtma xronologiyasi:
            </h5>
            <div className="space-y-2 border-l-2 border-emerald-300 pl-4 ml-1">
              {order.history?.map((h, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <p className="font-bold text-slate-900 capitalize">
                    {STORE_STATUS_BADGES[h.status]?.label || h.status}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatUzbekDate(h.timestamp)}</p>
                  <p className="text-slate-600 mt-0.5">{h.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">
                Umumiy summa:
              </span>
              <span className="text-base font-black text-emerald-900">
                {formatUZS(order.totalAmount)}
              </span>
            </div>

            <button
              onClick={() => {
                    onReorder(order);
                    onClose();
                  }}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Qayta buyurtma qilish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
