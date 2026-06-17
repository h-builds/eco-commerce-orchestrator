'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';


interface SimulationContextValue {
  /** null = live system time; 0-23 = simulated hour override */
  simulatedHour: number | null;
  setSimulatedHour: (hour: number | null) => void;
}


const SimulationContext = createContext<SimulationContextValue>({
  simulatedHour: null,
  setSimulatedHour: () => {},
});


export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);

  return (
    <SimulationContext.Provider value={{ simulatedHour, setSimulatedHour }}>
      {children}
    </SimulationContext.Provider>
  );
}


export function useSimulation(): SimulationContextValue {
  return useContext(SimulationContext);
}
