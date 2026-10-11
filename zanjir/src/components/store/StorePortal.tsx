import React, { useEffect, useMemo, useState } from 'react';
import { Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Company, Order, Product } from '../../types';
import { dbService } from '../../services/dbService';
import { useToast } from '../../hooks/useToast';
import { PortalTabs } from '../common/PortalTabs';
import { CatalogSort, CatalogTab } from './CatalogTab';
import { OrdersTab } from './OrdersTab';
import { OrderDetailModal } from './OrderDetailModal';

type StoreTab = 'catalog' | 'orders';

interface StorePortalProps {
  onOpenCart: () => void;
  highlightOrderId?: string | null;
}

export const StorePortal: React.FC<StorePortalProps> = ({ onOpenCart, highlightOrderId }) => {
  const { currentUser, currentStore } = useAuth();
  const { addToCart } = useCart();
  const { toastMessage, showToast } = useToast();

  const [activeTab, setActiveTab] = useState<StoreTab>('catalog');

  // Real vaqt ma'lumotlari
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Qidiruv va filtrlar
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<CatalogSort>('popular');

  const storeId = currentUser?.storeId || currentStore?.id || '';

  useEffect(() => {
    if (!storeId) return;

    const unsubCompanies = dbService.subscribeCompanies(setCompanies);
    const unsubProducts = dbService.subscribeProducts(setProducts);
    const unsubOrders = dbService.subscribeOrders(setOrders);

    return () => {
      unsubCompanies();
      unsubProducts();
      unsubOrders();
    };
  }, [storeId]);

  // Yangi buyurtmadan keyin shu buyurtmani ochamiz
  useEffect(() => {
    if (!highlightOrderId) return;
    const found = orders.find((o) => o.id === highlightOrderId);
    if (found) {
      setSelectedOrder(found);
      setActiveTab('orders');
    }
  }, [highlightOrderId, orders]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return products
      .filter((p) => {
        if (!p.isActive) return false;
        const matchCompany = selectedCompanyId === 'all' || p.companyId === selectedCompanyId;
        const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchSearch =
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.companyName.toLowerCase().includes(term);
        return matchCompany && matchCategory && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        return 0;
      });
  }, [products, selectedCompanyId, selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: Product, qty?: number) => {
    const res = addToCart(product, qty);
    if (res.success) {
      showToast(`✓ ${product.name} savatga qo'shildi!`);
    } else {
      showToast(res.message || "Mahsulotni qo'shib bo'lmadi");
    }
  };

  // Qayta buyurtma: joriy narx va ombor qoldig'i tekshiriladi
  const handleReorder = async (order: Order) => {
    const checkResult = await dbService.checkReorderEligibility(
      order.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
    );

    if (checkResult.warnings.length > 0) {
      alert(
        `Eslatma: Mahsulotlarda o'zgarishlar mavjud:\n- ${checkResult.warnings.join(
          '\n- '
        )}\n\nMavjud tovarlar savatchaga qo'shildi.`
      );
    }

    checkResult.availableItems.forEach(({ product, quantity }) => {
      addToCart(product, quantity);
    });

    onOpenCart();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800 relative">
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Do'kon sarlavhasi */}
      <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-teal-800/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-teal-800 border-2 border-teal-600 flex items-center justify-center font-black text-2xl text-teal-300 shadow-md">
            {currentStore?.name.charAt(0) || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30 uppercase">
                Chakana do'kon kabineti
              </span>
              <span className="text-xs text-teal-400 font-semibold">{currentStore?.phone}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              {currentStore?.name || "Mening Do'konim"}
            </h1>
            <p className="text-xs text-teal-200/80 max-w-lg mt-0.5">
              Egasi: {currentStore?.ownerName} | {currentStore?.address}
            </p>
          </div>
        </div>

        <PortalTabs<StoreTab>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: 'catalog',
              label: (
                <>
                  <Package className="w-4 h-4" />
                  <span>Mahsulotlar katalogi</span>
                </>
              )
            },
            {
              id: 'orders',
              label: (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buyurtmalar tarixi ({orders.length})</span>
                </>
              )
            }
          ]}
        />
      </div>

      {activeTab === 'catalog' && (
        <CatalogTab
          companies={companies}
          products={filteredProducts}
          categories={categories}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={setSelectedCompanyId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onAddToCart={handleAddToCart}
          onOpenCart={onOpenCart}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersTab
          orders={orders}
          onGoToCatalog={() => setActiveTab('catalog')}
          onSelectOrder={setSelectedOrder}
          onReorder={handleReorder}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onReorder={handleReorder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
