import React, { useState } from 'react';
import {
  ShoppingBag,
  Bell,
  Building2,
  Store as StoreIcon,
  LogOut,
  Wifi,
  WifiOff,
  ChevronDown,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NotificationItem } from '../types';
import { dbService } from '../services/dbService';
import { getNotificationRecipientId } from '../utils/notifications';
import { formatUzbekDate } from '../utils/formatters';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenAuth,
  activeView,
  setActiveView
}) => {
  const {
    currentUser,
    currentCompany,
    currentStore,
    isAuthenticated,
    isOnline,
    logout
  } = useAuth();
  const { totalCount } = useCart();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const recipientId = currentUser ? getNotificationRecipientId(currentUser) : null;

  // Joriy foydalanuvchi bildirishnomalariga obuna
  React.useEffect(() => {
    if (!recipientId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const unsub = dbService.subscribeNotifications((list) => {
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    });

    return () => unsub();
  }, [recipientId]);

  const handleMarkAllRead = async () => {
    if (!recipientId) return;
    await dbService.markAllNotificationsAsRead();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-emerald-950 text-white shadow-md border-b border-emerald-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('landing')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl tracking-tighter">
                Z
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-white">ZANJIR</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    B2B
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80 -mt-1 hidden sm:block font-medium">
                  Agentsiz. To'g'ridan-to'g'ri savdo.
                </p>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveView('landing')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'landing'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                Platforma haqida
              </button>

              {currentUser?.role === 'company' && (
                <button
                  onClick={() => setActiveView('company_portal')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeView === 'company_portal'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/60'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Kompaniya paneli
                </button>
              )}

              {currentUser?.role === 'store' && (
                <button
                  onClick={() => setActiveView('store_portal')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeView === 'store_portal'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/60'
                  }`}
                >
                  <StoreIcon className="w-4 h-4 text-emerald-400" />
                  Do'kon kabineti
                </button>
              )}
            </nav>

            {/* Right side controls: Connection badge, Cart, Notifications, Auth */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Online / Offline status */}
              <div
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isOnline ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/80 animate-pulse'
                }`}
                title={isOnline ? 'Internet aloqasi faol' : 'Internet uzilgan!'}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="hidden lg:inline">{isOnline ? 'Tarmoqda' : 'Oflayn'}</span>
              </div>

              {/* Cart Button (Always visible for stores, or accessible for exploring) */}
              <button
                onClick={onOpenCart}
                className="relative p-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 transition-all border border-emerald-700/50 flex items-center justify-center"
                aria-label="Savat"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-md animate-scale">
                    {totalCount}
                  </span>
                )}
              </button>

              {/* Notifications Bell */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="relative p-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 transition-all border border-emerald-700/50 flex items-center justify-center"
                    aria-label="Bildirishnomalar"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-emerald-950 animate-pulse" />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 z-50 animate-fade-in">
                      <div className="p-3.5 bg-emerald-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-emerald-300" />
                          <h4 className="font-bold text-sm">Bildirishnomalar</h4>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-full">
                              {unreadCount} yangi
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-emerald-200 hover:text-white underline font-medium"
                          >
                            Barchasini o'qish
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm">
                            Hozircha hech qanday bildirishnoma yo'q
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => dbService.markNotificationAsRead(item.id)}
                              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                                !item.isRead ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900">{item.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {formatUzbekDate(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-relaxed">{item.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Account / Profile / Switcher */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-white border border-emerald-700/60 transition-all text-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                      {currentUser?.name.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden sm:block max-w-[120px] truncate">
                      <p className="font-bold text-xs leading-none truncate">
                        {currentUser?.role === 'company'
                          ? currentCompany?.name || currentUser?.name || ''
                          : currentStore?.name || currentUser?.name || ''}
                      </p>
                      <p className="text-[10px] text-emerald-300 capitalize">
                        {currentUser?.role === 'company' ? 'Kompaniya' : 'Do\'kon egasi'}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                  </button>

                  {/* Foydalanuvchi menyusi */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 z-50">
                      <div className="p-4 bg-emerald-50/80 border-b border-emerald-100">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              currentUser?.role === 'company'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-teal-700 text-white'
                            }`}
                          >
                            {currentUser?.role === 'company' ? 'Kompaniya' : 'Do\'kon'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{currentUser?.phone}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{currentUser?.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                      </div>


                      <div className="p-2">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            setActiveView('landing');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-semibold transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Hisobdan chiqish
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-900/80 hover:bg-emerald-800 text-white border border-emerald-700/60 transition-all"
                  >
                    Kirish
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-sm transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ro'yxatdan o'tish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

    </>
  );
};
