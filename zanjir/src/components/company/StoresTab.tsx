import React from 'react';
import { Store as StoreIcon, Phone, MapPin } from 'lucide-react';
import { Order, Store } from '../../types';
import { formatUZS } from '../../utils/formatters';

interface StoresTabProps {
  stores: Store[];
  orders: Order[];
}

export const StoresTab: React.FC<StoresTabProps> = ({ stores, orders }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => {
          // Calculate spending for this specific company
          const storeOrders = orders.filter((o) => o.storeId === s.id);
          const totalSpent = storeOrders.reduce(
            (sum, o) => (o.status !== 'bekor_qilindi' ? sum + o.totalAmount : sum),
            0
          );
          
          return (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{s.name}</h4>
                  <p className="text-xs text-slate-500">Egasi: {s.ownerName}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.address}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    Xaridlar: {storeOrders.length} ta
                  </span>
                  <span className="font-black text-emerald-900">{formatUZS(totalSpent)}</span>
                </div>

                <a
                  href={`tel:${s.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Qo'ng'iroq</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
