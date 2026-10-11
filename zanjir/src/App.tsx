/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CompanyPortal } from './components/company/CompanyPortal';
import { StorePortal } from './components/store/StorePortal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { UserRole } from './types';

function MainApp() {
  const { currentUser, loading } = useAuth();

  const [activeView, setActiveView] = useState<string>('landing');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  // Auto route view when user changes role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'company') {
        setActiveView('company_portal');
      } else if (currentUser.role === 'store') {
        setActiveView('store_portal');
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleOpenAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthInitialTab(tab);
    setIsAuthOpen(true);
  };

  const handleSelectRole = (role: UserRole) => {
    if (role === 'company') {
      setActiveView('company_portal');
    } else {
      setActiveView('store_portal');
    }
  };

  const handleOrderSuccess = (orderId: string) => {
    setHighlightOrderId(orderId);
    setActiveView('store_portal');
  };

  // Kabinetlarga faqat kirgan va roli mos foydalanuvchi kira oladi
  const ownPortalView = currentUser?.role === 'company' ? 'company_portal' : 'store_portal';
  const isPortalView = activeView === 'company_portal' || activeView === 'store_portal';
  const currentView =
    isPortalView && (!currentUser || activeView !== ownPortalView)
      ? 'landing'
      : activeView;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-3xl animate-bounce">
          Z
        </div>
        <p className="text-sm font-bold text-emerald-300">Zanjir Platformasi yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between pb-16 md:pb-0 font-sans">
      {/* Top Header */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={handleOpenAuth}
        activeView={currentView}
        setActiveView={setActiveView}
      />

      {/* Main View Render */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onSelectRole={handleSelectRole}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'company_portal' && <CompanyPortal />}

        {currentView === 'store_portal' && (
          <StorePortal
            onOpenCart={() => setIsCartOpen(true)}
            highlightOrderId={highlightOrderId}
          />
        )}
      </main>

      {/* Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
        onSuccessRole={handleSelectRole}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={currentView}
        setActiveView={setActiveView}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => handleOpenAuth('login')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
