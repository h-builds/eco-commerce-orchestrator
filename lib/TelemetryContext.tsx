'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { WasmTelemetry } from './wasmTelemetry';
import type { TelemetryEntry, SessionMetrics } from './wasmTelemetry';

interface TelemetryContextValue {
  logs: TelemetryEntry[];
  sessionMetrics: SessionMetrics | null;
  clearLogs: () => void;
  pauseStream: boolean;
  setPauseStream: (v: boolean) => void;
  exportSessionMetrics: () => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<TelemetryEntry[]>(() => WasmTelemetry.getLogs());
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(() =>
    WasmTelemetry.getSessionMetrics(),
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

  const clearLogs = useCallback(() => {
    WasmTelemetry.clear();
    setLogs([]);
    setSessionMetrics(WasmTelemetry.getSessionMetrics());
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

  const value: TelemetryContextValue = {
    logs,
    sessionMetrics,
    clearLogs,
    pauseStream,
    setPauseStream,
    exportSessionMetrics,
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
