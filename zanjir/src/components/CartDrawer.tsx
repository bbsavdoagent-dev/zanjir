import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  Calendar,
  Phone,
  FileText
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { formatUZS } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
  onOpenAuth: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onOpenAuth
}) => {
  const { items, updateQuantity, removeFromCart, clearCart, getItemsByCompany } = useCart();
  const { currentUser, currentStore, isAuthenticated } = useAuth();

  const [checkoutCompanyId, setCheckoutCompanyId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState(
    currentStore?.address || currentUser?.address || 'Toshkent shahar, Chilonzor tumani'
  );
  const [phone, setPhone] = useState(
    currentStore?.phone || currentUser?.phone || '+998 '
  );
  const [comment, setComment] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderNumber: string;
    orderId: string;
  } | null>(null);

  if (!isOpen) return null;

  const grouped = getItemsByCompany();
  const companyIds = Object.keys(grouped);

  // If entering checkout for a specific company
  const activeCompanyCheckout = checkoutCompanyId ? grouped[checkoutCompanyId] : null;

  const handleStartCheckout = (companyId: string) => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    setCheckoutCompanyId(companyId);
    setOrderError('');
    setOrderSuccessData(null);
  };

  const handleConfirmOrder = async () => {
    if (!checkoutCompanyId || !activeCompanyCheckout || !currentUser) return;
    setOrderError('');

    if (!deliveryAddress.trim()) {
      setOrderError('Yetkazib berish manzilini kiriting');
      return;
    }
    if (!phone || phone.length < 9) {
      setOrderError('Telefon raqamini to\'liq kiriting');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        companyId: checkoutCompanyId,
        storeId: currentUser.storeId || '',
        contactPhone: phone,
        items: activeCompanyCheckout.items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity
        })),
        deliveryAddress,
        comment,
        deliveryDate
      };

      const result = await dbService.placeOrder(orderPayload);
      setIsSubmitting(false);

      if (result.success) {
        setOrderSuccessData({
          orderNumber: result.orderNumber,
          orderId: result.orderId
        });
        clearCart(checkoutCompanyId);
      } else {
        setOrderError('Buyurtma rasmiylashtirishda xatolik yuz berdi');
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setOrderError(err instanceof Error ? err.message : 'Kutilmagan xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                {checkoutCompanyId ? 'Buyurtmani rasmiylashtirish' : 'Savatchangiz'}
              </h3>
              <p className="text-[11px] text-emerald-300">
                {items.length} xil mahsulot tanlangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 flex items-center justify-center text-emerald-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* SUCCESS STATE */}
          {orderSuccessData ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
                  Buyurtma #{orderSuccessData.orderNumber}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Buyurtmangiz qabul qilindi!
                </h3>
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Buyurtma to'g'ridan-to'g'ri ishlab chiqaruvchi kompaniyaga yuborildi. Ombor qoldig'i avtomatik kamaytirildi va holat o'zgarganda xabar olasiz.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const id = orderSuccessData.orderId;
                    setOrderSuccessData(null);
                    setCheckoutCompanyId(null);
                    onOrderSuccess(id);
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
                >
                  Buyurtmani kuzatish
                </button>
                <button
                  onClick={() => {
                    setOrderSuccessData(null);
                    setCheckoutCompanyId(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Boshqa savatlarni ko'rish
                </button>
              </div>
            </div>
          ) : checkoutCompanyId && activeCompanyCheckout ? (
            /* CHECKOUT FORM VIEW FOR SPECIFIC COMPANY */
            <div className="space-y-5 text-slate-800">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-900">
                    Ta'minotchi: {activeCompanyCheckout.companyName}
                  </span>
                  <button
                    onClick={() => setCheckoutCompanyId(null)}
                    className="text-[11px] font-semibold text-emerald-700 underline"
                  >
                    O'zgartirish
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700">
                  {activeCompanyCheckout.items.length} xil mahsulot | Jami: {formatUZS(activeCompanyCheckout.totalAmount)}
                </p>
              </div>

              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yetkazib berish manzili
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Do'kon manzili"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bog'lanish uchun telefon
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Istalgan yetkazib berish sanasi
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kuryer va ombor uchun izoh (ixtiyoriy)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Masalan: To'lov hisob-faktura orqali, tushdan keyin olib keling..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Items Summary list */}
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-600 mb-2">Mahsulotlar ro'yxati:</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeCompanyCheckout.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.quantity} {item.product.unit} × {formatUZS(item.product.price)}
                          </p>
                        </div>
                        <span className="font-extrabold text-slate-900 shrink-0">
                          {formatUZS(item.quantity * item.product.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* EMPTY CART */
            <div className="py-20 text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Savatchangiz bo'sh</p>
              <p className="text-xs max-w-xs mx-auto">
                Katalogdan ishlab chiqaruvchilar mahsulotlarini tanlab, to'g'ridan-to'g'ri buyurtma bering.
              </p>
            </div>
          ) : (
            /* GROUPED CART VIEW (By Company) */
            <div className="space-y-6">
              {companyIds.map((cId) => {
                const group = grouped[cId];
                return (
                  <div
                    key={cId}
                    className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-800" />
                        <span className="font-bold text-xs text-slate-900">
                          {group.companyName}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-800">
                        {formatUZS(group.totalAmount)}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 p-2 space-y-2">
                      {group.items.map((item) => {
                        const { product, quantity } = item;
                        return (
                          <div
                            key={product.id}
                            className="p-2 flex items-center justify-between gap-3 text-xs"
                          >
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-100"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-slate-900 truncate">
                                {product.name}
                              </h5>
                              <p className="text-[11px] text-slate-500">
                                {formatUZS(product.price)} / {product.unit}
                              </p>
                              {product.stock <= 10 && (
                                <p className="text-[10px] text-amber-700 font-medium">
                                  Omborda qoldiq: {product.stock} {product.unit}
                                </p>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold text-slate-900">
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                disabled={quantity >= product.stock}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-700 font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="w-6 h-6 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">
                          Paket summasi:
                        </span>
                        <p className="text-xs font-black text-slate-900">
                          {formatUZS(group.totalAmount)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartCheckout(cId)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <span>Rasmiylashtirish</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions for checkout */}
        {checkoutCompanyId && activeCompanyCheckout && !orderSuccessData && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Jami to'lov:</span>
              <p className="text-base font-black text-emerald-900">
                {formatUZS(activeCompanyCheckout.totalAmount)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCheckoutCompanyId(null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-md disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
