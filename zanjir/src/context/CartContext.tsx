import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Product, CartItem } from '../types';
import { CART_STORAGE_KEY } from '../constants/storage';

interface CartActionResult {
  success: boolean;
  message?: string;
}

interface CompanyCartGroup {
  companyName: string;
  items: CartItem[];
  totalAmount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => CartActionResult;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => CartActionResult;
  clearCart: (companyId?: string) => void;
  getItemQuantity: (productId: string) => number;
  totalCount: number;
  getItemsByCompany: () => Record<string, CompanyCartGroup>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);


  // Foydalanuvchi chiqib ketganda savat tozalanadi (boshqa hisobga o'tib qolmasligi uchun)
  const { currentUser } = useAuth();
  const previousUserId = useRef<string | null>(null);
  useEffect(() => {
    const userId = currentUser?.id ?? null;
    if (previousUserId.current && !userId) {
      setItems([]);
    }
    previousUserId.current = userId;
  }, [currentUser?.id]);

  const addToCart = (product: Product, quantity?: number): CartActionResult => {
    const qtyToAdd = quantity ?? product.minOrderQty;

    if (product.stock <= 0) {
      return { success: false, message: 'Kechirasiz, ushbu mahsulot omborda qolmagan' };
    }

    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    const newItems = [...items];

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].quantity;
      const targetQty = currentQty + qtyToAdd;

      if (targetQty > product.stock) {
        return {
          success: false,
          message: `Omborda faqat ${product.stock} ${product.unit} mavjud. Siz allaqachon ${currentQty} ${product.unit} qo'shgansiz.`
        };
      }

      newItems[existingIndex] = {
        ...newItems[existingIndex],
        product, // Update to fresh product details
        quantity: targetQty
      };
    } else {
      if (qtyToAdd < product.minOrderQty) {
        return {
          success: false,
          message: `Minimal buyurtma miqdori: ${product.minOrderQty} ${product.unit}`
        };
      }

      if (qtyToAdd > product.stock) {
        return {
          success: false,
          message: `Omborda faqat ${product.stock} ${product.unit} mavjud`
        };
      }

      newItems.push({
        product,
        quantity: qtyToAdd
      });
    }

    setItems(newItems);
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number): CartActionResult => {
    const item = items.find((i) => i.product.id === productId);
    if (!item) return { success: false, message: 'Mahsulot topilmadi' };

    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    if (quantity < item.product.minOrderQty) {
      return {
        success: false,
        message: `Minimal buyurtma miqdori: ${item.product.minOrderQty} ${item.product.unit}`
      };
    }

    if (quantity > item.product.stock) {
      return {
        success: false,
        message: `Omborda faqat ${item.product.stock} ${item.product.unit} mavjud`
      };
    }

    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = (companyId?: string) => {
    if (companyId) {
      setItems((prev) => prev.filter((i) => i.product.companyId !== companyId));
    } else {
      setItems([]);
    }
  };

  const getItemQuantity = (productId: string): number => {
    const found = items.find((i) => i.product.id === productId);
    return found ? found.quantity : 0;
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getItemsByCompany = () => {
    const grouped: Record<string, CompanyCartGroup> = {};
    for (const item of items) {
      const cId = item.product.companyId;
      if (!grouped[cId]) {
        grouped[cId] = {
          companyName: item.product.companyName,
          items: [],
          totalAmount: 0
        };
      }
      grouped[cId].items.push(item);
      grouped[cId].totalAmount += item.product.price * item.quantity;
    }
    return grouped;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        totalCount,
        getItemsByCompany
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
