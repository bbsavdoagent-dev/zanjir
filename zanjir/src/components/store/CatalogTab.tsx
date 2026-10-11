import React from 'react';
import { Package, Search, Plus, Tag } from 'lucide-react';
import { Company, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { LOW_STOCK_THRESHOLD } from '../../constants/defaults';
import { formatUZS } from '../../utils/formatters';

export type CatalogSort = 'popular' | 'price_asc' | 'price_desc';

interface CatalogTabProps {
  companies: Company[];
  products: Product[];
  categories: string[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: CatalogSort;
  onSortChange: (value: CatalogSort) => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onOpenCart: () => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  companies,
  products,
  categories,
  selectedCompanyId,
  onSelectCompany,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onAddToCart,
  onOpenCart
}) => {
  const { getItemQuantity } = useCart();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Supplier Companies Carousel / Selectors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ishlab chiqaruvchi korxonalar:
          </h3>
          <span className="text-xs text-slate-400">{companies.length} ta hamkor zavod</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div
            onClick={() => onSelectCompany('all')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              selectedCompanyId === 'all'
                ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                ALL
              </div>
              <h4 className="font-extrabold text-xs text-slate-900">Barcha kompaniyalar</h4>
            </div>
            <p className="text-[11px] text-slate-500">Yagona katalogdan qidirish</p>
          </div>

          {companies.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCompany(c.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedCompanyId === c.id
                  ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={c.logoUrl}
                  alt={c.name}
                  className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="truncate">
                  <h4 className="font-extrabold text-xs text-slate-900 truncate">{c.name}</h4>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate">
                    {c.category}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{c.address}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search, Category and Sort Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Mahsulot nomi, toifasi yoki zavod nomi..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Barcha toifalar' : cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as CatalogSort)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
          >
            <option value="popular">Tavsiya etilgan</option>
            <option value="price_asc">Narx: arzondan qimmatga</option>
            <option value="price_desc">Narx: qimmatdan arzonga</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
          <Package className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <p className="font-semibold text-sm text-slate-600">Mahsulot topilmadi</p>
          <p className="text-xs">Boshqa kalit so'z yoki toifani tanlab ko'ring.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const inCartQty = getItemQuantity(p.id);
            const isOutOfStock = p.stock <= 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-200 text-[10px] font-bold">
                      {p.companyName}
                    </span>
                  </div>

                  {p.stock <= LOW_STOCK_THRESHOLD && !isOutOfStock && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                        Faqat {p.stock} {p.unit} qoldi
                      </span>
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold">
                        Tugagan (Omborda yo'q)
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mb-0.5">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span>{p.category}</span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 line-clamp-1">{p.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div>
                        <span className="text-base font-black text-emerald-900">
                          {formatUZS(p.price)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          1 {p.unit} uchun ulgurji narx
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Min: {p.minOrderQty} {p.unit}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Qoldiq: {p.stock} {p.unit}
                        </span>
                      </div>
                    </div>

                    {/* Cart CTA */}
                    {isOutOfStock ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                      >
                        Hozircha sotuvda yo'q
                      </button>
                    ) : inCartQty > 0 ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-1.5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-900 pl-2">
                          Savatda: {inCartQty} {p.unit}
                        </span>
                        <button
                          onClick={onOpenCart}
                          className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Savatga o'tish
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddToCart(p, p.minOrderQty)}
                        className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Savatga qo'shish ({p.minOrderQty} {p.unit})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
