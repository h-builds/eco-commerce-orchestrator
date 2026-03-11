'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Product } from '@/components/molecules/ProductCard';

interface CompareContextValue {
  selectedProducts: Product[];
  toggleProduct: (product: Product) => void;
  clearComparison: () => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (isOpen: boolean) => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const toggleProduct = useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        // Replace the last item or just block. Blocking is safer.
        // Or we can replace the oldest. Let's block for simplicity,
        // but maybe show a toast. For now, just silently ignore or replace.
        // Let's replace the 3rd item to be user friendly.
        return [...prev.slice(0, 2), product];
      }
      return [...prev, product];
    });
  }, []);

  const clearComparison = useCallback(() => {
    setSelectedProducts([]);
    setIsCompareModalOpen(false);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        selectedProducts,
        toggleProduct,
        clearComparison,
        isCompareModalOpen,
        setIsCompareModalOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
