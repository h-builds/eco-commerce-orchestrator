'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SimulationContextValue {
  /** null = live system time; 0-23 = simulated hour override */
  simulatedHour: number | null;
  setSimulatedHour: (hour: number | null) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SimulationContext = createContext<SimulationContextValue>({
  simulatedHour: null,
  setSimulatedHour: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);

  return (
    <SimulationContext.Provider value={{ simulatedHour, setSimulatedHour }}>
      {children}
    </SimulationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSimulation(): SimulationContextValue {
  return useContext(SimulationContext);
}
