import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus, Product, Store } from '../../types';
import { dbService } from '../../services/dbService';
import { useCompanyStats } from '../../hooks/useCompanyStats';
import { DashboardTab } from './DashboardTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { StoresTab } from './StoresTab';
import { OrderDetailModal } from './OrderDetailModal';
import { ProductFormModal } from './ProductFormModal';
import { PortalTabs } from '../common/PortalTabs';

type CompanyTab = 'dashboard' | 'products' | 'orders' | 'stores';

/** "Tez to'ldirish" tugmasi qo'shadigan miqdor. */
const QUICK_RESTOCK_QTY = 50;

export const CompanyPortal: React.FC = () => {
  const { currentUser, currentCompany } = useAuth();

  const [activeTab, setActiveTab] = useState<CompanyTab>('dashboard');

  // Real vaqt ma'lumotlari
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Modallar va forma holati
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');

  // Filtrlar
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');

  const companyId = currentUser?.companyId || currentCompany?.id || '';

  useEffect(() => {
    if (!companyId) return;

    const unsubProducts = dbService.subscribeProducts(setProducts, companyId);
    const unsubOrders = dbService.subscribeOrders(setOrders);
    const unsubStores = dbService.subscribeStores(setStores);

    return () => {
      unsubProducts();
      unsubOrders();
      unsubStores();
    };
  }, [companyId]);

  // Real vaqtda yangilanganda ochiq turgan buyurtmani ham yangilab turamiz
  useEffect(() => {
    if (!selectedOrder) return;
    const refreshed = orders.find((o) => o.id === selectedOrder.id);
    if (refreshed) {
      setSelectedOrder(refreshed);
    }
  }, [orders]);

  const stats = useCompanyStats(orders, products);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase();
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
      const matchCategory = productCategory === 'all' || p.category === productCategory;
      return matchSearch && matchCategory;
    });
  }, [products, productSearch, productCategory]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => orderStatusFilter === 'all' || o.status === orderStatusFilter),
    [orders, orderStatusFilter]
  );

  const handleProgressStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await dbService.updateOrderStatus({
        orderId,
        newStatus: nextStatus,
        note: statusUpdateNote
      });
      setStatusUpdateNote('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  };

  const handleQuickRestock = async (productId: string, currentStock: number) => {
    try {
      await dbService.updateProduct(productId, { stock: currentStock + QUICK_RESTOCK_QTY });
    } catch (err) {
      console.error('Restock error', err);
    }
  };

  const openProductModal = (product: Product | null) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800">
      {/* Kompaniya sarlavhasi */}
      <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-800/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-800 border-2 border-emerald-600 flex items-center justify-center font-black text-2xl text-emerald-300 shadow-md">
            {currentCompany?.name.charAt(0) || 'K'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase">
                Ishlab chiqaruvchi portali
              </span>
              <span className="text-xs text-emerald-400 font-semibold">{currentCompany?.phone}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              {currentCompany?.name || 'Kompaniya Kabineti'}
            </h1>
            <p className="text-xs text-emerald-200/80 max-w-lg mt-0.5">
              {currentCompany?.category} | {currentCompany?.address}
            </p>
          </div>
        </div>

        <PortalTabs<CompanyTab>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'products', label: `Mahsulotlar (${products.length})` },
            {
              id: 'orders',
              label: (
                <>
                  Buyurtmalar ({orders.length})
                  {stats.newOrdersCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </>
              )
            },
            { id: 'stores', label: "Hamkor do'konlar" }
          ]}
        />
      </div>

      {activeTab === 'dashboard' && (
        <DashboardTab
          stats={stats}
          orders={orders}
          onQuickRestock={handleQuickRestock}
          onShowAllOrders={() => setActiveTab('orders')}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {activeTab === 'products' && (
        <ProductsTab
          products={filteredProducts}
          categories={categories}
          search={productSearch}
          onSearchChange={setProductSearch}
          category={productCategory}
          onCategoryChange={setProductCategory}
          onAddProduct={() => openProductModal(null)}
          onEditProduct={openProductModal}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersTab
          orders={filteredOrders}
          statusFilter={orderStatusFilter}
          onStatusFilterChange={setOrderStatusFilter}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {activeTab === 'stores' && <StoresTab stores={stores} orders={orders} />}

      {showProductModal && (
        <ProductFormModal
          isOpen={showProductModal}
          onClose={closeProductModal}
          product={editingProduct}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          statusNote={statusUpdateNote}
          onStatusNoteChange={setStatusUpdateNote}
          onProgressStatus={handleProgressStatus}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
