import React from 'react';
import { Package, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Product } from '../../types';
import { dbService } from '../../services/dbService';
import { formatUZS } from '../../utils/formatters';

interface ProductsTabProps {
  products: Product[];
  categories: string[];
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  categories,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onAddProduct,
  onEditProduct
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls: Search, Category, Add Product Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Mahsulot nomi yoki toifasi bo'yicha qidirish..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'Barcha toifalar' : c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddProduct}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi mahsulot qo'shish</span>
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
          <Package className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <p className="font-semibold text-sm text-slate-600">Mahsulot topilmadi</p>
          <p className="text-xs">Qidiruv parametrlarini o'zgartiring yoki yangi tovar qo'shing.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="relative h-40 bg-slate-100 overflow-hidden">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold">
                    {p.category}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.isActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-400 text-white'
                    }`}
                  >
                    {p.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-black text-sm text-slate-900 line-clamp-1">{p.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-base font-black text-emerald-900">
                      {formatUZS(p.price)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">1 {p.unit} uchun</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                    <span>Min. buyurtma: {p.minOrderQty} {p.unit}</span>
                    <span
                      className={`font-bold ${
                        p.stock <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-800'
                      }`}
                    >
                      Ombor: {p.stock} {p.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => onEditProduct(p)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`"${p.name}" mahsuloti o'chirilsinmi?`)) {
                      await dbService.deleteProduct(p.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
