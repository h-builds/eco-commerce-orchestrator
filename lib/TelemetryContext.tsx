'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { startTransition } from 'react';
import { WasmTelemetry } from './wasmTelemetry';
import type {
  TelemetryEntry,
  SessionMetrics,
  StressTestStatus,
} from './wasmTelemetry';
import { triggerGlobalRevaluation } from './stressTest';

interface StressTestProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

interface TelemetryContextValue {
  logs: TelemetryEntry[];
  sessionMetrics: SessionMetrics | null;
  stressTestStatus: StressTestStatus;
  clearLogs: () => void;
  pauseStream: boolean;
  setPauseStream: (v: boolean) => void;
  exportSessionMetrics: () => void;
  launchStressTest: (products: StressTestProduct[], simulatedHour: number | null) => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<TelemetryEntry[]>(() => WasmTelemetry.getLogs());
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(() =>
    WasmTelemetry.getSessionMetrics(),
  );
  const [stressTestStatus, setStressTestStatus] = useState<StressTestStatus>(() =>
    WasmTelemetry.getStressTestStatus(),
  );
  const [pauseStream, setPauseStream] = useState(false);

  useEffect(() => {
    const unsubscribe = WasmTelemetry.subscribe(() => {
      if (pauseStream) return;
      setLogs(WasmTelemetry.getLogs());
      setSessionMetrics(WasmTelemetry.getSessionMetrics());
    });
    return unsubscribe;
  }, [pauseStream]);

  useEffect(() => {
    const unsubscribe = WasmTelemetry.subscribeStressTest((status) => {
      setStressTestStatus(status);
    });
    return unsubscribe;
  }, []);

  const clearLogs = useCallback(() => {
    WasmTelemetry.clear();
    WasmTelemetry.setStressTestStatus({ summary: null });
    setLogs([]);
    setSessionMetrics(WasmTelemetry.getSessionMetrics());
    setStressTestStatus(WasmTelemetry.getStressTestStatus());
  }, []);

  const exportSessionMetrics = useCallback(() => {
    const metrics = WasmTelemetry.getSessionMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wasm-session-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const launchStressTest = useCallback(
    (products: StressTestProduct[], simulatedHour: number | null) => {
      if (products.length === 0) return;
      startTransition(() => {
        triggerGlobalRevaluation(products, simulatedHour);
      });
    },
    [],
  );

  const value: TelemetryContextValue = {
    logs,
    sessionMetrics,
    stressTestStatus,
    clearLogs,
    pauseStream,
    setPauseStream,
    exportSessionMetrics,
    launchStressTest,
  };

  return (
    <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useTelemetry must be used within TelemetryProvider');
  }
  return ctx;
}
