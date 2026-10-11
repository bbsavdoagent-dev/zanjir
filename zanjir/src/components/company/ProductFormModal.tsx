import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Product, ProductUnit } from '../../types';
import { dbService } from '../../services/dbService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || 'Sharbatlar');
  const [price, setPrice] = useState(product ? String(product.price) : '10000');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit || 'quti');
  const [minOrderQty, setMinOrderQty] = useState(product ? String(product.minOrderQty) : '5');
  const [stock, setStock] = useState(product ? String(product.stock) : '100');
  const [isActive, setIsActive] = useState(product ? product.isActive : true);
  const [imageUrl, setImageUrl] = useState(
    product?.imageUrl ||
      'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Mahsulot nomini kiriting');
      return;
    }
    const numPrice = Number(price);
    const numMin = Number(minOrderQty);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Narxni to\'g\'ri kiriting');
      return;
    }
    if (isNaN(numMin) || numMin < 1) {
      setErrorMsg('Minimal buyurtma miqdori kamida 1 bo\'lishi shart');
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      setErrorMsg('Ombor qoldig\'i manfiy bo\'lishi mumkin emas');
      return;
    }

    setIsSubmitting(true);
    try {
      if (product) {
        await dbService.updateProduct(product.id, {
          name,
          description,
          category,
          price: numPrice,
          unit,
          minOrderQty: numMin,
          stock: numStock,
          isActive,
          imageUrl
        });
      } else {
        await dbService.addProduct({
          name,
          description,
          category,
          price: numPrice,
          unit,
          minOrderQty: numMin,
          stock: numStock,
          isActive,
          imageUrl
        });
      }
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scale text-slate-800">
        <div className="p-5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <h3 className="font-extrabold text-base">
            {product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 flex items-center justify-center text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mahsulot nomi</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Dinay Olma Sharhati 1L"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tavsifi</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tarkibi, qadoq turi va xususiyatlari..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Toifasi</label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Sharbatlar, Yog', Guruch..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Birlik</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
              >
                <option value="quti">quti (blok)</option>
                <option value="dona">dona</option>
                <option value="kg">kg (kilogramm)</option>
                <option value="litr">litr</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Narx (so'm)</label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Min. buyurtma</label>
              <input
                type="number"
                min="1"
                required
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ombor qoldig'i</label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Rasm URL manzili</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
            <label htmlFor="isActive" className="font-bold text-slate-700 cursor-pointer">
              Mahsulot do'konlar katalogida faol ko'rinsin
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

