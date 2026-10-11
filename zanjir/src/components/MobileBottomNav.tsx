import React from 'react';
import {
  Home,
  Building2,
  Store as StoreIcon,
  ShoppingBag,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface MobileBottomNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  onOpenCart,
  onOpenAuth
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { totalCount } = useCart();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-2 px-3">
      <div className="flex items-center justify-around text-[10px] font-bold text-slate-500">
        <button
          onClick={() => setActiveView('landing')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeView === 'landing' ? 'text-emerald-800' : 'hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Bosh sahifa</span>
        </button>

        {currentUser?.role === 'company' ? (
          <button
            onClick={() => setActiveView('company_portal')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeView === 'company_portal' ? 'text-emerald-800' : 'hover:text-slate-900'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Kompaniya</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveView('store_portal')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeView === 'store_portal' ? 'text-emerald-800' : 'hover:text-slate-900'
            }`}
          >
            <StoreIcon className="w-5 h-5" />
            <span>Katalog</span>
          </button>
        )}

        {/* Central Cart button */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center gap-1 text-slate-700 relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-emerald-800" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-4.5 px-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </div>
          <span>Savat</span>
        </button>

        {isAuthenticated ? (
          <button
            onClick={() => {
              if (currentUser?.role === 'company') {
                setActiveView('company_portal');
              } else {
                setActiveView('store_portal');
              }
            }}
            className="flex flex-col items-center gap-1 text-slate-700"
          >
            <Clock className="w-5 h-5" />
            <span>Buyurtmalar</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center gap-1 text-slate-700"
          >
            <User className="w-5 h-5" />
            <span>Kirish</span>
          </button>
        )}
      </div>
    </div>
  );
};
