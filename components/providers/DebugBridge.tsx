'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TelemetryProvider } from '@/lib/TelemetryContext';
import { DebugConsole } from '@/components/organisms/DebugConsole';

const DEBUG_STORAGE_KEY = 'eco-debug-console';

function useDebugEnabled(): boolean {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('debug') === 'true';

  const [fromStorage, setFromStorage] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFromStorage(localStorage.getItem(DEBUG_STORAGE_KEY) === 'true');
  }, []);

  const enabled = fromUrl || fromStorage;
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;
    localStorage.setItem(DEBUG_STORAGE_KEY, 'true');
  }, [enabled]);

  return enabled;
}

export function DebugBridge() {
  const debugEnabled = useDebugEnabled();
  const [isConsoleOpen, setConsoleOpen] = useState(true);

  if (!debugEnabled) return null;

  return (
    <TelemetryProvider>
      <DebugConsole isConsoleOpen={isConsoleOpen} setConsoleOpen={setConsoleOpen} />
    </TelemetryProvider>
  );
}
