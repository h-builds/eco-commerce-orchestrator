'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export interface StressTestProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

interface StressTestRegistryValue {
  products: StressTestProduct[];
  simulatedHour: number | null;
  setProducts: (products: StressTestProduct[], simulatedHour: number | null) => void;
}

const StressTestRegistryContext = createContext<StressTestRegistryValue | null>(null);

export function StressTestRegistryProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<StressTestProduct[]>([]);
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);

  const setProducts = useCallback(
    (p: StressTestProduct[], h: number | null) => {
      setProductsState(p);
      setSimulatedHour(h);
    },
    [],
  );

  const value: StressTestRegistryValue = {
    products,
    simulatedHour,
    setProducts,
  };

  return (
    <StressTestRegistryContext.Provider value={value}>
      {children}
    </StressTestRegistryContext.Provider>
  );
}

export function useStressTestRegistry(): StressTestRegistryValue {
  const ctx = useContext(StressTestRegistryContext);
  if (!ctx) {
    throw new Error('useStressTestRegistry must be used within StressTestRegistryProvider');
  }
  return ctx;
}
